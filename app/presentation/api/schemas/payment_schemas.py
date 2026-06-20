from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

from app.presentation.api.schemas.base import CamelBase


class PaymentInitRequest(CamelBase):
    hotspot_id: str
    plan_id: str
    client_phone: str
    client_mac: Optional[str] = None
    operator: str
    amount: str


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_id: str
    reference: str
    hotspot_id: str
    plan_id: Optional[str] = None
    client_phone: Optional[str] = None
    operator: Optional[str] = None
    amount: str
    currency: str
    status: str
    gateway_tx_id: Optional[str] = None
    failure_reason: Optional[str] = None
    checkout_url: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
