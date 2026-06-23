from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@dataclass
class RouterModel:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    brand_id: str = ""
    name: str = ""
    slug: str = ""
    connection_type: str = "api"  # api, ssh, snmp, http, telnet
    default_port: Optional[int] = None
    config_schema: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)
