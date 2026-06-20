"""
Sessions routes — list, retrieve, revoke hotspot client sessions.

Inline SessionService (stub) delegates to SessionRepository (to be created).
Revoke creates a REMOVE_USER RouterAction via the existing RouterActionService.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.domain.models.session import HotspotSession, SessionStatus
from app.domain.models.router_action import RouterActionType
from app.infrastructure.repositories.session_repository import SessionRepository
from app.infrastructure.repositories.router_action_repository import RouterActionRepository
from app.application.services.router_action_service import RouterActionService
from app.presentation.api.schemas.session_schemas import (
    SessionResponse,
    SessionListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sessions", tags=["Sessions"])


# ---------------------------------------------------------------------------
# Inline SessionService (stub) — delegates to SessionRepository
# ---------------------------------------------------------------------------

class SessionService:
    """Business logic for hotspot client sessions."""

    def __init__(self, session_repo: SessionRepository):
        self._repo = session_repo

    async def create(self, session: HotspotSession) -> HotspotSession:
        return await self._repo.create(session)

    async def list_by_hotspot(self, hotspot_id: str) -> List[HotspotSession]:
        return await self._repo.get_by_hotspot_id(hotspot_id)

    async def get_by_session_id(self, session_id: str) -> Optional[HotspotSession]:
        return await self._repo.get_by_session_id(session_id)

    async def revoke(self, session: HotspotSession) -> HotspotSession:
        session.revoke()
        session.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        return await self._repo.update(session)

    async def list_active(self) -> List[HotspotSession]:
        return await self._repo.get_all_active()

    async def list_all(self, status: Optional[str] = None) -> List[HotspotSession]:
        """Return ALL sessions globally, optionally filtered by status."""
        return await self._repo.get_all(status)

    async def list_expired(self) -> List[HotspotSession]:
        return await self._repo.get_expired_sessions()

    async def delete(self, session_id: str) -> bool:
        session = await self._repo.get_by_session_id(session_id)
        if not session:
            return False
        return await self._repo.delete(session_id)


def get_session_service(db: AsyncSession = Depends(get_db)) -> SessionService:
    return SessionService(SessionRepository(db))


def get_action_service(db: AsyncSession = Depends(get_db)) -> RouterActionService:
    return RouterActionService(RouterActionRepository(db))


def _session_to_response(session: HotspotSession) -> dict:
    """Convert a HotspotSession domain model to the standard SessionResponse dict."""
    return SessionResponse.model_validate(session).model_dump()


# ---------------------------------------------------------------------------
# Routes  (expired MUST be listed before {session_id} to avoid path conflict)
# ---------------------------------------------------------------------------


@router.get("/active")
async def list_active_sessions(
    session_service: SessionService = Depends(get_session_service),
):
    """List all currently ACTIVE sessions across all hotspots (polling endpoint)."""
    sessions = await session_service.list_active()
    return {
        "success": True,
        "data": {
            "total": len(sessions),
            "sessions": [_session_to_response(s) for s in sessions],
        },
    }


@router.get("/expired")
async def list_expired_sessions(
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    session_service: SessionService = Depends(get_session_service),
):
    """List expired sessions (for cleanup / reconciliation)."""
    sessions = await session_service.list_expired()
    return {"success": True, "data": [_session_to_response(s) for s in sessions]}


@router.get("/all")
async def list_all_sessions(
    status: Optional[str] = Query(None, description="Filtrer par statut (ACTIVE, EXPIRED, REVOKED, PENDING, PENDING_MIKROTIK)"),
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    session_service: SessionService = Depends(get_session_service),
):
    """List all sessions across all hotspots, optionally filtered by status."""
    sessions = await session_service.list_all(status)
    return {
        "success": True,
        "data": {
            "total": len(sessions),
            "sessions": [_session_to_response(s) for s in sessions],
        },
    }


@router.get("/hotspot/{hotspot_id}")
async def list_sessions_by_hotspot(
    hotspot_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    session_service: SessionService = Depends(get_session_service),
):
    """List all sessions for a given hotspot."""
    sessions = await session_service.list_by_hotspot(hotspot_id)
    return {
        "success": True,
        "data": {
            "hotspot_id": hotspot_id,
            "total": len(sessions),
            "sessions": [_session_to_response(s) for s in sessions],
        },
    }


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    session_service: SessionService = Depends(get_session_service),
):
    """Get a single session by ID."""
    session = await session_service.get_by_session_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "data": _session_to_response(session)}


@router.post("/{session_id}/revoke")
async def revoke_session(
    session_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    session_service: SessionService = Depends(get_session_service),
    action_service: RouterActionService = Depends(get_action_service),
):
    """Revoke a session and enqueue a REMOVE_USER action for the router."""
    session = await session_service.get_by_session_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update session status to REVOKED
    await session_service.revoke(session)

    # Enqueue a REMOVE_USER action for the MikroTik router
    try:
        await action_service.create_action(
            hotspot_id=session.hotspot_id,
            action_type=RouterActionType.REMOVE_USER,
            username=session.mikrotik_username,
            password="",
            profile=session.profile,
            comment=f"HP:{session.session_id}",
        )
        logger.info(
            "REMOVE_USER action enqueued for revoked session=%s user=%s",
            session_id, session.mikrotik_username,
        )
    except Exception as e:
        logger.error(
            "Failed to enqueue REMOVE_USER action for session=%s: %s",
            session_id, e,
        )
        # Session is already revoked locally; do not block the response

    return {"success": True, "message": f"Session {session_id} revoked"}


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    user_id: str = Header(..., description="UUID de l'utilisateur (injecté par Java)"),
    session_service: SessionService = Depends(get_session_service),
):
    """Permanently delete a session (expired / revoked cleanup)."""
    deleted = await session_service.delete(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "message": f"Session {session_id} deleted"}
