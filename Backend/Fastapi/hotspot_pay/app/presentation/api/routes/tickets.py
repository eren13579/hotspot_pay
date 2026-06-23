import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.application.services.ticket_service import TicketService
from app.application.services.router_action_service import RouterActionService
from app.domain.models.ticket import Ticket, TicketStatus
from app.domain.models.session import HotspotSession, SessionStatus
from app.domain.models.router_action import RouterActionType
from app.infrastructure.repositories.ticket_repository import TicketRepository
from app.infrastructure.repositories.session_repository import SessionRepository
from app.infrastructure.repositories.router_action_repository import RouterActionRepository
from app.presentation.api.schemas.ticket_schemas import (
    TicketImportRequest,
    TicketImportResult,
    TicketItemSchema,
    TicketActivateRequest,
    TicketActivateDirectRequest,
    TicketResponse,
    TicketListResponse,
    TicketValidateResponse,
    PortalConnectRequest,
    PortalConnectResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/tickets", tags=["Tickets — Inter-Service"])


def get_ticket_service(db: AsyncSession = Depends(get_db)) -> TicketService:
    return TicketService(TicketRepository(db))


def get_session_service(db: AsyncSession = Depends(get_db)):
    from app.presentation.api.routes.sessions import SessionService
    return SessionService(SessionRepository(db))


def get_action_service(db: AsyncSession = Depends(get_db)) -> RouterActionService:
    return RouterActionService(RouterActionRepository(db))


# ── Helpers ────────────────────────────────────────────────────────────────────


def _parse_uptime_to_minutes(uptime: Optional[str]) -> int:
    """Convert MikroTik uptime string to minutes.

    Supported formats:
      - "DD:HH:MM:SS" (eg "1:02:30:00" = 1d 2h 30min)
      - "HH:MM:SS"   (eg "02:30:00" = 2h 30min)
      - "H:MM:SS"    (eg "2:30:00")
      - "Xh"          (eg "2h")
      - "Xm"          (eg "120m")
    Returns 0 if unlimited or unknown format.
    """
    if not uptime or not uptime.strip():
        return 0
    try:
        if ":" in uptime:
            parts = uptime.strip().split(":")
            if len(parts) == 4:
                d, h, m = int(parts[0]), int(parts[1]), int(parts[2])
                return d * 1440 + h * 60 + m
            elif len(parts) >= 2:
                h, m = int(parts[0]), int(parts[1])
                return h * 60 + m
        uptime = uptime.strip()
        if uptime.endswith("h"):
            return int(uptime[:-1].strip()) * 60
        if uptime.endswith("m"):
            return int(uptime[:-1].strip())
    except (ValueError, IndexError):
        logging.getLogger(__name__).warning("Format uptime non reconnu: '%s'", uptime)
    return 0


def _build_duration_label(session: Optional[HotspotSession], expired: bool) -> str:
    if not session or not session.expires_at:
        return ""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    expires = session.expires_at
    if isinstance(expires, datetime) and expires.tzinfo is not None:
        expires = expires.replace(tzinfo=None)
    remaining = expires - now
    mins = int(remaining.total_seconds() // 60)
    if expired or mins <= 0:
        return "Expirée"
    if mins < 60:
        return f"{mins} min restante(s)"
    return f"{mins // 60}h{mins % 60}min restante(s)"


def _portal_response(ticket: Ticket, session: Optional[HotspotSession]) -> dict:
    """Build the portal connect response dict from ticket + session data."""
    expired = session is not None and session.expires_at is not None
    if expired and isinstance(session.expires_at, datetime):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        expires = session.expires_at
        if isinstance(expires, datetime) and expires.tzinfo is not None:
            expires = expires.replace(tzinfo=None)
        expired = expires < now

    session_expired = expired or (session is not None and session.status == SessionStatus.EXPIRED)

    return PortalConnectResponse(
        success=True,
        message="Votre session a expiré." if session_expired else "Connexion active — votre WiFi fonctionne.",
        username=ticket.username,
        password=ticket.password,
        profile=ticket.profile,
        uptime_limit=ticket.time_limit,
        session_id=ticket.session_id,
        activated_at=session.activated_at if session else None,
        expires_at=session.expires_at if session else None,
        duration_label=_build_duration_label(session, expired),
        expired=session_expired,
        ticket_status=ticket.status.value,
    ).model_dump(by_alias=True)


# ── Routes portail captif (publiques — accessibles sans API key depuis le hotspot) ──


@router.post("/portal/connect")
async def portal_connect(
    request: PortalConnectRequest,
    ticket_service: TicketService = Depends(get_ticket_service),
    session_service=Depends(get_session_service),
    action_service: RouterActionService = Depends(get_action_service),
):
    """Connect with a WiFi ticket via the captive portal."""
    # 1. Find ticket
    ticket = await ticket_service.get_ticket_by_username(request.hotspot_id, request.username)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable — vérifiez votre username")

    # 2. Validate password
    if ticket.password != request.password:
        raise HTTPException(status_code=403, detail="Password incorrect")

    # 3. Already used with active session → return existing info
    if ticket.status == TicketStatus.USED and ticket.session_id:
        session = await session_service.get_by_session_id(ticket.session_id)
        return _portal_response(ticket, session)

    # 4. Check revoked / expired
    if ticket.status == TicketStatus.REVOKED:
        return PortalConnectResponse(
            success=False, message="Ce ticket a été révoqué.",
            username=ticket.username, ticket_status=ticket.status.value,
        ).model_dump(by_alias=True)

    if ticket.status == TicketStatus.EXPIRED:
        return PortalConnectResponse(
            success=False, message="Ce ticket a expiré.",
            username=ticket.username, expired=True, ticket_status=ticket.status.value,
        ).model_dump(by_alias=True)

    # 5. Create a pending session
    duration_minutes = _parse_uptime_to_minutes(ticket.time_limit)
    session_id = str(uuid.uuid4())
    session = HotspotSession(
        session_id=session_id,
        hotspot_id=request.hotspot_id,
        plan_id=f"TICKET_{ticket.ticket_id}",
        client_phone=request.phone,
        client_mac=request.mac.upper() if request.mac else None,
        mikrotik_username=ticket.username,
        mikrotik_password=ticket.password,
        status=SessionStatus.PENDING,
        activated_at=datetime.now(timezone.utc).replace(tzinfo=None),
        expires_at=(datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=duration_minutes)
                    if duration_minutes > 0 else datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=365)),
    )
    session = await session_service.create(session)

    # 6. Mark ticket as USED
    await ticket_service.mark_ticket_used(ticket.ticket_id, session_id, request.mac, request.phone)

    # 7. Reload ticket with updated fields so _portal_response reflects the change
    ticket = await ticket_service.get_ticket_by_username(request.hotspot_id, request.username)

    # 8. Create router action (CREATE_USER) for MikroTik
    try:
        await action_service.create_action_from_ticket(
            hotspot_id=request.hotspot_id,
            username=ticket.username,
            password=ticket.password,
            profile=ticket.profile,
            time_limit=ticket.time_limit,
            data_limit=ticket.data_limit,
            comment=f"HP:{session_id}",
        )
    except Exception as e:
        logging.getLogger(__name__).warning(
            "Portal connect: échec création action router pour user=%s hotspot=%s: %s",
            ticket.username, request.hotspot_id, e,
        )

    logging.getLogger(__name__).info(
        "Ticket connecté via portal: username=%s hotspot=%s session=%s",
        ticket.username, request.hotspot_id, session_id,
    )

    return _portal_response(ticket, session)


