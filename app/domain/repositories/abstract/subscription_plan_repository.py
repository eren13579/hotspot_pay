from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.subscription_plan import SubscriptionPlan


class ISubscriptionPlanRepository(ABC):

    @abstractmethod
    async def get_by_plan_id(self, plan_id: str) -> Optional[SubscriptionPlan]:
        pass

    @abstractmethod
    async def get_all_active(self) -> List[SubscriptionPlan]:
        pass

    @abstractmethod
    async def get_all(self) -> List[SubscriptionPlan]:
        pass

    @abstractmethod
    async def create(self, plan: SubscriptionPlan) -> SubscriptionPlan:
        pass

    @abstractmethod
    async def update(self, plan: SubscriptionPlan) -> SubscriptionPlan:
        pass
