"""
Payments routes — initiate, validate, webhook, list, and retrieve payments.

FastAPI est la source de vérité pour les hotspots et les plans.
L'initiation de paiement valide d'abord hotspot + plan dans la DB FastAPI.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.domain.models.payment import Payment, PaymentStatus
from app.infrastructure.repositories.payment_repository import PaymentRepository
from app.infrastructure.repositories.hotspot_repository import HotspotRepository
from app.infrastructure.repositories.plan_repository import PlanRepository
from app.presentation.api.schemas.payment_schemas import (
    PaymentInitRequest,
    PaymentResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])


# ---------------------------------------------------------------------------
# PaymentService — business logic for mobile-money payments
# ---------------------------------------------------------------------------

class PaymentService:
    """Business logic for mobile-money payments."""

    def __init__(self, payment_repo: PaymentRepository):
        self._repo = payment_repo

    async def initiate(
        self,
        hotspot_id: str,
        plan_id: str,
        client_phone: str,
        client_mac: Optional[str] = None,
        operator: str = "",
        amount: str = "0",
    ) -> Payment:
        import uuid

        short_id = uuid.uuid4().hex[:8].upper()
        reference = f"HP-{short_id}"

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        payment = Payment(
            id=str(uuid.uuid4()),
            payment_id=str(uuid.uuid4()),
            reference=reference,
            hotspot_id=hotspot_id,
            plan_id=plan_id,
            client_phone=client_phone,
            client_mac=client_mac,
            operator=operator,
            amount=amount,
            currency="XAF",
            status=PaymentStatus.PENDING,
            created_at=now,
            updated_at=now,
        )
        saved = await self._repo.create(payment)
        logger.info(
            "Payment initiated payment_id=%s ref=%s hotspot=%s amount=%s",
            saved.payment_id, reference, hotspot_id, amount,
        )
        return saved

    async def process_webhook(
        self,
        operator: str,
        payload: dict,
    ) -> Optional[Payment]:
        """Process an operator webhook, locate the payment, and update its status."""
        reference = (
            payload.get("reference")
            or payload.get("ref")
            or payload.get("tx_ref")
        )
        gateway_tx_id = (
            payload.get("transaction_id")
            or payload.get("txId")
            or payload.get("gateway_tx_id")
            or payload.get("txid")
        )
        payment = None
        if reference:
            payment = await self._repo.get_by_reference(reference)
        if not payment and gateway_tx_id:
            payment = await self._repo.get_by_gateway_tx_id(gateway_tx_id)

        if not payment:
            logger.warning("Webhook: no matching payment ref=%s tx=%s", reference, gateway_tx_id)
            return None

        raw_status = (
            payload.get("status")
            or payload.get("state")
            or ""
        ).lower()

        success_keywords = ("success", "completed", "confirmed", "paid", "successful")
        failure_keywords = ("failed", "cancelled", "canceled", "expired", "error", "reversed")

        if any(k in raw_status for k in success_keywords):
            new_status = PaymentStatus.SUCCESS
            payment.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
        elif any(k in raw_status for k in failure_keywords):
            new_status = PaymentStatus.FAILED
            payment.failure_reason = payload.get("reason") or payload.get("failure_reason") or raw_status
        else:
            logger.info("Webhook: unhandled status '%s' for payment=%s", raw_status, payment.payment_id)
            return payment

        payment.status = new_status
        if gateway_tx_id:
            payment.gateway_tx_id = gateway_tx_id
        payment.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

        updated = await self._repo.update(payment)
        logger.info(
            "Payment updated via webhook payment_id=%s status=%s operator=%s",
            updated.payment_id, new_status.value, operator,
        )
        return updated

    async def list_by_hotspot(self, hotspot_id: str) -> List[Payment]:
        return await self._repo.get_by_hotspot_id(hotspot_id)

    async def get_by_payment_id(self, payment_id: str) -> Optional[Payment]:
        return await self._repo.get_by_payment_id(payment_id)


# ---------------------------------------------------------------------------
# HotspotPlanValidator — validates hotspot + plan before payment initiation
# ---------------------------------------------------------------------------

class HotspotPlanValidator:
    """Validates that a hotspot and plan exist (source of truth = FastAPI DB)."""

    def __init__(self, hotspot_repo: HotspotRepository, plan_repo: PlanRepository):
        self._hotspot_repo = hotspot_repo
        self._plan_repo = plan_repo

    async def validate(self, hotspot_id: str, plan_id: str) -> dict:
        """Validate hotspot + plan. Returns plan details on success, raises on failure."""
        hotspot = await self._hotspot_repo.get_by_hotspot_id(hotspot_id)
        if not hotspot:
            raise HTTPException(status_code=404, detail="Hotspot introuvable")

        plan = await self._plan_repo.get_by_plan_id_and_hotspot(plan_id, hotspot_id)
        if not plan:
            raise HTTPException(
                status_code=404,
                detail="Forfait introuvable pour ce hotspot"
            )

        if not plan.is_active:
            raise HTTPException(status_code=400, detail="Ce forfait n'est plus disponible")

        return {
            "valid": True,
            "hotspot_id": hotspot_id,
            "hotspot_name": hotspot.name,
            "plan_id": plan_id,
            "plan_name": plan.name,
            "price": plan.price,
            "currency": plan.currency if hasattr(plan, 'currency') and plan.currency else "XAF",
            "duration_minutes": plan.duration_minutes,
            "hotspot_profile": plan.hotspot_profile,
        }


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

def get_payment_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    return PaymentService(PaymentRepository(db))


def get_validator(db: AsyncSession = Depends(get_db)) -> HotspotPlanValidator:
    return HotspotPlanValidator(HotspotRepository(db), PlanRepository(db))


def _payment_to_response(payment: Payment) -> dict:
    """Convert a Payment domain model to the standard PaymentResponse dict."""
    return PaymentResponse.model_validate(payment).model_dump()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/initiate", status_code=201)
async def initiate_payment(
    request: PaymentInitRequest,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    payment_service: PaymentService = Depends(get_payment_service),
    validator: HotspotPlanValidator = Depends(get_validator),
):
    """Initier un paiement — valide hotspot + plan via FastAPI, puis crée l'enregistrement."""
    # Valider le hotspot et le plan dans la DB FastAPI
    validated = await validator.validate(request.hotspot_id, request.plan_id)

    payment = await payment_service.initiate(
        hotspot_id=request.hotspot_id,
        plan_id=request.plan_id,
        client_phone=request.client_phone,
        client_mac=request.client_mac,
        operator=request.operator,
        amount=validated["price"],
    )
    return {"success": True, "data": _payment_to_response(payment)}


