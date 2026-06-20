from typing import List, Optional
from datetime import datetime, timezone

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.payment import Payment, PaymentStatus
from app.domain.repositories.abstract.payment_repository import IPaymentRepository
from app.infrastructure.persistence.schemas import PaymentSchema


class PaymentRepository(IPaymentRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_model(self, schema: PaymentSchema) -> Payment:
        return Payment(
            id=schema.id,
            payment_id=schema.payment_id,
            reference=schema.reference,
            hotspot_id=schema.hotspot_id,
            plan_id=schema.plan_id,
            client_phone=schema.client_phone,
            client_mac=schema.client_mac,
            operator=schema.operator,
            amount=schema.amount,
            currency=schema.currency,
            status=PaymentStatus(schema.status),
            gateway_tx_id=schema.gateway_tx_id,
            failure_reason=schema.failure_reason,
            checkout_url=schema.checkout_url,
            paid_at=schema.paid_at,
            expires_at=schema.expires_at,
            created_at=schema.created_at,
            updated_at=schema.updated_at,
        )

    def _to_schema(self, model: Payment) -> PaymentSchema:
        return PaymentSchema(
            id=model.id,
            payment_id=model.payment_id,
            reference=model.reference,
            hotspot_id=model.hotspot_id,
            plan_id=model.plan_id,
            client_phone=model.client_phone,
            client_mac=model.client_mac,
            operator=model.operator,
            amount=model.amount,
            currency=model.currency,
            status=model.status.value,
            gateway_tx_id=model.gateway_tx_id,
            failure_reason=model.failure_reason,
            checkout_url=model.checkout_url,
            paid_at=model.paid_at,
            expires_at=model.expires_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: str) -> Optional[Payment]:
        result = await self._session.execute(select(PaymentSchema).where(PaymentSchema.id == id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_reference(self, reference: str) -> Optional[Payment]:
        result = await self._session.execute(
            select(PaymentSchema).where(PaymentSchema.reference == reference))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_payment_id(self, payment_id: str) -> Optional[Payment]:
        result = await self._session.execute(
            select(PaymentSchema).where(PaymentSchema.payment_id == payment_id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_gateway_tx_id(self, gateway_tx_id: str) -> Optional[Payment]:
        result = await self._session.execute(
            select(PaymentSchema).where(PaymentSchema.gateway_tx_id == gateway_tx_id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_hotspot_id(self, hotspot_id: str) -> List[Payment]:
        result = await self._session.execute(
            select(PaymentSchema).where(PaymentSchema.hotspot_id == hotspot_id))
        return [self._to_model(s) for s in result.scalars().all()]

    async def get_pending_not_expired(self) -> List[Payment]:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        result = await self._session.execute(
            select(PaymentSchema).where(
                PaymentSchema.status == 'PENDING',
                or_(PaymentSchema.expires_at == None, PaymentSchema.expires_at > now),
            ))
        return [self._to_model(s) for s in result.scalars().all()]

    async def create(self, payment: Payment) -> Payment:
        schema = self._to_schema(payment)
        self._session.add(schema)
        await self._session.flush()
        return self._to_model(schema)

    async def update(self, payment: Payment) -> Payment:
        schema = self._to_schema(payment)
        await self._session.merge(schema)
        await self._session.flush()
        return payment
