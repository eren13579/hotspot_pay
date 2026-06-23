from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.presentation.api.schemas.base import CamelBase


class CreateActionRequest(CamelBase):
    """Request to create a router action (from main service)."""
    hotspot_id: str = Field(..., description="Hotspot ID")
    action_type: str = Field(..., description="Action type: CREATE_USER, REMOVE_USER, KICK_SESSION")
    username: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)
    profile: Optional[str] = Field(default="default", max_length=100)
    time_limit: Optional[str] = Field(default=None, max_length=50, description="ex: 4w2d")
    data_limit: Optional[str] = Field(default=None, max_length=50, description="Limite en octets (string pour compat Java)")
    comment: Optional[str] = Field(default=None, max_length=500)
    mac_address: Optional[str] = Field(default=None, max_length=17, description="MAC du client — OBLIGATOIRE pour CREATE_USER")


class ActionAckRequest(CamelBase):
    """ACK from router after executing an action."""
    success: bool
    error: Optional[str] = Field(default="", max_length=255)


class RouterActionResponse(BaseModel):
    actionId: str
    type: str
    username: str
    password: str
    profile: str
    timeLimit: Optional[str] = None
    dataLimit: Optional[int] = None
    comment: Optional[str] = None
    macAddress: Optional[str] = None

    @classmethod
    def from_action(cls, action) -> "RouterActionResponse":
        return cls(
            actionId=action.action_id,
            type=action.action_type.value,
            username=action.username,
            password=action.password,
            profile=action.profile,
            timeLimit=action.time_limit,
            dataLimit=action.data_limit,
            comment=action.comment,
            macAddress=action.mac_address,
        )


class PendingActionsResponse(BaseModel):
    """Response for Long Polling endpoint."""
    count: int
    actions: List[RouterActionResponse]
