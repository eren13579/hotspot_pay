"""
Script Ubiquiti UniFi — communication via API HTTP UniFi Controller.
Utilise l'API REST locale du UniFi Controller (port 8443) ou API direct AP.
"""
import logging
from typing import Optional

import httpx

from app.application.scripts.base import RouterScript

logger = logging.getLogger(__name__)
DEFAULT_PORT = 8443

class UbiquitiScript(RouterScript):
    """Script Ubiquiti — API REST UniFi Controller."""

    @property
    def brand_slug(self) -> str:
        return "ubiquiti"

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
        logger.info("[Ubiquiti] create_user: %s@%s:%d (profile=%s, time=%ss)",
                     username, router_ip, port, profile, time_limit_seconds)

        try:
            # Étape 1 : authentifier
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                login_url = f"https://{router_ip}:{port}/api/login"
                login_resp = await client.post(login_url, json={
                    "username": router_user,
                    "password": router_password,
                })
                if login_resp.status_code != 200:
                    logger.warning("[Ubiquiti] create_user: login echoue HTTP %d",
                                    login_resp.status_code)
                    return False

                # Étape 2 : créer le client hotspot (voucher-based)
                api_url = f"https://{router_ip}:{port}/api/s/default/rest/user"
                payload = {
                    "name": username,
                    "note": f"HotspotPay-{username}",
                }
                if time_limit_seconds:
                    payload["qos_overwrite_rate_max_up"] = 0
                    payload["qos_overwrite_rate_max_down"] = 0

                resp = await client.post(api_url, json=payload)
                success = resp.status_code in (200, 201)

            if success:
                logger.info("[Ubiquiti] create_user REUSSI: %s@%s", username, router_ip)
            else:
                logger.warning("[Ubiquiti] create_user FAIL: HTTP %d", resp.status_code)
            return success

        except Exception as e:
            logger.error("[Ubiquiti] create_user ERREUR: %s — %s", username, e)
            return False

    async def remove_user(self, router_ip: str, port: int, username: str,
                           router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[Ubiquiti] remove_user: %s@%s:%d", username, router_ip, port)

        try:
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                login_url = f"https://{router_ip}:{port}/api/login"
                await client.post(login_url, json={
                    "username": router_user,
                    "password": router_password,
                })

                # Récupérer l'user ID
                api_url = f"https://{router_ip}:{port}/api/s/default/rest/user"
                resp = await client.get(api_url)
                if resp.status_code != 200:
                    return False

                users = resp.json().get("data", [])
                user_id = None
                for u in users:
                    if u.get("name") == username:
                        user_id = u["_id"]
                        break

                if not user_id:
                    logger.warning("[Ubiquiti] remove_user: user %s non trouve", username)
                    return False

                delete_url = f"https://{router_ip}:{port}/api/s/default/rest/user/{user_id}"
                del_resp = await client.delete(delete_url)
                success = del_resp.status_code == 200

            if success:
                logger.info("[Ubiquiti] remove_user REUSSI: %s", username)
            return success

        except Exception as e:
            logger.error("[Ubiquiti] remove_user ERREUR: %s — %s", username, e)
            return False

    async def kick_user(self, router_ip: str, port: int, mac_address: str,
                         router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[Ubiquiti] kick_user: %s@%s:%d", mac_address, router_ip, port)

        try:
            async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
                login_url = f"https://{router_ip}:{port}/api/login"
                await client.post(login_url, json={
                    "username": router_user,
                    "password": router_password,
                })

                api_url = f"https://{router_ip}:{port}/api/s/default/cmd/stamgr"
                payload = {
                    "cmd": "kick-sta",
                    "mac": mac_address,
                }
                resp = await client.post(api_url, json=payload)
                success = resp.status_code == 200

            if success:
                logger.info("[Ubiquiti] kick_user REUSSI: %s", mac_address)
            return success

        except Exception as e:
            logger.error("[Ubiquiti] kick_user ERREUR: %s — %s", mac_address, e)
            return False

    async def ping(self, router_ip: str, port: int,
                    router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        try:
            url = f"https://{router_ip}:{port}/api/self"
            async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
                resp = await client.get(url)
                return resp.status_code == 200
        except Exception:
            return False