@router.get("/portal/{hotspot_id}/{username}/info")
async def portal_ticket_info(
    hotspot_id: str,
    username: str,
    ticket_service: TicketService = Depends(get_ticket_service),
    session_service=Depends(get_session_service),
):
    """Get ticket info for the captive portal (status, session, expiry)."""
    ticket = await ticket_service.get_ticket_by_username(hotspot_id, username)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")

    session = None
    if ticket.session_id:
        session = await session_service.get_by_session_id(ticket.session_id)

    return _portal_response(ticket, session)


@router.post("/import", response_model=TicketImportResult)
async def import_tickets(
    request: TicketImportRequest,
    ticket_service: TicketService = Depends(get_ticket_service),
):
    """Import tickets into a hotspot (called by main Java service)."""
    imported, skipped, skipped_usernames = await ticket_service.import_tickets(
        hotspot_id=request.hotspot_id,
        user_id="system",
        tickets_data=[t.model_dump() for t in request.tickets],
    )

    return TicketImportResult(
        total=len(request.tickets),
        imported=imported,
        skipped=skipped,
        skipped_usernames=skipped_usernames if skipped_usernames else None,
        message=f"{imported} ticket(s) importé(s)"
                + (f", {skipped} doublon(s) ignoré(s)" if skipped else ""),
    )


@router.post("/activate")
async def activate_ticket(
    request: TicketActivateRequest,
    ticket_service: TicketService = Depends(get_ticket_service),
    action_service: RouterActionService = Depends(get_action_service),
):
    """Activate an existing ticket — creates a CREATE_USER action for the router.

    Called by the main Java service for pre-imported tickets.
    Requires the ticket to exist in FastAPI's DB.
    """
    ticket = await ticket_service.get_ticket_by_username(request.hotspot_id, request.username)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket introuvable")

    action = await action_service.create_action_from_ticket(
        hotspot_id=request.hotspot_id,
        username=request.username,
        password=request.password,
        profile=request.profile,
        time_limit=request.time_limit,
        data_limit=request.data_limit,
        comment=request.comment,
    )

    return {
        "status": "activated",
        "action_id": action.action_id,
        "hotspot_id": request.hotspot_id,
        "username": request.username,
        "message": "Ticket activé — en attente du routeur MikroTik",
    }


