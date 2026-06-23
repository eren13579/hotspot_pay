from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import uuid


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@dataclass
class Plan:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    plan_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    hotspot_id: str = ""
    name: str = ""
    description: Optional[str] = None
    duration_minutes: int = 0
    price: str = "0"
    currency: str = "XAF"
    download_speed_kbps: Optional[int] = None
    upload_speed_kbps: Optional[int] = None
    data_limit_mb: Optional[int] = None
    display_order: int = 0
    hotspot_profile: str = "default"
    is_active: bool = True
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)
