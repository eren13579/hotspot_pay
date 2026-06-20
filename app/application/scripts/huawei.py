"""
Script Huawei — communication via API HTTP (interface web / API REST).
Compatible avec B311, B525, B535, E5577, E8372, etc.
"""
import logging
from typing import Optional

import httpx

from app.application.scripts.base import RouterScript

logger = logging.getLogger(__name__)
DEFAULT_PORT = 80


HUAWEI_API_PATHS = {
    "create_user": "/api/user/hotspot/add",
    "remove_user": "/api/user/hotspot/remove",
    "kick_user": "/api/user/hotspot/disconnect",
    "ping": "/api/device/information",
}


class HuaweiScript(RouterScript):
    """Script Huawei — HTTP REST API."""

    @property
    def brand_slug(self) -> str:
        return "huawei"

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
        logger.info("[Huawei] create_user: %s@%s:%d (profile=%s, time=%ss)",
                     username, router_ip, port, profile, time_limit_seconds)

        try:
            url = f"http://{router_ip}:{port}{HUAWEI_API_PATHS['create_user']}"
            payload = {
                "Username": username,
                "Password": password,
                "ProfileName": profile,
            }
            if time_limit_seconds:
                payload["SessionTimeout"] = str(time_limit_seconds)
            if data_limit_bytes:
                payload["DataLimit"] = str(data_limit_bytes)

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                success = resp.status_code == 200

            if success:
                logger.info("[Huawei] create_user REUSSI: %s@%s", username, router_ip)
            else:
                logger.warning("[Huawei] create_user FAIL: HTTP %d — %s",
                                resp.status_code, resp.text[:200])
            return success

        except Exception as e:
            logger.error("[Huawei] create_user ERREUR: %s — %s", username, e)
            return False

    async def remove_user(self, router_ip: str, port: int, username: str,
                           router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[Huawei] remove_user: %s@%s:%d", username, router_ip, port)

        try:
            url = f"http://{router_ip}:{port}{HUAWEI_API_PATHS['remove_user']}"
            payload = {"Username": username}

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                success = resp.status_code == 200

            if success:
                logger.info("[Huawei] remove_user REUSSI: %s", username)
            return success

        except Exception as e:
            logger.error("[Huawei] remove_user ERREUR: %s — %s", username, e)
            return False

    async def kick_user(self, router_ip: str, port: int, mac_address: str,
                         router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[Huawei] kick_user: %s@%s:%d", mac_address, router_ip, port)

        try:
            url = f"http://{router_ip}:{port}{HUAWEI_API_PATHS['kick_user']}"
            payload = {"MacAddress": mac_address}

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                success = resp.status_code == 200

            if success:
                logger.info("[Huawei] kick_user REUSSI: %s", mac_address)
            return success

        except Exception as e:
            logger.error("[Huawei] kick_user ERREUR: %s — %s", mac_address, e)
            return False

    async def ping(self, router_ip: str, port: int,
                    router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        try:
            url = f"http://{router_ip}:{port}{HUAWEI_API_PATHS['ping']}"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("DeviceName") is not None
                return False
        except Exception:
            return False
