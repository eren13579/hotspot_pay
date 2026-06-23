from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.presentation.api.schemas.base import CamelBase


class TicketItemSchema(CamelBase):
    """Single ticket from CSV/import data."""
    username: str = Field(..., min_length=1, max_length=255, description="Username MikroTik")
    password: str = Field(..., min_length=1, max_length=255, description="Password MikroTik")
    profile: Optional[str] = Field(default="default", max_length=100, description="Profil Hotspot (ex: 1mois-3000)")
    time_limit: Optional[str] = Field(default=None, max_length=50, description="Limite de durée (ex: 4w2d)")
    data_limit: Optional[int] = Field(default=None, ge=0, description="Limite de données en octets (ex: 6291456)")
    comment: Optional[str] = Field(default=None, max_length=500, description="Commentaire (ex: up-759-05.10.26-)")


class TicketImportRequest(CamelBase):
    """Request to import tickets into a hotspot."""
    hotspot_id: str = Field(..., description="Hotspot ID")
    tickets: List[TicketItemSchema] = Field(..., min_length=1, max_length=500)


class TicketImportResult(BaseModel):
    total: int
    imported: int
    skipped: int
    skipped_usernames: Optional[List[str]] = None
    message: str


class TicketActivateRequest(CamelBase):
    """Body for POST /tickets/activate — activate a pre-imported ticket."""
    hotspot_id: str = Field(..., description="Hotspot ID")
    username: str = Field(..., description="MikroTik username")
    password: str = Field(..., description="MikroTik password")
    profile: Optional[str] = Field(default="default", description="HotSpot profile")
    time_limit: Optional[str] = Field(default=None, description="Time limit (e.g. 4w2d)")
    data_limit: Optional[int] = Field(default=None, description="Data limit in bytes")
    comment: Optional[str] = Field(default=None, description="Comment (e.g. HP:sessionId)")


class TicketActivateDirectRequest(CamelBase):
    """Body for POST /tickets/activate-direct — activate generated credentials."""
    hotspot_id: str = Field(..., description="Hotspot ID")
    username: str = Field(..., description="MikroTik username")
    password: str = Field(..., description="MikroTik password")
    profile: Optional[str] = Field(default="default", description="HotSpot profile")
    time_limit: Optional[str] = Field(default=None, description="Time limit (e.g. 4w2d)")
    data_limit: Optional[str] = Field(default=None, description="Data limit en octets (string)")
    comment: Optional[str] = Field(default=None, description="Comment (e.g. HP:sessionId)")
    mac_address: str = Field(..., description="MAC address du client (OBLIGATOIRE)")


class TicketResponse(BaseModel):
    """Full ticket data returned to API consumers."""
    id: str
    ticket_id: str
    hotspot_id: str
    user_id: str
    username: str
    password: str
    profile: str
    time_limit: Optional[str] = None
    data_limit: Optional[int] = None
    comment: Optional[str] = None
    status: str
    session_id: Optional[str] = None
    client_mac: Optional[str] = None
    client_phone: Optional[str] = None
    used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TicketListResponse(BaseModel):
    """Paginated list of tickets."""
    hotspot_id: str
    total: int
    tickets: List[TicketResponse]


class TicketValidateResponse(BaseModel):
    """Ticket validation result."""
    valid: bool
    status: str
    ticket_id: str
    username: str
    hotspot_id: str
    message: str


# ── Portal captif ─────────────────────────────────────────────────────────────


class PortalConnectRequest(CamelBase):
    """Body for POST /tickets/portal/connect — captive portal ticket login."""
    hotspot_id: str = Field(..., description="Hotspot ID")
    username: str = Field(..., description="MikroTik username du ticket")
    password: str = Field(..., description="Mot de passe du ticket")
    mac: Optional[str] = Field(default=None, description="Adresse MAC du client")
    phone: Optional[str] = Field(default=None, description="Numéro de téléphone du client")


class PortalConnectResponse(BaseModel):
    """Response returned to the captive portal after ticket connect."""
    success: bool
    message: str
    username: Optional[str] = None
    password: Optional[str] = None
    profile: Optional[str] = None
    uptime_limit: Optional[str] = Field(default=None, alias="uptimeLimit")
    session_id: Optional[str] = Field(default=None, alias="sessionId")
    activated_at: Optional[datetime] = Field(default=None, alias="activatedAt")
    expires_at: Optional[datetime] = Field(default=None, alias="expiresAt")
    duration_label: Optional[str] = Field(default=None, alias="durationLabel")
    expired: bool = False
    ticket_status: Optional[str] = Field(default=None, alias="ticketStatus")
