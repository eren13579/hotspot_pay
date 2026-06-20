import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.config.settings import get_settings
from app.application.services.hotspot_service import HotspotService
from app.application.services.router_action_service import RouterActionService
from app.infrastructure.repositories.hotspot_repository import HotspotRepository
from app.infrastructure.repositories.router_action_repository import RouterActionRepository
from app.infrastructure.messaging.action_queue import action_queue
from app.domain.models.router_action import RouterActionType
from app.presentation.api.schemas.router_action_schemas import (
    PendingActionsResponse,
    ActionAckRequest,
    CreateActionRequest,
    RouterActionResponse,
)

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/api/v1/router", tags=["Router Long Polling"])


def get_hotspot_service(db: AsyncSession = Depends(get_db)) -> HotspotService:
    return HotspotService(HotspotRepository(db))


def get_action_service(db: AsyncSession = Depends(get_db)) -> RouterActionService:
    return RouterActionService(RouterActionRepository(db))


def _action_to_response(action) -> RouterActionResponse:
    return RouterActionResponse.from_action(action)


@router.get("/{hotspot_id}/pending-actions", response_model=PendingActionsResponse)
async def long_poll_pending_actions(
    hotspot_id: str,
    token: str = Query(..., description="Router token for authentication"),
    x_router_token: Optional[str] = Header(None, alias="X-Router-Token"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
    action_service: RouterActionService = Depends(get_action_service),
):
    """Long Polling endpoint for MikroTik routers.

    The router calls this endpoint and the connection stays open for up to
    LONG_POLL_TIMEOUT seconds. If a pending action exists, it's returned
    immediately. Otherwise, the server waits and returns empty after timeout.

    The router should call this again immediately after receiving a response.
    """
    # Validate router token
    effective_token = token or x_router_token
    if not effective_token:
        raise HTTPException(status_code=401, detail="Missing router token")

    hotspot = await hotspot_service.get_by_hotspot_id(hotspot_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found")

    if not hotspot_service.validate_router_token(hotspot, effective_token):
        raise HTTPException(status_code=403, detail="Invalid router token")

    # Register the ping (router is online)
    await hotspot_service.register_router_ping(hotspot_id)

    # Check for pending actions first (instant response)
    pending = await action_service.get_pending_actions(hotspot_id)
    if pending:
        actions_data = [_action_to_response(a) for a in pending]
        for a in pending:
            await action_queue.mark_delivered(a.action_id)
        logger.info("Long Poll: %d action(s) returned instantly for hotspot=%s",
                     len(pending), hotspot_id)
        return PendingActionsResponse(count=len(actions_data), actions=actions_data)

    # Wait for new actions via async queue (Long Polling)
    action = await action_queue.wait_for_actions(
        hotspot_id, timeout=settings.LONG_POLL_TIMEOUT)

    if action:
        await action_queue.mark_delivered(action.action_id)
        logger.info("Long Poll: action delivered after wait action_id=%s hotspot=%s",
                     action.action_id, hotspot_id)
        return PendingActionsResponse(
            count=1,
            actions=[_action_to_response(action)],
        )

    # Timeout — no actions
    return PendingActionsResponse(count=0, actions=[])


@router.post("/{hotspot_id}/actions/{action_id}/done")
async def ack_action(
    hotspot_id: str,
    action_id: str,
    ack: ActionAckRequest,
    token: str = Query(...),
    x_router_token: Optional[str] = Header(None, alias="X-Router-Token"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
    action_service: RouterActionService = Depends(get_action_service),
):
    """ACK endpoint — router confirms action execution."""
    effective_token = token or x_router_token
    if not effective_token:
        raise HTTPException(status_code=401, detail="Missing router token")

    hotspot = await hotspot_service.get_by_hotspot_id(hotspot_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found")

    if not hotspot_service.validate_router_token(hotspot, effective_token):
        raise HTTPException(status_code=403, detail="Invalid router token")

    success = await action_service.ack_action(action_id, ack.success, ack.error)
    if not success:
        raise HTTPException(status_code=404, detail="Action not found")

    return {"status": "ack_received", "action_id": action_id, "success": ack.success}


@router.get("/agent/router-config")
async def get_router_config(
    token: str = Query(..., description="Router token"),
    x_router_token: Optional[str] = Header(None, alias="X-Router-Token"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """
    Endpoint pour l'agent HotspotPay.

    Récupère la configuration complète du routeur:
    - IP, port, user, password
    - Marque et modèle du routeur
    - Token du hotspot

    L'agent utilise ce endpoint pour se configurer automatiquement.
    """
    effective_token = token or x_router_token
    if not effective_token:
        raise HTTPException(status_code=401, detail="Missing router token")

    # Trouver le hotspot dont le token correspond
    # On doit chercher tous les hotspots et comparer les tokens
    from sqlalchemy import select
    from app.infrastructure.persistence.schemas import HotspotSchema
    result = await hotspot_service._repo._session.execute(
        select(HotspotSchema)
    )
    all_hotspots = result.scalars().all()

    for hs in all_hotspots:
        if hs.router_token and hotspot_service.validate_router_token(hs, effective_token):
            return {
                "hotspot_id": hs.hotspot_id,
                "hotspot_name": hs.name,
                "router_ip": hs.mikrotik_ip,
                "router_port": hs.mikrotik_port,
                "router_user": hs.mikrotik_user,
                "router_pass": hs.mikrotik_password_enc,
                "router_brand": hs.router_brand,
                "router_type": hs.router_type,
                "model_id": hs.model_id,
            }

    raise HTTPException(status_code=403, detail="Invalid router token")


@router.post("/actions/create")
async def create_action(
    request: CreateActionRequest,
    action_service: RouterActionService = Depends(get_action_service),
):
    """Create a router action (CREATE_USER, REMOVE_USER, KICK_SESSION).

    Called by the main Java service to enqueue actions for the MikroTik router.
    No router token required — this is an inter-service endpoint protected by API key.
    """
    try:
        action_type = RouterActionType(request.action_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action type: {request.action_type}. Must be one of: CREATE_USER, REMOVE_USER, KICK_SESSION"
        )

    action = await action_service.create_action(
        hotspot_id=request.hotspot_id,
        action_type=action_type,
        username=request.username,
        password=request.password,
        profile=request.profile or "default",
        time_limit=request.time_limit,
        data_limit=request.data_limit,
        comment=request.comment,
        mac_address=request.mac_address,
    )

    return {
        "status": "created",
        "action_id": action.action_id,
        "hotspot_id": request.hotspot_id,
        "action_type": request.action_type,
        "username": request.username,
        "message": "Action created — awaiting MikroTik router",
    }
