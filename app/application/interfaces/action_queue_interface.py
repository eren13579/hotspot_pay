from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.router_action import RouterAction


class IActionQueue(ABC):
    @abstractmethod
    def enqueue(self, action: RouterAction) -> None:
        pass

    @abstractmethod
    async def wait_for_actions(self, hotspot_id: str, timeout: float = 20.0) -> Optional[RouterAction]:
        pass

    @abstractmethod
    def get_pending_actions(self, hotspot_id: str) -> List[RouterAction]:
        pass

    @abstractmethod
    async def mark_delivered(self, action_id: str) -> None:
        pass

    @abstractmethod
    def remove_delivered(self, hotspot_id: str) -> None:
        pass
