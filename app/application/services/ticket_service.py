import logging
import uuid
from typing import List, Optional, Tuple

from app.domain.models.ticket import Ticket, TicketStatus
from app.domain.repositories.abstract.ticket_repository import ITicketRepository

logger = logging.getLogger(__name__)


class TicketService:
    def __init__(self, ticket_repo: ITicketRepository):
        self._repo = ticket_repo

    async def import_tickets(self, hotspot_id: str, user_id: str,
                              tickets_data: List[dict]) -> Tuple[int, int, List[str]]:
        """Import tickets, skip duplicates. Returns (imported, skipped, skipped_usernames)."""
        imported = 0
        skipped = 0
        skipped_usernames = []

        for item in tickets_data:
            username = item.get("username", "")
            if await self._repo.exists_by_hotspot_and_username(hotspot_id, username):
                skipped += 1
                skipped_usernames.append(username)
                continue

            ticket = Ticket(
                id=str(uuid.uuid4()),
                ticket_id="tkt_" + uuid.uuid4().hex[:12],
                hotspot_id=hotspot_id,
                user_id=user_id,
                username=username,
                password=item.get("password", ""),
                profile=item.get("profile", "default"),
                time_limit=item.get("time_limit"),
                data_limit=item.get("data_limit"),
                comment=item.get("comment"),
                status=TicketStatus.AVAILABLE,
            )
            await self._repo.create(ticket)
            imported += 1

        logger.info("Import tickets hotspot=%s: %d imported, %d skipped",
                     hotspot_id, imported, skipped)
        return imported, skipped, skipped_usernames

    async def get_ticket_by_username(self, hotspot_id: str, username: str) -> Optional[Ticket]:
        return await self._repo.get_by_hotspot_and_username(hotspot_id, username)

    async def mark_ticket_used(self, ticket_id: str, session_id: str,
                                client_mac: str = None, client_phone: str = None) -> None:
        ticket = await self._repo.get_by_ticket_id(ticket_id)
        if ticket:
            ticket.mark_used(session_id, client_mac, client_phone)
            await self._repo.update(ticket)

    async def revoke_ticket(self, ticket_id: str) -> bool:
        ticket = await self._repo.get_by_ticket_id(ticket_id)
        if not ticket:
            return False
        ticket.mark_revoked()
        await self._repo.update(ticket)
        return True

    async def delete_all_by_hotspot(self, hotspot_id: str) -> int:
        return await self._repo.delete_all_by_hotspot(hotspot_id)

    async def list_by_hotspot(self, hotspot_id: str) -> List[Ticket]:
        return await self._repo.get_by_hotspot_id(hotspot_id)

    async def get_by_ticket_id(self, ticket_id: str) -> Optional[Ticket]:
        return await self._repo.get_by_ticket_id(ticket_id)

    async def delete_by_id(self, ticket_id: str) -> bool:
        ticket = await self._repo.get_by_ticket_id(ticket_id)
        if not ticket:
            return False
        await self._repo.delete(ticket.id)
        return True
