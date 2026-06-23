from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.ticket import Ticket


class ITicketRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[Ticket]:
        pass

    @abstractmethod
    async def get_by_ticket_id(self, ticket_id: str) -> Optional[Ticket]:
        pass

    @abstractmethod
    async def get_by_hotspot_and_username(self, hotspot_id: str, username: str) -> Optional[Ticket]:
        pass

    @abstractmethod
    async def get_by_hotspot_id(self, hotspot_id: str) -> List[Ticket]:
        pass

    @abstractmethod
    async def create(self, ticket: Ticket) -> Ticket:
        pass

    @abstractmethod
    async def create_batch(self, tickets: List[Ticket]) -> List[Ticket]:
        pass

    @abstractmethod
    async def update(self, ticket: Ticket) -> Ticket:
        pass

    @abstractmethod
    async def delete(self, id: str) -> None:
        pass

    @abstractmethod
    async def delete_all_by_hotspot(self, hotspot_id: str) -> int:
        pass

    @abstractmethod
    async def exists_by_hotspot_and_username(self, hotspot_id: str, username: str) -> bool:
        pass
