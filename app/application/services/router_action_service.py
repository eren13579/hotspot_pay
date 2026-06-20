import asyncio
import logging
from typing import List, Optional

import httpx

from app.config.settings import get_settings
from app.domain.models.router_action import RouterAction, RouterActionType, ActionStatus
from app.domain.repositories.abstract.router_action_repository import IRouterActionRepository
from app.infrastructure.messaging.action_queue import action_queue
from app.application.scripts.script_factory import ScriptFactory

logger = logging.getLogger(__name__)


class RouterActionService:
    def __init__(self, action_repo: IRouterActionRepository):
        self._repo = action_repo

    async def create_action(self, hotspot_id: str, action_type: RouterActionType,
                             username: str, password: str, profile: str = "default",
                             time_limit: str = None, data_limit=None,
                             comment: str = None, mac_address: str = None) -> RouterAction:
        """Create a new router action and enqueue it for Long Polling.

        data_limit: accepte int ou str (harmonisation Java↔Python).
                    Converti en int pour la DB si nécessaire.
        """
        # Harmoniser data_limit : Java envoie parfois String, parfois int
        dl = None
        if data_limit is not None:
            try:
                dl = int(data_limit)
            except (ValueError, TypeError):
                dl = None

        action = RouterAction(
            hotspot_id=hotspot_id,
            action_type=action_type,
            username=username,
            password=password,
            profile=profile,
            time_limit=time_limit,
            data_limit=dl,
            comment=comment,
            mac_address=mac_address,
            status=ActionStatus.PENDING,
        )
        saved = await self._repo.create(action)
        await action_queue.enqueue(saved)
        logger.info("Action created: action_id=%s hotspot=%s type=%s user=%s",
                     saved.action_id, hotspot_id, action_type.value, username)
        return saved

    async def create_action_from_ticket(self, hotspot_id: str, username: str,
                                         password: str, profile: str = "default",
                                         time_limit: str = None, data_limit: int = None,
                                         comment: str = None) -> RouterAction:
        """Convenience: create a CREATE_USER action from ticket data."""
        return await self.create_action(
            hotspot_id=hotspot_id,
            action_type=RouterActionType.CREATE_USER,
            username=username,
            password=password,
            profile=profile,
            time_limit=time_limit,
            data_limit=data_limit,
            comment=comment,
        )

    async def execute_on_router(
        self,
        action: RouterAction,
        router_ip: str,
        router_port: int,
        router_brand: str = "mikrotik",
        router_user: str = "admin",
        router_password: str = "",
    ) -> bool:
        """Execute une action sur le routeur physique en utilisant le script de la marque."""
        script = ScriptFactory.get_script(router_brand)

        if action.action_type == RouterActionType.CREATE_USER:
            return await script.create_user(
                router_ip=router_ip,
                port=router_port,
                username=action.username,
                password=action.password,
                profile=action.profile,
                router_user=router_user,
                router_password=router_password,
            )
        elif action.action_type == RouterActionType.REMOVE_USER:
            return await script.remove_user(
                router_ip=router_ip,
                port=router_port,
                username=action.username,
                router_user=router_user,
                router_password=router_password,
            )
        elif action.action_type == RouterActionType.KICK_SESSION:
            return await script.kick_user(
                router_ip=router_ip,
                port=router_port,
                mac_address=action.mac_address or "",
                router_user=router_user,
                router_password=router_password,
            )
        else:
            logger.warning("Type d'action non supporte: %s", action.action_type)
            return False

    async def get_pending_actions(self, hotspot_id: str) -> List[RouterAction]:
        return await action_queue.get_pending_actions(hotspot_id)

    async def ack_action(self, action_id: str, success: bool, error: str = "") -> bool:
        """Process ACK from router after action execution. Notify Java on success."""
        action = await self._repo.get_by_action_id(action_id)
        if not action:
            logger.warning("ACK for unknown action: %s", action_id)
            return False

        action.mark_ack(success, error)
        await self._repo.update(action)
        await action_queue.mark_delivered(action_id)
        logger.info("Action ACK: action_id=%s success=%s", action_id, success)

        # Notify Java service that session is now ACTIVE
        if success and action.action_type == RouterActionType.CREATE_USER:
            await self._notify_java_session_activated(action)

        return True

    async def _notify_java_session_activated(self, action: RouterAction) -> None:
        """Callback Java: session MikroTik activée avec succès."""
        settings = get_settings()
        callback_url = settings.JAVA_CALLBACK_URL + "/session-activated"

        # Extract sessionId from comment (format: "HP:{sessionId}")
        session_id = None
        if action.comment and action.comment.startswith("HP:"):
            session_id = action.comment[3:]

        payload = {
            "sessionId": session_id,
            "actionId": action.action_id,
            "username": action.username,
            "success": True,
            "error": "",
        }

        headers = {"X-Callback-Secret": settings.JAVA_CALLBACK_SECRET}
        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=settings.JAVA_CALLBACK_TIMEOUT) as client:
                    resp = await client.post(callback_url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        logger.info("Java callback OK: sessionId=%s actionId=%s",
                                    session_id, action.action_id)
                        return
                    if resp.status_code == 401:
                        logger.error("Java callback 401 Unauthorized — vérifier JAVA_CALLBACK_SECRET")
                        return  # pas la peine de retry, le secret est mauvais
                    logger.warning("Java callback returned %d (attempt %d/%d): sessionId=%s",
                                   resp.status_code, attempt, max_retries, session_id)
            except Exception as e:
                logger.warning("Java callback attempt %d/%d failed sessionId=%s: %s",
                               attempt, max_retries, session_id, e)
            if attempt < max_retries:
                await asyncio.sleep(2 ** attempt)  # 2s, 4s
        logger.error("Java callback DEFINITIVELY FAILED after %d attempts: sessionId=%s — session reste PENDING_MIKROTIK",
                     max_retries, session_id)

    async def cleanup_expired(self) -> int:
        """Remove expired pending actions older than 5 minutes."""
        count = await self._repo.delete_expired(max_age_seconds=300)
        if count:
            logger.info("Cleaned up %d expired actions", count)
        return count
