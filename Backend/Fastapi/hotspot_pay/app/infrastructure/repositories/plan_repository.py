from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.plan import Plan
from app.domain.repositories.abstract.plan_repository import IPlanRepository
from app.infrastructure.persistence.schemas import PlanSchema


class PlanRepository(IPlanRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_model(self, schema: PlanSchema) -> Plan:
        return Plan(
            id=schema.id,
            plan_id=schema.plan_id,
            hotspot_id=schema.hotspot_id,
            name=schema.name,
            description=schema.description,
            duration_minutes=schema.duration_minutes,
            price=schema.price,
            currency=schema.currency,
            download_speed_kbps=schema.download_speed_kbps,
            upload_speed_kbps=schema.upload_speed_kbps,
            data_limit_mb=schema.data_limit_mb,
            display_order=schema.display_order,
            hotspot_profile=schema.hotspot_profile,
            is_active=schema.is_active,
            created_at=schema.created_at,
            updated_at=schema.updated_at,
        )

    def _to_schema(self, model: Plan) -> PlanSchema:
        return PlanSchema(
            id=model.id,
            plan_id=model.plan_id,
            hotspot_id=model.hotspot_id,
            name=model.name,
            description=model.description,
            duration_minutes=model.duration_minutes,
            price=model.price,
            currency=model.currency,
            download_speed_kbps=model.download_speed_kbps,
            upload_speed_kbps=model.upload_speed_kbps,
            data_limit_mb=model.data_limit_mb,
            display_order=model.display_order,
            hotspot_profile=model.hotspot_profile,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: str) -> Optional[Plan]:
        result = await self._session.execute(select(PlanSchema).where(PlanSchema.id == id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_plan_id(self, plan_id: str) -> Optional[Plan]:
        result = await self._session.execute(select(PlanSchema).where(PlanSchema.plan_id == plan_id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_plan_id_and_hotspot(self, plan_id: str, hotspot_id: str) -> Optional[Plan]:
        result = await self._session.execute(
            select(PlanSchema).where(
                PlanSchema.plan_id == plan_id,
                PlanSchema.hotspot_id == hotspot_id,
            ))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_hotspot_id(self, hotspot_id: str) -> List[Plan]:
        result = await self._session.execute(
            select(PlanSchema).where(PlanSchema.hotspot_id == hotspot_id).order_by(PlanSchema.display_order.asc()))
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_active_by_hotspot(self, hotspot_id: str) -> List[Plan]:
        result = await self._session.execute(
            select(PlanSchema).where(
                PlanSchema.hotspot_id == hotspot_id,
                PlanSchema.is_active == True,
            ).order_by(PlanSchema.display_order.asc()))
        return [self._to_model(s) for s in result.scalars().all()]

    async def create(self, plan: Plan) -> Plan:
        schema = self._to_schema(plan)
        self._session.add(schema)
        await self._session.flush()
        return self._to_model(schema)

    async def update(self, plan: Plan) -> Plan:
        schema = self._to_schema(plan)
        await self._session.merge(schema)
        await self._session.flush()
        return plan

    async def delete(self, plan_id: str) -> bool:
        result = await self._session.execute(select(PlanSchema).where(PlanSchema.plan_id == plan_id))
        schema = result.scalar_one_or_none()
        if not schema:
            return False
        await self._session.delete(schema)
        await self._session.flush()
        return True

    async def exists_by_name_and_hotspot(self, name: str, hotspot_id: str) -> bool:
        result = await self._session.execute(
            select(PlanSchema).where(
                PlanSchema.name == name,
                PlanSchema.hotspot_id == hotspot_id,
            ))
        return result.scalar_one_or_none() is not None

    async def count_by_hotspot(self, hotspot_id: str) -> int:
        result = await self._session.execute(
            select(func.count()).select_from(PlanSchema).where(PlanSchema.hotspot_id == hotspot_id))
        return result.scalar_one() or 0
