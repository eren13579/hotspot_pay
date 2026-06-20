from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime

from app.presentation.api.schemas.base import _to_camel


# ── Requests ──────────────────────────────────────────────────────────

class CreateHotspotRequest(BaseModel):
    model_config = ConfigDict(
        protected_namespaces=(),
        populate_by_name=True,
        alias_generator=_to_camel,
    )
    user_id: str = Field(..., description="UUID de l'utilisateur propriétaire")
    name: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = Field(default=None, max_length=255)
    mikrotik_ip: str = Field(..., pattern=r"^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$")
    mikrotik_port: int = Field(default=8728, ge=1, le=65535)
    mikrotik_user: str = Field(..., min_length=1, max_length=100)
    mikrotik_password: str = Field(..., min_length=1)
    hotspot_profile: str = Field(default="default", max_length=100)
    router_brand: Optional[str] = Field(default="mikrotik", max_length=100)
    router_type: Optional[str] = Field(default=None, max_length=100)
    model_id: Optional[str] = Field(default=None, max_length=36)


class UpdateHotspotRequest(BaseModel):
    model_config = ConfigDict(
        protected_namespaces=(),
        populate_by_name=True,
        alias_generator=_to_camel,
    )
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    location: Optional[str] = Field(default=None, max_length=255)
    mikrotik_ip: Optional[str] = Field(default=None,
                                         pattern=r"^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$")
    mikrotik_port: Optional[int] = Field(default=None, ge=1, le=65535)
    mikrotik_user: Optional[str] = Field(default=None, min_length=1, max_length=100)
    mikrotik_password: Optional[str] = Field(default=None, min_length=1)
    hotspot_profile: Optional[str] = Field(default=None, max_length=100)
    router_brand: Optional[str] = Field(default=None, max_length=100)
    router_type: Optional[str] = Field(default=None, max_length=100)
    model_id: Optional[str] = Field(default=None, max_length=36)


# ── Responses ─────────────────────────────────────────────────────────

class HotspotResponse(BaseModel):
    hotspot_id: str
    user_id: str
    name: str
    location: Optional[str] = None
    mikrotik_ip: str
    mikrotik_port: int
    mikrotik_user: str
    hotspot_profile: str
    router_brand: str = "mikrotik"
    router_type: Optional[str] = None
    is_online: bool
    status: str
    last_ping_at: Optional[datetime] = None
    router_token_configured: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HotspotListResponse(BaseModel):
    items: List[HotspotResponse]
    total: int
    page: int
    page_size: int


class HotspotStatusResponse(BaseModel):
    hotspot_id: str
    name: str
    is_online: bool
    last_ping_at: Optional[datetime] = None
    message: str


class RouterTokenData(BaseModel):
    hotspot_id: str
    router_token: str
    polling_url: str
    mikrotik_script: str = ""
    script_download_url: Optional[str] = None
    generated_at: Optional[datetime] = None


class RouterTokenResponse(BaseModel):
    success: bool
    message: str
    hotspot_id: Optional[str] = None
    router_token: Optional[str] = None
    polling_url: Optional[str] = None
    script_download_url: Optional[str] = None
    mikrotik_script: Optional[str] = None
    generated_at: Optional[datetime] = None


# ── Inter-service (Java → FastAPI register) ──────────────────────────

class HotspotRegisterRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=_to_camel,
    )
    hotspot_id: str
    user_id: str
    name: str
    location: Optional[str] = None
    mikrotik_ip: str
    mikrotik_port: int = 8728
    mikrotik_user: str
    mikrotik_password_enc: str
    hotspot_profile: str = "default"
