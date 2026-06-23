from typing import List, Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.ticket import Ticket, TicketStatus
from app.domain.repositories.abstract.ticket_repository import ITicketRepository
from app.infrastructure.persistence.schemas import TicketSchema


class TicketRepository(ITicketRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_model(self, schema: TicketSchema) -> Ticket:
        return Ticket(
            id=schema.id,
            ticket_id=schema.ticket_id,
            hotspot_id=schema.hotspot_id,
            user_id=schema.user_id,
            username=schema.username,
            password=schema.password,
            profile=schema.profile,
            time_limit=schema.time_limit,
            data_limit=schema.data_limit,
            comment=schema.comment,
            status=TicketStatus(schema.status),
            session_id=schema.session_id,
            client_mac=schema.client_mac,
            client_phone=schema.client_phone,
            used_at=schema.used_at,
            expires_at=schema.expires_at,
            created_at=schema.created_at,
            updated_at=schema.updated_at,
        )

    def _to_schema(self, model: Ticket) -> TicketSchema:
        return TicketSchema(
            id=model.id,
            ticket_id=model.ticket_id,
            hotspot_id=model.hotspot_id,
            user_id=model.user_id,
            username=model.username,
            password=model.password,
            profile=model.profile,
            time_limit=model.time_limit,
            data_limit=model.data_limit,
            comment=model.comment,
            status=model.status.value,
            session_id=model.session_id,
            client_mac=model.client_mac,
            client_phone=model.client_phone,
            used_at=model.used_at,
            expires_at=model.expires_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: str) -> Optional[Ticket]:
        result = await self._session.execute(select(TicketSchema).where(TicketSchema.id == id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_ticket_id(self, ticket_id: str) -> Optional[Ticket]:
        result = await self._session.execute(
            select(TicketSchema).where(TicketSchema.ticket_id == ticket_id))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_hotspot_and_username(self, hotspot_id: str, username: str) -> Optional[Ticket]:
        result = await self._session.execute(
            select(TicketSchema).where(
                TicketSchema.hotspot_id == hotspot_id,
                TicketSchema.username == username,
            ))
        schema = result.scalar_one_or_none()
        return self._to_model(schema) if schema else None

    async def get_by_hotspot_id(self, hotspot_id: str) -> List[Ticket]:
        result = await self._session.execute(
            select(TicketSchema).where(TicketSchema.hotspot_id == hotspot_id))
        return [self._to_model(s) for s in result.scalars().all()]

    async def create(self, ticket: Ticket) -> Ticket:
        schema = self._to_schema(ticket)
        self._session.add(schema)
        await self._session.flush()
        return self._to_model(schema)

    async def create_batch(self, tickets: List[Ticket]) -> List[Ticket]:
        schemas = [self._to_schema(t) for t in tickets]
        self._session.add_all(schemas)
        await self._session.flush()
        return [self._to_model(s) for s in schemas]

    async def update(self, ticket: Ticket) -> Ticket:
        schema = self._to_schema(ticket)
        await self._session.merge(schema)
        await self._session.flush()
        return ticket

    async def delete(self, id: str) -> None:
        result = await self._session.execute(select(TicketSchema).where(TicketSchema.id == id))
        schema = result.scalar_one_or_none()
        if schema:
            await self._session.delete(schema)

    async def delete_all_by_hotspot(self, hotspot_id: str) -> int:
        result = await self._session.execute(
            delete(TicketSchema).where(TicketSchema.hotspot_id == hotspot_id))
        return result.rowcount or 0

    async def exists_by_hotspot_and_username(self, hotspot_id: str, username: str) -> bool:
        result = await self._session.execute(
            select(TicketSchema).where(
                TicketSchema.hotspot_id == hotspot_id,
                TicketSchema.username == username,
            ))
        return result.scalar_one_or_none() is not None
