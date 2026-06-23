"""
Script Tenda — communication via API HTTP (interface web).
Compatible N301, F3, AC8, AC10, MW6, etc.
"""
import logging
from typing import Optional

import httpx

from app.application.scripts.base import RouterScript

logger = logging.getLogger(__name__)
DEFAULT_PORT = 80

# Cookie-based auth pour Tenda
TENDA_COOKIE = "admin:language=en; password=hotspotpay"


class TendaScript(RouterScript):
    """Script Tenda — HTTP API (cookie-based)."""

    @property
    def brand_slug(self) -> str:
        return "tenda"

    async def create_user(
        self,
        router_ip: str,
        port: int,
        username: str,
        password: str,
        profile: str = "default",
        time_limit_seconds: int = 0,
        data_limit_bytes: int = 0,
        mac_address: Optional[str] = None,
        router_user: str = "admin",
        router_password: str = "",
    ) -> bool:
        port = port or DEFAULT_PORT
        logger.info("[Tenda] create_user: %s@%s:%d (profile=%s, time=%ss)",
                     username, router_ip, port, profile, time_limit_seconds)

        try:
            url = f"http://{router_ip}:{port}/goform/HotspotUserAdd"
            headers = {"Cookie": TENDA_COOKIE}
            payload = {
                "username": username,
                "password": password,
                "profile": profile,
            }
            if time_limit_seconds:
                payload["valid_time"] = str(time_limit_seconds)

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=payload, headers=headers)
                success = resp.status_code == 200

            if success:
                logger.info("[Tenda] create_user REUSSI: %s@%s", username, router_ip)
            else:
                logger.warning("[Tenda] create_user FAIL: HTTP %d", resp.status_code)
            return success

        except Exception as e:
            logger.error("[Tenda] create_user ERREUR: %s — %s", username, e)
            return False

    async def remove_user(self, router_ip: str, port: int, username: str,
                           router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[Tenda] remove_user: %s@%s:%d", username, router_ip, port)

        try:
            url = f"http://{router_ip}:{port}/goform/HotspotUserDel"
            headers = {"Cookie": TENDA_COOKIE}
            payload = {"username": username}

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=payload, headers=headers)
                success = resp.status_code == 200

            if success:
                logger.info("[Tenda] remove_user REUSSI: %s", username)
            return success

        except Exception as e:
            logger.error("[Tenda] remove_user ERREUR: %s — %s", username, e)
            return False

    async def kick_user(self, router_ip: str, port: int, mac_address: str,
                         router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[Tenda] kick_user: %s@%s:%d", mac_address, router_ip, port)

        try:
            url = f"http://{router_ip}:{port}/goform/HotspotKick"
            headers = {"Cookie": TENDA_COOKIE}
            payload = {"mac": mac_address}

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=payload, headers=headers)
                success = resp.status_code == 200

            if success:
                logger.info("[Tenda] kick_user REUSSI: %s", mac_address)
            return success

        except Exception as e:
            logger.error("[Tenda] kick_user ERREUR: %s — %s", mac_address, e)
            return False

    async def ping(self, router_ip: str, port: int,
                    router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        try:
            url = f"http://{router_ip}:{port}/"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                return resp.status_code < 500
        except Exception:
            return False