@router.get("/validate-hotspot-plan/{hotspot_id}/{plan_id}")
async def validate_hotspot_plan(
    hotspot_id: str,
    plan_id: str,
    validator: HotspotPlanValidator = Depends(get_validator),
):
    """Valider qu'un hotspot + forfait existent dans la DB FastAPI.

    Utilisé par Java avant d'initier un paiement côté gateway (Moneroo/CamPay).
    Retourne les infos du plan (prix, devise, durée) si valide.
    """
    result = await validator.validate(hotspot_id, plan_id)
    return {"success": True, "data": result}


@router.post("/webhook/{operator}")
async def payment_webhook(
    operator: str,
    request: Request,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Receive operator payment webhook (raw JSON payload)."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    updated = await payment_service.process_webhook(operator, payload)
    if not updated:
        logger.warning("Webhook %s: no matching payment found payload=%s", operator, payload)
        return {"success": False, "message": "Payment not found"}

    return {"success": True, "data": _payment_to_response(updated)}


@router.get("/hotspot/{hotspot_id}")
async def list_payments_by_hotspot(
    hotspot_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    payment_service: PaymentService = Depends(get_payment_service),
):
    """List all payments for a given hotspot."""
    payments = await payment_service.list_by_hotspot(hotspot_id)
    return {"success": True, "data": [_payment_to_response(p) for p in payments]}


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get a single payment by ID."""
    payment = await payment_service.get_by_payment_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"success": True, "data": _payment_to_response(payment)}
