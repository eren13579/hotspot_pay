from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.hotspot import Hotspot


class IHotspotRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[Hotspot]:
        pass

    @abstractmethod
    async def get_by_hotspot_id(self, hotspot_id: str) -> Optional[Hotspot]:
        pass

    @abstractmethod
    async def get_by_hotspot_id_and_user(self, hotspot_id: str, user_id: str) -> Optional[Hotspot]:
        pass

    @abstractmethod
    async def get_by_user_id(self, user_id: str, skip: int = 0, limit: int = 20) -> List[Hotspot]:
        pass

    @abstractmethod
    async def count_by_user_id(self, user_id: str) -> int:
        pass

    @abstractmethod
    async def exists_by_ip_and_user(self, mikrotik_ip: str, user_id: str) -> bool:
        pass

    @abstractmethod
    async def create(self, hotspot: Hotspot) -> Hotspot:
        pass

    @abstractmethod
    async def update(self, hotspot: Hotspot) -> Hotspot:
        pass

    @abstractmethod
    async def delete_by_hotspot_id(self, hotspot_id: str) -> bool:
        pass

    @abstractmethod
    async def update_ping(self, hotspot_id: str) -> None:
        pass

    @abstractmethod
    async def update_router_token(self, hotspot_id: str, token: str) -> None:
        pass
