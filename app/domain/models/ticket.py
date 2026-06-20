from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid


# PostgreSQL DateTime columns are timezone-naive (TIMESTAMP not TIMESTAMPTZ).
# Use _utcnow() to produce offset-naive UTC datetimes consistent with the DB schema.
def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class TicketStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    USED = "USED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


@dataclass
class Ticket:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str = field(default_factory=lambda: "tkt_" + uuid.uuid4().hex[:12])
    hotspot_id: str = ""
    user_id: str = ""
    username: str = ""
    password: str = ""
    profile: str = "default"
    time_limit: Optional[str] = None
    data_limit: Optional[int] = None
    comment: Optional[str] = None
    status: TicketStatus = TicketStatus.AVAILABLE
    session_id: Optional[str] = None
    client_mac: Optional[str] = None
    client_phone: Optional[str] = None
    used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)

    def mark_used(self, session_id: str, client_mac: str = None, client_phone: str = None) -> None:
        self.status = TicketStatus.USED
        self.session_id = session_id
        self.client_mac = client_mac
        self.client_phone = client_phone
        self.used_at = _utcnow()
        self.updated_at = self.used_at

    def mark_revoked(self) -> None:
        self.status = TicketStatus.REVOKED
        self.updated_at = _utcnow()

    def mark_expired(self) -> None:
        self.status = TicketStatus.EXPIRED
        self.updated_at = _utcnow()
