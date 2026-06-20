from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    hotspot_id: str
    plan_id: Optional[str] = None
    payment_id: Optional[str] = None
    client_phone: Optional[str] = None
    client_mac: Optional[str] = None
    mikrotik_username: str
    profile: str = "default"
    status: str
    bytes_in: int = 0
    bytes_out: int = 0
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class SessionListResponse(BaseModel):
    hotspot_id: str
    total: int
    sessions: List[SessionResponse]