@router.post("/activate-direct")
async def activate_direct(
    request: TicketActivateDirectRequest,
    action_service: RouterActionService = Depends(get_action_service),
):
    """Activate generated credentials directly — creates a CREATE_USER action.

    Called by the main Java service for Mobile Money payments where credentials
    are generated on-the-fly (no pre-imported ticket).
    Does NOT require a ticket to exist in FastAPI's DB.
    """
    action = await action_service.create_action(
        hotspot_id=request.hotspot_id,
        action_type=RouterActionType.CREATE_USER,
        username=request.username,
        password=request.password,
        profile=request.profile,
        time_limit=request.time_limit,
        data_limit=request.data_limit,
        comment=request.comment,
        mac_address=request.mac_address,
    )

    return {
        "status": "activated",
        "action_id": action.action_id,
        "hotspot_id": request.hotspot_id,
        "username": request.username,
        "message": "Credentials activated — awaiting MikroTik router",
    }


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    hotspot_id: str,
    ticket_service: TicketService = Depends(get_ticket_service),
):
    """List all tickets for a hotspot."""
    tickets = await ticket_service.list_by_hotspot(hotspot_id)
    return TicketListResponse(
        hotspot_id=hotspot_id,
        total=len(tickets),
        tickets=[TicketResponse(
            id=t.id,
            ticket_id=t.ticket_id,
            hotspot_id=t.hotspot_id,
            user_id=t.user_id,
            username=t.username,
            password=t.password,
            profile=t.profile,
            time_limit=t.time_limit,
            data_limit=t.data_limit,
            comment=t.comment,
            status=t.status.value,
            session_id=t.session_id,
            client_mac=t.client_mac,
            client_phone=t.client_phone,
            used_at=t.used_at,
            expires_at=t.expires_at,
            created_at=t.created_at,
            updated_at=t.updated_at,
        ) for t in tickets],
    )


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    ticket_service: TicketService = Depends(get_ticket_service),
):
    """Get a single ticket by its public ticket_id."""
    ticket = await ticket_service.get_by_ticket_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketResponse(
        id=ticket.id,
        ticket_id=ticket.ticket_id,
        hotspot_id=ticket.hotspot_id,
        user_id=ticket.user_id,
        username=ticket.username,
        password=ticket.password,
        profile=ticket.profile,
        time_limit=ticket.time_limit,
        data_limit=ticket.data_limit,
        comment=ticket.comment,
        status=ticket.status.value,
        session_id=ticket.session_id,
        client_mac=ticket.client_mac,
        client_phone=ticket.client_phone,
        used_at=ticket.used_at,
        expires_at=ticket.expires_at,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.post("/{ticket_id}/revoke")
async def revoke_ticket(
    ticket_id: str,
    ticket_service: TicketService = Depends(get_ticket_service),
):
    """Revoke a ticket (marks it as REVOKED)."""
    success = await ticket_service.revoke_ticket(ticket_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"success": True, "message": "Ticket revoked", "ticket_id": ticket_id}


@router.post("/{ticket_id}/validate", response_model=TicketValidateResponse)
async def validate_ticket(
    ticket_id: str,
    ticket_service: TicketService = Depends(get_ticket_service),
):
    """Check if a ticket is valid and available."""
    ticket = await ticket_service.get_by_ticket_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_valid = ticket.status.value == "AVAILABLE"
    messages = {
        "AVAILABLE": "Ticket is available",
        "USED": "Ticket has already been used",
        "EXPIRED": "Ticket has expired",
        "REVOKED": "Ticket has been revoked",
    }

    return TicketValidateResponse(
        valid=is_valid,
        status=ticket.status.value,
        ticket_id=ticket.ticket_id,
        username=ticket.username,
        hotspot_id=ticket.hotspot_id,
        message=messages.get(ticket.status.value, "Unknown status"),
    )


@router.delete("")
async def delete_all_tickets(
    hotspot_id: str,
    ticket_service: TicketService = Depends(get_ticket_service),
):
    """Delete all tickets for a hotspot."""
    count = await ticket_service.delete_all_by_hotspot(hotspot_id)
    return {"success": True, "message": f"{count} ticket(s) supprimé(s)", "count": count}


@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    ticket_service: TicketService = Depends(get_ticket_service),
):
    """Delete a single ticket."""
    success = await ticket_service.delete_by_id(ticket_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"success": True, "message": "Ticket deleted", "ticket_id": ticket_id}
