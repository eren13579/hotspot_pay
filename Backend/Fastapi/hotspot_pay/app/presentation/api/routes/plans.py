"""
Plans routes — CRUD for hotspot pricing plans.

Inline PlanService (stub) delegates to PlanRepository (to be created).
"""
import logging
from typing import Optional, List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.domain.models.plan import Plan
from app.infrastructure.repositories.plan_repository import PlanRepository
from app.presentation.api.schemas.plan_schemas import (
    CreatePlanRequest,
    UpdatePlanRequest,
    PlanResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/hotspots/{hotspot_id}/plans",
    tags=["Plans"],
)


# ---------------------------------------------------------------------------
# Inline PlanService (stub) — delegates to PlanRepository
# ---------------------------------------------------------------------------

class PlanService:
    """Business logic for hotspot pricing plans."""

    def __init__(self, plan_repo: PlanRepository):
        self._repo = plan_repo

    async def create(
        self,
        hotspot_id: str,
        name: str,
        description: Optional[str] = None,
        duration_minutes: int = 0,
        price: str = "0",
        currency: str = "XAF",
        download_speed_kbps: Optional[int] = None,
        upload_speed_kbps: Optional[int] = None,
        data_limit_mb: Optional[int] = None,
        display_order: int = 0,
        hotspot_profile: str = "default",
    ) -> Plan:
        import uuid
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        plan = Plan(
            id=str(uuid.uuid4()),
            plan_id=str(uuid.uuid4()),
            hotspot_id=hotspot_id,
            name=name,
            description=description,
            duration_minutes=duration_minutes,
            price=price,
            currency=currency,
            download_speed_kbps=download_speed_kbps,
            upload_speed_kbps=upload_speed_kbps,
            data_limit_mb=data_limit_mb,
            display_order=display_order,
            hotspot_profile=hotspot_profile or "default",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        saved = await self._repo.create(plan)
        logger.info("Plan created plan_id=%s hotspot=%s", saved.plan_id, hotspot_id)
        return saved

    async def list_by_hotspot(self, hotspot_id: str) -> List[Plan]:
        return await self._repo.get_by_hotspot_id(hotspot_id)

    async def list_active(self, hotspot_id: str) -> List[Plan]:
        return await self._repo.get_active_by_hotspot(hotspot_id)

    async def get_by_plan_id(self, plan_id: str) -> Optional[Plan]:
        return await self._repo.get_by_plan_id(plan_id)

    async def update(self, plan: Plan) -> Optional[Plan]:
        updated = await self._repo.update(plan)
        if updated:
            logger.info("Plan updated plan_id=%s", plan.plan_id)
        return updated

    async def toggle_active(self, plan_id: str) -> Optional[Plan]:
        plan = await self._repo.get_by_plan_id(plan_id)
        if not plan:
            return None
        plan.is_active = not plan.is_active
        plan.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        return await self._repo.update(plan)

    async def delete(self, plan_id: str) -> bool:
        plan = await self._repo.get_by_plan_id(plan_id)
        if not plan:
            return False
        await self._repo.delete(plan_id)
        logger.info("Plan deleted plan_id=%s", plan_id)
        return True


def get_plan_service(db: AsyncSession = Depends(get_db)) -> PlanService:
    return PlanService(PlanRepository(db))


def _plan_to_response(plan: Plan) -> dict:
    """Convert a Plan domain model to the standard PlanResponse dict."""
    return PlanResponse.model_validate(plan).model_dump()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("", status_code=201)
@router.post("/", status_code=201)
async def create_plan(
    hotspot_id: str,
    request: CreatePlanRequest,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Create a new plan for the hotspot."""
    plan = await plan_service.create(
        hotspot_id=hotspot_id,
        name=request.name,
        description=request.description,
        duration_minutes=request.duration_minutes,
        price=request.price,
        currency=request.currency,
        download_speed_kbps=request.download_speed_kbps,
        upload_speed_kbps=request.upload_speed_kbps,
        data_limit_mb=request.data_limit_mb,
        display_order=request.display_order or 0,
        hotspot_profile=request.hotspot_profile or "default",
    )
    return {"success": True, "data": _plan_to_response(plan)}


@router.get("")
@router.get("/")
async def list_plans(
    hotspot_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    plan_service: PlanService = Depends(get_plan_service),
):
    """List all plans for a hotspot (including inactive)."""
    plans = await plan_service.list_by_hotspot(hotspot_id)
    return {"success": True, "data": [_plan_to_response(p) for p in plans]}


@router.get("/active")
async def list_active_plans(
    hotspot_id: str,
    plan_service: PlanService = Depends(get_plan_service),
):
    """List active public plans (no auth required)."""
    plans = await plan_service.list_active(hotspot_id)
    return {"success": True, "data": [_plan_to_response(p) for p in plans]}


@router.get("/{plan_id}")
async def get_plan(
    hotspot_id: str,
    plan_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Get a single plan by ID."""
    plan = await plan_service.get_by_plan_id(plan_id)
    if not plan or plan.hotspot_id != hotspot_id:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"success": True, "data": _plan_to_response(plan)}


@router.put("/{plan_id}")
async def update_plan(
    hotspot_id: str,
    plan_id: str,
    request: UpdatePlanRequest,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Update an existing plan."""
    plan = await plan_service.get_by_plan_id(plan_id)
    if not plan or plan.hotspot_id != hotspot_id:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Apply only the fields that were provided (not None)
    update_fields = {
        "name": request.name,
        "description": request.description,
        "duration_minutes": request.duration_minutes,
        "price": request.price,
        "currency": request.currency,
        "download_speed_kbps": request.download_speed_kbps,
        "upload_speed_kbps": request.upload_speed_kbps,
        "data_limit_mb": request.data_limit_mb,
        "display_order": request.display_order,
        "hotspot_profile": request.hotspot_profile,
        "is_active": request.is_active,
    }
    changed = False
    for field, value in update_fields.items():
        if value is not None:
            setattr(plan, field, value)
            changed = True

    if not changed:
        return {"success": True, "data": _plan_to_response(plan)}

    plan.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    updated = await plan_service.update(plan)
    if not updated:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"success": True, "data": _plan_to_response(updated)}


@router.post("/{plan_id}/toggle")
@router.patch("/{plan_id}/toggle")
async def toggle_plan_active(
    hotspot_id: str,
    plan_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Toggle the active/inactive status of a plan."""
    plan = await plan_service.get_by_plan_id(plan_id)
    if not plan or plan.hotspot_id != hotspot_id:
        raise HTTPException(status_code=404, detail="Plan not found")

    updated = await plan_service.toggle_active(plan_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {
        "success": True,
        "message": f"Plan {'activated' if updated.is_active else 'deactivated'}",
    }


@router.delete("/{plan_id}")
async def delete_plan(
    hotspot_id: str,
    plan_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    plan_service: PlanService = Depends(get_plan_service),
):
    """Delete a plan."""
    plan = await plan_service.get_by_plan_id(plan_id)
    if not plan or plan.hotspot_id != hotspot_id:
        raise HTTPException(status_code=404, detail="Plan not found")

    ok = await plan_service.delete(plan_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"success": True, "message": "Plan deleted"}
