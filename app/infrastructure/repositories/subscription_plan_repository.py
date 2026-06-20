from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.subscription_plan import SubscriptionPlan
from app.domain.repositories.abstract.subscription_plan_repository import ISubscriptionPlanRepository
from app.infrastructure.persistence.schemas import SubscriptionPlanSchema


class SubscriptionPlanRepository(ISubscriptionPlanRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_model(self, schema: SubscriptionPlanSchema) -> SubscriptionPlan:
        return SubscriptionPlan(
            id=schema.id,
            plan_id=schema.plan_id,
            name=schema.name,
            description=schema.description,
            price=schema.price,
            currency=schema.currency,
            duration_months=schema.duration_months,
            advantages=schema.advantages or {},
            is_active=schema.is_active,
            created_at=schema.created_at,
            updated_at=schema.updated_at,
        )

    def _to_schema(self, model: SubscriptionPlan) -> SubscriptionPlanSchema:
        return SubscriptionPlanSchema(
            id=model.id,
            plan_id=model.plan_id,
            name=model.name,
            description=model.description,
            price=model.price,
            currency=model.currency,
            duration_months=model.duration_months,
            advantages=model.advantages,
            is_active=model.is_active,
        )

    async def get_by_plan_id(self, plan_id: str) -> Optional[SubscriptionPlan]:
        result = await self._session.execute(
            select(SubscriptionPlanSchema).where(SubscriptionPlanSchema.plan_id == plan_id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_all_active(self) -> List[SubscriptionPlan]:
        result = await self._session.execute(
            select(SubscriptionPlanSchema).where(SubscriptionPlanSchema.is_active == True))
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_all(self) -> List[SubscriptionPlan]:
        result = await self._session.execute(select(SubscriptionPlanSchema))
        return [self._to_model(s) for s in result.scalars().all()]

    async def create(self, plan: SubscriptionPlan) -> SubscriptionPlan:
        schema = self._to_schema(plan)
        self._session.add(schema)
        await self._session.flush()
        return self._to_model(schema)

    async def update(self, plan: SubscriptionPlan) -> SubscriptionPlan:
        schema = self._to_schema(plan)
        await self._session.merge(schema)
        await self._session.flush()
        return plan
