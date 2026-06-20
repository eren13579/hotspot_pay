"""
Subscription routes — SaaS plan management.

Now reads subscription plans from the DB (subscription_plans table)
instead of hardcoded AVAILABLE_PLANS list. Admin CRUD for plan
modification (price + advantages) available at /api/v1/admin/subscriptions/plans.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.domain.models.subscription_plan import SubscriptionPlan
from app.infrastructure.repositories.subscription_plan_repository import SubscriptionPlanRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/subscriptions", tags=["Subscriptions"])


# ── Schemas ──────────────────────────────────────────────


class SubscriptionPlanResponse(BaseModel):
    plan_id: str
    name: str
    description: Optional[str] = None
    price: int
    currency: str
    duration_months: int
    advantages: dict
    is_active: bool


class UpdateSubscriptionPlanRequest(BaseModel):
    price: Optional[int] = None
    description: Optional[str] = None
    advantages: Optional[dict] = None
    is_active: Optional[bool] = None


class SubscriptionResponse(BaseModel):
    subscription_id: str
    plan_name: str
    amount: str
    currency: str
    status: str
    starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


class CreateSubscriptionRequest(BaseModel):
    plan_name: str
    duration_months: int = 1
    currency: str = "XAF"


# ── Admin routes ──────────────────────────────────────────

admin_router = APIRouter(prefix="/api/v1/admin/subscriptions/plans", tags=["Admin Subscriptions"])


def get_repo(db: AsyncSession = Depends(get_db)) -> SubscriptionPlanRepository:
    return SubscriptionPlanRepository(db)


@admin_router.get("")
async def admin_list_plans(repo: SubscriptionPlanRepository = Depends(get_repo)):
    """List all subscription plans (admin)."""
    plans = await repo.get_all()
    return {"success": True, "data": [_plan_to_dict(p) for p in plans]}


@admin_router.get("/{plan_id}")
async def admin_get_plan(plan_id: str, repo: SubscriptionPlanRepository = Depends(get_repo)):
    """Get a specific subscription plan (admin)."""
    plan = await repo.get_by_plan_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan introuvable")
    return {"success": True, "data": _plan_to_dict(plan)}


@admin_router.patch("/{plan_id}")
async def admin_update_plan(
    plan_id: str,
    request: UpdateSubscriptionPlanRequest,
    repo: SubscriptionPlanRepository = Depends(get_repo),
):
    """Update price and/or advantages of a subscription plan (admin)."""
    plan = await repo.get_by_plan_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan introuvable")

    if request.price is not None:
        plan.price = request.price
    if request.description is not None:
        plan.description = request.description
    if request.advantages is not None:
        plan.advantages = request.advantages
    if request.is_active is not None:
        plan.is_active = request.is_active
    plan.updated_at = datetime.now(timezone.utc)

    await repo.update(plan)
    logger.info("Plan %s mis à jour: price=%s, advantages keys=%s",
                plan_id, plan.price, list(plan.advantages.keys()) if plan.advantages else [])
    return {"success": True, "message": "Plan mis à jour", "data": _plan_to_dict(plan)}


# ── Helper ────────────────────────────────────────────────


def _plan_to_dict(p: SubscriptionPlan) -> dict:
    return {
        "plan_id": p.plan_id,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "currency": p.currency,
        "duration_months": p.duration_months,
        "advantages": p.advantages,
        "is_active": p.is_active,
    }


# ── Service ──────────────────────────────────────────────


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self._db = db
        self._plan_repo = SubscriptionPlanRepository(db)

    async def get_available_plans(self) -> List[dict]:
        """Return active subscription plans from DB."""
        plans = await self._plan_repo.get_all_active()
        return [_plan_to_dict(p) for p in plans]

    async def get_current(self, user_id: str) -> Optional[dict]:
        async with self._db as session:
            result = await session.execute(
                text("""
                    SELECT subscription_id, plan_name, amount, currency, status,
                           starts_at, expires_at, created_at
                    FROM subscriptions
                    WHERE user_id = :uid AND status IN ('ACTIVE', 'PENDING')
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"uid": user_id},
            )
            row = result.fetchone()
            if not row:
                return None
            cols = ["subscription_id", "plan_name", "amount", "currency",
                    "status", "starts_at", "expires_at", "created_at"]
            return dict(zip(cols, row))

    async def create(self, user_id: str, plan_name: str, duration_months: int, currency: str) -> dict:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        sub_id = str(uuid.uuid4())
        start = now
        expires = start.replace(
            month=(start.month + duration_months - 1) % 12 + 1,
            year=start.year + (start.month + duration_months - 1) // 12,
        ) if duration_months > 0 else None

        # Get price from DB-backed plan
        plan = await self._plan_repo.get_by_plan_id(plan_name.lower())
        price = plan.price if plan else 0

        async with self._db as session:
            await session.execute(
                text("""
                    INSERT INTO subscriptions
                        (id, subscription_id, user_id, plan_name, amount, currency,
                         duration_months, status, starts_at, expires_at, created_at, updated_at)
                    VALUES
                        (:id, :sid, :uid, :plan, :amount, :curr,
                         :dur, 'ACTIVE', :start, :expires, :now, :now)
                """),
                {
                    "id": str(uuid.uuid4()),
                    "sid": sub_id,
                    "uid": user_id,
                    "plan": plan_name,
                    "amount": str(price),
                    "curr": currency,
                    "dur": duration_months,
                    "start": start,
                    "expires": expires,
                    "now": now,
                },
            )
            await session.commit()

        return {
            "subscription_id": sub_id,
            "plan_name": plan_name,
            "amount": str(price),
            "status": "ACTIVE",
            "starts_at": start,
            "expires_at": expires,
        }


def get_sub_service(db: AsyncSession = Depends(get_db)) -> SubscriptionService:
    return SubscriptionService(db)


# ── Public Routes ────────────────────────────────────────


@router.get("/plans")
async def list_plans(service: SubscriptionService = Depends(get_sub_service)):
    """List available subscription plans (public, from DB)."""
    plans = await service.get_available_plans()
    return {"success": True, "data": plans}


@router.get("/me")
async def get_my_subscription(
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    service: SubscriptionService = Depends(get_sub_service),
):
    """Get current user's active subscription."""
    sub = await service.get_current(user_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Aucun abonnement actif trouvé")
    return {"success": True, "data": sub}


@router.post("")
async def create_subscription(
    request: CreateSubscriptionRequest,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    service: SubscriptionService = Depends(get_sub_service),
):
    """Create a new subscription."""
    sub = await service.create(user_id, request.plan_name, request.duration_months, request.currency)
    return {"success": True, "message": "Abonnement créé avec succès", "data": sub}
