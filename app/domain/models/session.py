from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional
import uuid


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class SessionStatus(str, Enum):
    PENDING = "PENDING"
    PENDING_MIKROTIK = "PENDING_MIKROTIK"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"


@dataclass
class HotspotSession:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    hotspot_id: str = ""
    plan_id: Optional[str] = None
    payment_id: Optional[str] = None
    client_phone: Optional[str] = None
    client_mac: Optional[str] = None
    mikrotik_username: str = ""
    mikrotik_password: str = ""
    profile: str = "default"
    status: SessionStatus = SessionStatus.PENDING
    bytes_in: int = 0
    bytes_out: int = 0
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)

    def activate(self) -> None:
        self.status = SessionStatus.ACTIVE
        self.activated_at = _utcnow()
        self.updated_at = self.activated_at

    def mark_expired(self) -> None:
        self.status = SessionStatus.EXPIRED
        self.updated_at = _utcnow()

    def revoke(self) -> None:
        self.status = SessionStatus.REVOKED
        self.updated_at = _utcnow()
