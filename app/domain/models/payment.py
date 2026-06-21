from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    REFUNDED = "REFUNDED"


@dataclass
class Payment:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    payment_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    reference: str = ""
    hotspot_id: str = ""
    plan_id: Optional[str] = None
    client_phone: Optional[str] = None
    client_mac: Optional[str] = None
    operator: Optional[str] = None
    amount: str = "0"
    currency: str = "XAF"
    status: PaymentStatus = PaymentStatus.PENDING
    gateway_tx_id: Optional[str] = None
    failure_reason: Optional[str] = None
    checkout_url: Optional[str] = None
    paid_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)
