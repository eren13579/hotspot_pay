from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

from app.presentation.api.schemas.base import CamelBase


class CreatePlanRequest(CamelBase):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    duration_minutes: int = Field(..., ge=1)
    price: str = Field(..., min_length=1)
    currency: str = Field(default="XAF", max_length=10)
    download_speed_kbps: Optional[int] = None
    upload_speed_kbps: Optional[int] = None
    data_limit_mb: Optional[int] = None
    display_order: Optional[int] = 0
    hotspot_profile: Optional[str] = "default"


class UpdatePlanRequest(CamelBase):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[str] = None
    currency: Optional[str] = None
    download_speed_kbps: Optional[int] = None
    upload_speed_kbps: Optional[int] = None
    data_limit_mb: Optional[int] = None
    display_order: Optional[int] = None
    hotspot_profile: Optional[str] = None
    is_active: Optional[bool] = None


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: str
    hotspot_id: str
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: str
    currency: str
    download_speed_kbps: Optional[int] = None
    upload_speed_kbps: Optional[int] = None
    data_limit_mb: Optional[int] = None
    display_order: int = 0
    hotspot_profile: str = "default"
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
