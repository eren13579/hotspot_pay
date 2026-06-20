"""
Script TP-Link — communication via API HTTP.
Utilise l'interface web (http://<ip>/cgi-bin/...) pour gérer les hotspots.
"""
import logging
from typing import Optional

import httpx

from app.application.scripts.base import RouterScript

logger = logging.getLogger(__name__)
DEFAULT_PORT = 80


class TpLinkScript(RouterScript):
    """Script TP-Link — HTTP API / web interface."""

    @property
    def brand_slug(self) -> str:
        return "tp-link"

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
        logger.info("[TP-Link] create_user: %s@%s:%d (profile=%s, time=%ss, data=%s)",
                     username, router_ip, port, profile, time_limit_seconds,
                     f"{data_limit_bytes}B" if data_limit_bytes else "unlimited")

        try:
            url = f"http://{router_ip}:{port}/cgi-bin/hotspot.cgi"
            payload = {
                "action": "add",
                "username": username,
                "password": password,
                "profile": profile,
            }
            if time_limit_seconds:
                payload["time_limit"] = str(time_limit_seconds)
            if data_limit_bytes:
                payload["data_limit"] = str(data_limit_bytes)

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=payload)
                success = resp.status_code == 200

            if success:
                logger.info("[TP-Link] create_user REUSSI: %s@%s", username, router_ip)
            else:
                logger.warning("[TP-Link] create_user FAIL: HTTP %d", resp.status_code)
            return success

        except Exception as e:
            logger.error("[TP-Link] create_user ERREUR: %s — %s", username, e)
            return False

    async def remove_user(self, router_ip: str, port: int, username: str,
                           router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[TP-Link] remove_user: %s@%s:%d", username, router_ip, port)

        try:
            url = f"http://{router_ip}:{port}/cgi-bin/hotspot.cgi"
            payload = {"action": "delete", "username": username}

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=payload)
                success = resp.status_code == 200

            if success:
                logger.info("[TP-Link] remove_user REUSSI: %s@%s", username, router_ip)
            return success

        except Exception as e:
            logger.error("[TP-Link] remove_user ERREUR: %s — %s", username, e)
            return False

    async def kick_user(self, router_ip: str, port: int, mac_address: str,
                         router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[TP-Link] kick_user: %s@%s:%d", mac_address, router_ip, port)

        try:
            url = f"http://{router_ip}:{port}/cgi-bin/hotspot.cgi"
            payload = {"action": "kick", "mac": mac_address}

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, data=payload)
                success = resp.status_code == 200

            if success:
                logger.info("[TP-Link] kick_user REUSSI: %s@%s", mac_address, router_ip)
            return success

        except Exception as e:
            logger.error("[TP-Link] kick_user ERREUR: %s — %s", mac_address, e)
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
