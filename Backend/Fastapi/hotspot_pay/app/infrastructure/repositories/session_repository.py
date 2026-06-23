from typing import List, Optional
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.session import HotspotSession, SessionStatus
from app.domain.repositories.abstract.session_repository import ISessionRepository
from app.infrastructure.persistence.schemas import HotspotSessionSchema


class SessionRepository(ISessionRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_model(self, schema: HotspotSessionSchema) -> HotspotSession:
        return HotspotSession(
            id=schema.id,
            session_id=schema.session_id,
            hotspot_id=schema.hotspot_id,
            plan_id=schema.plan_id,
            payment_id=schema.payment_id,
            client_phone=schema.client_phone,
            client_mac=schema.client_mac,
            mikrotik_username=schema.mikrotik_username,
            mikrotik_password=schema.mikrotik_password,
            profile=schema.profile,
            status=SessionStatus(schema.status),
            bytes_in=schema.bytes_in,
            bytes_out=schema.bytes_out,
            activated_at=schema.activated_at,
            expires_at=schema.expires_at,
            created_at=schema.created_at,
            updated_at=schema.updated_at,
        )

    def _to_schema(self, model: HotspotSession) -> HotspotSessionSchema:
        return HotspotSessionSchema(
            id=model.id,
            session_id=model.session_id,
            hotspot_id=model.hotspot_id,
            plan_id=model.plan_id,
            payment_id=model.payment_id,
            client_phone=model.client_phone,
            client_mac=model.client_mac,
            mikrotik_username=model.mikrotik_username,
            mikrotik_password=model.mikrotik_password,
            profile=model.profile,
            status=model.status.value,
            bytes_in=model.bytes_in,
            bytes_out=model.bytes_out,
            activated_at=model.activated_at,
            expires_at=model.expires_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: str) -> Optional[HotspotSession]:
        result = await self._session.execute(select(HotspotSessionSchema).where(HotspotSessionSchema.id == id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_session_id(self, session_id: str) -> Optional[HotspotSession]:
        result = await self._session.execute(
            select(HotspotSessionSchema).where(HotspotSessionSchema.session_id == session_id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_hotspot_id(self, hotspot_id: str) -> List[HotspotSession]:
        result = await self._session.execute(
            select(HotspotSessionSchema).where(HotspotSessionSchema.hotspot_id == hotspot_id))
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_active_by_hotspot(self, hotspot_id: str) -> List[HotspotSession]:
        result = await self._session.execute(
            select(HotspotSessionSchema).where(
                HotspotSessionSchema.hotspot_id == hotspot_id,
                HotspotSessionSchema.status == 'ACTIVE',
            ))
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_expired_sessions(self) -> List[HotspotSession]:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        result = await self._session.execute(
            select(HotspotSessionSchema).where(
                HotspotSessionSchema.status == 'ACTIVE',
                HotspotSessionSchema.expires_at < now,
            ))
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_stale_pending(self, max_age_minutes: int) -> List[HotspotSession]:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=max_age_minutes)
        result = await self._session.execute(
            select(HotspotSessionSchema).where(
                HotspotSessionSchema.status == 'PENDING',
                HotspotSessionSchema.created_at < cutoff,
            ))
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_all(self, status: Optional[str] = None) -> List[HotspotSession]:
        """Return all sessions globally, optionally filtered by status."""
        query = select(HotspotSessionSchema)
        if status:
            query = query.where(HotspotSessionSchema.status == status)
        query = query.order_by(HotspotSessionSchema.created_at.desc())
        result = await self._session.execute(query)
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_all_active(self) -> List[HotspotSession]:
        """Return all sessions with ACTIVE status (global, all hotspots)."""
        result = await self._session.execute(
            select(HotspotSessionSchema).where(
                HotspotSessionSchema.status == 'ACTIVE',
            ).order_by(HotspotSessionSchema.activated_at.desc()))
        return [self._to_model(s) for s in result.scalars().all()]

    async def create(self, session: HotspotSession) -> HotspotSession:
        schema = self._to_schema(session)
        self._session.add(schema)
        await self._session.flush()
        return self._to_model(schema)

    async def update(self, session: HotspotSession) -> HotspotSession:
        schema = self._to_schema(session)
        await self._session.merge(schema)
        await self._session.flush()
        return session

    async def delete(self, session_id: str) -> bool:
        result = await self._session.execute(
            select(HotspotSessionSchema).where(HotspotSessionSchema.session_id == session_id))
        schema = result.scalar_one_or_none()
        if not schema:
            return False
        await self._session.delete(schema)
        await self._session.flush()
        return True
