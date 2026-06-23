from typing import List, Optional

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.hotspot import Hotspot
from app.domain.repositories.abstract.hotspot_repository import IHotspotRepository
from app.infrastructure.persistence.schemas import HotspotSchema


class HotspotRepository(IHotspotRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_model(self, schema: HotspotSchema) -> Hotspot:
        return Hotspot(
            id=schema.id,
            hotspot_id=schema.hotspot_id,
            user_id=schema.user_id,
            name=schema.name,
            location=schema.location,
            mikrotik_ip=schema.mikrotik_ip,
            mikrotik_port=schema.mikrotik_port,
            mikrotik_user=schema.mikrotik_user,
            mikrotik_password_enc=schema.mikrotik_password_enc,
            hotspot_profile=schema.hotspot_profile,
            router_brand=schema.router_brand,
            router_type=schema.router_type,
            is_online=schema.is_online,
            router_token=schema.router_token,
            model_id=schema.model_id,
            last_ping_at=schema.last_ping_at,
            created_at=schema.created_at,
            updated_at=schema.updated_at,
        )

    def _to_schema(self, model: Hotspot) -> HotspotSchema:
        return HotspotSchema(
            id=model.id,
            hotspot_id=model.hotspot_id,
            user_id=model.user_id,
            name=model.name,
            location=model.location,
            mikrotik_ip=model.mikrotik_ip,
            mikrotik_port=model.mikrotik_port,
            mikrotik_user=model.mikrotik_user,
            mikrotik_password_enc=model.mikrotik_password_enc,
            hotspot_profile=model.hotspot_profile,
            router_brand=model.router_brand,
            router_type=model.router_type,
            is_online=model.is_online,
            router_token=model.router_token,
            model_id=model.model_id,
            last_ping_at=model.last_ping_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def _fetch_one(self, hotspot_id: str) -> Optional[HotspotSchema]:
        result = await self._session.execute(
            select(HotspotSchema).where(HotspotSchema.hotspot_id == hotspot_id))
        return result.scalar_one_or_none()

    async def get_by_id(self, id: str) -> Optional[Hotspot]:
        result = await self._session.execute(select(HotspotSchema).where(HotspotSchema.id == id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_hotspot_id(self, hotspot_id: str) -> Optional[Hotspot]:
        schema = await self._fetch_one(hotspot_id)
        return self._to_model(schema) if schema else None

    async def get_by_hotspot_id_and_user(self, hotspot_id: str, user_id: str) -> Optional[Hotspot]:
        result = await self._session.execute(
            select(HotspotSchema).where(
                HotspotSchema.hotspot_id == hotspot_id,
                HotspotSchema.user_id == user_id,
            )
        )
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_user_id(self, user_id: str, skip: int = 0, limit: int = 20) -> List[Hotspot]:
        result = await self._session.execute(
            select(HotspotSchema)
            .where(HotspotSchema.user_id == user_id)
            .order_by(HotspotSchema.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return [self._to_model(s) for s in result.scalars().all()]

    async def count_by_user_id(self, user_id: str) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(HotspotSchema).where(HotspotSchema.user_id == user_id)
        )
        return result.scalar_one() or 0

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Hotspot]:
        result = await self._session.execute(
            select(HotspotSchema)
            .order_by(HotspotSchema.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return [self._to_model(s) for s in result.scalars().all()]

    async def count_all(self) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(HotspotSchema)
        )
        return result.scalar_one() or 0

    async def exists_by_ip_and_user(self, mikrotik_ip: str, user_id: str) -> bool:
        result = await self._session.execute(
            select(func.count()).select_from(HotspotSchema).where(
                HotspotSchema.mikrotik_ip == mikrotik_ip,
                HotspotSchema.user_id == user_id,
            )
        )
        return (result.scalar_one() or 0) > 0

    async def create(self, hotspot: Hotspot) -> Hotspot:
        schema = self._to_schema(hotspot)
        self._session.add(schema)
        await self._session.flush()
        await self._session.refresh(schema)
        return self._to_model(schema)

    async def update(self, hotspot: Hotspot) -> Hotspot:
        schema = await self._fetch_one(hotspot.hotspot_id)
        if not schema:
            return None
        for field in ("name", "location", "mikrotik_ip", "mikrotik_port",
                      "mikrotik_user", "mikrotik_password_enc", "hotspot_profile",
                      "router_brand", "router_type", "model_id", "router_token",
                      "is_online", "last_ping_at"):
            val = getattr(hotspot, field, None)
            setattr(schema, field, val)
        await self._session.flush()
        return self._to_model(schema)

    async def delete_by_hotspot_id(self, hotspot_id: str) -> bool:
        schema = await self._fetch_one(hotspot_id)
        if not schema:
            return False
        await self._session.delete(schema)
        await self._session.flush()
        return True

    async def update_ping(self, hotspot_id: str) -> None:
        from datetime import datetime, timezone
        await self._session.execute(
            update(HotspotSchema)
            .where(HotspotSchema.hotspot_id == hotspot_id)
            .values(is_online=True, last_ping_at=datetime.now(timezone.utc).replace(tzinfo=None))
        )

    async def update_router_token(self, hotspot_id: str, token: str) -> None:
        await self._session.execute(
            update(HotspotSchema)
            .where(HotspotSchema.hotspot_id == hotspot_id)
            .values(router_token=token, is_online=False, last_ping_at=None)
        )
