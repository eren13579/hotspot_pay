from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import uuid


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@dataclass
class SubscriptionPlan:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    plan_id: str = ""
    name: str = ""
    description: Optional[str] = None
    price: int = 0
    currency: str = "XAF"
    duration_months: int = 1
    advantages: dict = field(default_factory=dict)
    is_active: bool = True
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)
