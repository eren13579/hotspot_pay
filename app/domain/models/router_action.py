from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class RouterActionType(str, Enum):
    CREATE_USER = "CREATE_USER"
    REMOVE_USER = "REMOVE_USER"
    KICK_SESSION = "KICK_SESSION"


class ActionStatus(str, Enum):
    PENDING = "PENDING"
    DELIVERED = "DELIVERED"
    ACK_SUCCESS = "ACK_SUCCESS"
    ACK_FAILED = "ACK_FAILED"
    EXPIRED = "EXPIRED"


@dataclass
class RouterAction:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    action_id: str = field(default_factory=lambda: "act_" + uuid.uuid4().hex[:12])
    hotspot_id: str = ""
    action_type: RouterActionType = RouterActionType.CREATE_USER
    username: str = ""
    password: str = ""
    profile: str = "default"
    time_limit: Optional[str] = None
    data_limit: Optional[int] = None
    comment: Optional[str] = None
    mac_address: Optional[str] = None
    status: ActionStatus = ActionStatus.PENDING
    ack_success: Optional[bool] = None
    ack_error: Optional[str] = None
    created_at: datetime = field(default_factory=_utcnow)
    delivered_at: Optional[datetime] = None
    ack_at: Optional[datetime] = None

    def mark_delivered(self) -> None:
        self.status = ActionStatus.DELIVERED
        self.delivered_at = _utcnow()

    def mark_ack(self, success: bool, error: str = "") -> None:
        self.ack_success = success
        self.ack_error = error
        self.ack_at = _utcnow()
        self.status = ActionStatus.ACK_SUCCESS if success else ActionStatus.ACK_FAILED

    def mark_expired(self) -> None:
        self.status = ActionStatus.EXPIRED
