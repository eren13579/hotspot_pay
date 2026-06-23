from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Boolean, BigInteger, Enum as SAEnum, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base
from app.domain.models.hotspot import HotspotStatus
from app.domain.models.ticket import TicketStatus
from app.domain.models.router_action import RouterActionType, ActionStatus


class HotspotSchema(Base):
    __tablename__ = "hotspots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    hotspot_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    mikrotik_ip: Mapped[str] = mapped_column(String(45), nullable=False)
    mikrotik_port: Mapped[int] = mapped_column(Integer, default=8728)
    mikrotik_user: Mapped[str] = mapped_column(String(100), nullable=False)
    mikrotik_password_enc: Mapped[str] = mapped_column(String(500), nullable=False)
    hotspot_profile: Mapped[str] = mapped_column(String(100), default="default")
    router_brand: Mapped[str] = mapped_column(String(100), default="mikrotik")
    router_type: Mapped[str] = mapped_column(String(100), nullable=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    router_token: Mapped[str] = mapped_column(String(255), nullable=True)
    model_id: Mapped[str] = mapped_column(String(36), nullable=True)
    last_ping_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    __table_args__ = (
        Index("idx_hotspots_brand", "router_brand"),
        Index("idx_hotspots_model_id", "model_id"),
        Index("idx_hotspots_active", "is_online"),
    )


class TicketSchema(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    ticket_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    hotspot_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    profile: Mapped[str] = mapped_column(String(100), default="default")
    time_limit: Mapped[str] = mapped_column(String(50), nullable=True)
    data_limit: Mapped[int] = mapped_column(BigInteger, nullable=True)
    comment: Mapped[str] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="AVAILABLE")
    session_id: Mapped[str] = mapped_column(String(36), nullable=True)
    client_mac: Mapped[str] = mapped_column(String(17), nullable=True)
    client_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    used_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())


class RouterBrandSchema(Base):
    __tablename__ = "router_brands"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    __table_args__ = (
        Index("idx_router_brands_active", "is_active"),
    )


class RouterModelSchema(Base):
    __tablename__ = "router_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    brand_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    connection_type: Mapped[str] = mapped_column(String(20), default="api")
    default_port: Mapped[int] = mapped_column(Integer, nullable=True)
    config_schema: Mapped[dict] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    __table_args__ = (
        Index("idx_router_models_brand_active", "brand_id", "is_active"),
    )


class PlanSchema(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    plan_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    hotspot_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[str] = mapped_column(String(50), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XAF")
    download_speed_kbps: Mapped[int] = mapped_column(Integer, nullable=True)
    upload_speed_kbps: Mapped[int] = mapped_column(Integer, nullable=True)
    data_limit_mb: Mapped[int] = mapped_column(Integer, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    hotspot_profile: Mapped[str] = mapped_column(String(100), default="default")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())


class HotspotSessionSchema(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    hotspot_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    plan_id: Mapped[str] = mapped_column(String(36), nullable=True)
    payment_id: Mapped[str] = mapped_column(String(36), nullable=True)
    client_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    client_mac: Mapped[str] = mapped_column(String(17), nullable=True)
    mikrotik_username: Mapped[str] = mapped_column(String(255), nullable=False)
    mikrotik_password: Mapped[str] = mapped_column(String(255), nullable=False)
    profile: Mapped[str] = mapped_column(String(100), default="default")
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    bytes_in: Mapped[int] = mapped_column(BigInteger, default=0)
    bytes_out: Mapped[int] = mapped_column(BigInteger, default=0)
    activated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    __table_args__ = (
        Index("idx_sessions_status", "status"),
        Index("idx_sessions_hotspot_status", "hotspot_id", "status"),
    )


class PaymentSchema(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    payment_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hotspot_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    plan_id: Mapped[str] = mapped_column(String(36), nullable=True)
    client_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    client_mac: Mapped[str] = mapped_column(String(17), nullable=True)
    operator: Mapped[str] = mapped_column(String(20), nullable=True)
    amount: Mapped[str] = mapped_column(String(50), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XAF")
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    gateway_tx_id: Mapped[str] = mapped_column(String(255), nullable=True)
    failure_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    checkout_url: Mapped[str] = mapped_column(String(500), nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    __table_args__ = (
        Index("idx_payments_status", "status"),
        Index("idx_payments_hotspot_status", "hotspot_id", "status"),
    )


class UserSchema(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    country: Mapped[str] = mapped_column(String(10), nullable=True)
    plan_type: Mapped[str] = mapped_column(String(20), default="BASIC", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())


class SubscriptionSchema(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    subscription_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    plan_name: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[str] = mapped_column(String(20), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XAF")
    duration_months: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    payment_reference: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())

    __table_args__ = (
        Index("idx_subs_user_status", "user_id", "status"),
        Index("idx_subs_status", "status"),
    )


class SubscriptionPlanSchema(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    plan_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(10), default="XAF")
    duration_months: Mapped[int] = mapped_column(Integer, default=1)
    advantages: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())


class RouterActionSchema(Base):
    __tablename__ = "router_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    action_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    hotspot_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(20), nullable=False)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    profile: Mapped[str] = mapped_column(String(100), default="default")
    time_limit: Mapped[str] = mapped_column(String(50), nullable=True)
    data_limit: Mapped[int] = mapped_column(BigInteger, nullable=True)
    comment: Mapped[str] = mapped_column(String(500), nullable=True)
    mac_address: Mapped[str] = mapped_column(String(17), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    ack_success: Mapped[bool] = mapped_column(Boolean, nullable=True)
    ack_error: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    delivered_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    ack_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
