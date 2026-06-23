from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.plan import Plan


class IPlanRepository(ABC):

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[Plan]:
        pass

    @abstractmethod
    async def get_by_plan_id(self, plan_id: str) -> Optional[Plan]:
        pass

    @abstractmethod
    async def get_by_plan_id_and_hotspot(self, plan_id: str, hotspot_id: str) -> Optional[Plan]:
        pass

    @abstractmethod
    async def get_by_hotspot_id(self, hotspot_id: str) -> List[Plan]:
        pass

    @abstractmethod
    async def get_active_by_hotspot(self, hotspot_id: str) -> List[Plan]:
        pass

    @abstractmethod
    async def create(self, plan: Plan) -> Plan:
        pass

    @abstractmethod
    async def update(self, plan: Plan) -> Plan:
        pass

    @abstractmethod
    async def delete(self, plan_id: str) -> bool:
        pass

    @abstractmethod
    async def exists_by_name_and_hotspot(self, name: str, hotspot_id: str) -> bool:
        pass

    @abstractmethod
    async def count_by_hotspot(self, hotspot_id: str) -> int:
        pass
