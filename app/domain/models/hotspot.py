from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid


class HotspotStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    NO_TOKEN = "NO_TOKEN"
    NEVER_POLLED = "NEVER"


@dataclass
class Hotspot:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    hotspot_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    name: str = ""
    location: Optional[str] = None
    mikrotik_ip: str = ""
    mikrotik_port: int = 8728
    mikrotik_user: str = ""
    mikrotik_password_enc: str = ""
    hotspot_profile: str = "default"
    router_brand: str = "mikrotik"
    router_type: Optional[str] = None
    is_online: bool = False
    router_token: Optional[str] = None
    model_id: Optional[str] = None
    last_ping_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def _now_naive(self) -> datetime:
        return datetime.now(timezone.utc).replace(tzinfo=None)

    def mark_online(self) -> None:
        self.is_online = True
        self.last_ping_at = self._now_naive()
        self.updated_at = self.last_ping_at

    def mark_offline(self) -> None:
        self.is_online = False
        self.updated_at = self._now_naive()

    def set_router_token(self, token: str) -> None:
        self.router_token = token
        self.updated_at = self._now_naive()

    @property
    def status(self) -> HotspotStatus:
        if not self.router_token:
            return HotspotStatus.NO_TOKEN
        if not self.last_ping_at:
            return HotspotStatus.NEVER_POLLED
        ping = self.last_ping_at
        if ping.tzinfo is None:
            ping = ping.replace(tzinfo=timezone.utc)
        delta = (datetime.now(timezone.utc) - ping).total_seconds()
        return HotspotStatus.ONLINE if delta < 30 else HotspotStatus.OFFLINE
