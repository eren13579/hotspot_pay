from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.router_action import RouterAction, ActionStatus


class IRouterActionRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[RouterAction]:
        pass

    @abstractmethod
    async def get_by_action_id(self, action_id: str) -> Optional[RouterAction]:
        pass

    @abstractmethod
    async def get_pending_by_hotspot(self, hotspot_id: str) -> List[RouterAction]:
        pass

    @abstractmethod
    async def create(self, action: RouterAction) -> RouterAction:
        pass

    @abstractmethod
    async def update(self, action: RouterAction) -> RouterAction:
        pass

    @abstractmethod
    async def delete(self, id: str) -> None:
        pass

    @abstractmethod
    async def delete_expired(self, max_age_seconds: int = 300) -> int:
        pass
