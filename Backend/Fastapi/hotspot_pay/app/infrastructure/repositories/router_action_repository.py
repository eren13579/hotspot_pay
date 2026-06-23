from typing import List, Optional
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.router_action import RouterAction, RouterActionType, ActionStatus
from app.domain.repositories.abstract.router_action_repository import IRouterActionRepository
from app.infrastructure.persistence.schemas import RouterActionSchema


class RouterActionRepository(IRouterActionRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_model(self, schema: RouterActionSchema) -> RouterAction:
        return RouterAction(
            id=schema.id,
            action_id=schema.action_id,
            hotspot_id=schema.hotspot_id,
            action_type=RouterActionType(schema.action_type),
            username=schema.username,
            password=schema.password,
            profile=schema.profile,
            time_limit=schema.time_limit,
            data_limit=schema.data_limit,
            comment=schema.comment,
            mac_address=schema.mac_address,
            status=ActionStatus(schema.status),
            ack_success=schema.ack_success,
            ack_error=schema.ack_error,
            created_at=schema.created_at,
            delivered_at=schema.delivered_at,
            ack_at=schema.ack_at,
        )

    def _to_schema(self, model: RouterAction) -> RouterActionSchema:
        return RouterActionSchema(
            id=model.id,
            action_id=model.action_id,
            hotspot_id=model.hotspot_id,
            action_type=model.action_type.value,
            username=model.username,
            password=model.password,
            profile=model.profile,
            time_limit=model.time_limit,
            data_limit=model.data_limit,
            comment=model.comment,
            mac_address=model.mac_address,
            status=model.status.value,
            ack_success=model.ack_success,
            ack_error=model.ack_error,
            created_at=model.created_at,
            delivered_at=model.delivered_at,
            ack_at=model.ack_at,
        )

    async def get_by_id(self, id: str) -> Optional[RouterAction]:
        result = await self._session.execute(
            select(RouterActionSchema).where(RouterActionSchema.id == id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_action_id(self, action_id: str) -> Optional[RouterAction]:
        result = await self._session.execute(
            select(RouterActionSchema).where(RouterActionSchema.action_id == action_id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_pending_by_hotspot(self, hotspot_id: str) -> List[RouterAction]:
        result = await self._session.execute(
            select(RouterActionSchema)
            .where(
                RouterActionSchema.hotspot_id == hotspot_id,
                RouterActionSchema.status == ActionStatus.PENDING.value,
            )
            .order_by(RouterActionSchema.created_at.asc()))
        return [self._to_model(s) for s in result.scalars().all()]

    async def create(self, action: RouterAction) -> RouterAction:
        schema = self._to_schema(action)
        self._session.add(schema)
        await self._session.flush()
        return self._to_model(schema)

    async def update(self, action: RouterAction) -> RouterAction:
        schema = self._to_schema(action)
        await self._session.merge(schema)
        await self._session.flush()
        return action

    async def delete(self, id: str) -> None:
        result = await self._session.execute(
            select(RouterActionSchema).where(RouterActionSchema.id == id))
        schema = result.scalar_one_or_none()
        if schema:
            await self._session.delete(schema)

    async def delete_expired(self, max_age_seconds: int = 300) -> int:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=max_age_seconds)
        result = await self._session.execute(
            delete(RouterActionSchema).where(RouterActionSchema.created_at < cutoff))
        return result.rowcount or 0
