from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.models.payment import Payment


class IPaymentRepository(ABC):

    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[Payment]:
        pass

    @abstractmethod
    async def get_by_reference(self, reference: str) -> Optional[Payment]:
        pass

    @abstractmethod
    async def get_by_payment_id(self, payment_id: str) -> Optional[Payment]:
        pass

    @abstractmethod
    async def get_by_gateway_tx_id(self, gateway_tx_id: str) -> Optional[Payment]:
        pass

    @abstractmethod
    async def get_by_hotspot_id(self, hotspot_id: str) -> List[Payment]:
        pass

    @abstractmethod
    async def get_pending_not_expired(self) -> List[Payment]:
        pass

    @abstractmethod
    async def create(self, payment: Payment) -> Payment:
        pass

    @abstractmethod
    async def update(self, payment: Payment) -> Payment:
        pass
