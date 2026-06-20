from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.session import HotspotSession


class ISessionRepository(ABC):

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[HotspotSession]:
        pass

    @abstractmethod
    async def get_by_session_id(self, session_id: str) -> Optional[HotspotSession]:
        pass

    @abstractmethod
    async def get_by_hotspot_id(self, hotspot_id: str) -> List[HotspotSession]:
        pass

    @abstractmethod
    async def get_active_by_hotspot(self, hotspot_id: str) -> List[HotspotSession]:
        pass

    @abstractmethod
    async def get_all(self, status: Optional[str] = None) -> List[HotspotSession]:
        pass

    @abstractmethod
    async def get_expired_sessions(self) -> List[HotspotSession]:
        pass

    @abstractmethod
    async def get_stale_pending(self, max_age_minutes: int) -> List[HotspotSession]:
        pass

    @abstractmethod
    async def create(self, session: HotspotSession) -> HotspotSession:
        pass

    @abstractmethod
    async def update(self, session: HotspotSession) -> HotspotSession:
        pass

    @abstractmethod
    async def delete(self, session_id: str) -> bool:
        pass
