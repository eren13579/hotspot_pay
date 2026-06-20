"""
Script MikroTik — communication via RouterOS API (port 8728 par défaut).
Utilise la librairie routeros_api pour envoyer les commandes directement.
"""
import logging
from typing import Optional

from app.application.scripts.base import RouterScript

logger = logging.getLogger(__name__)

# Configuration par défaut MikroTik
DEFAULT_PORT = 8728
DEFAULT_API_TIMEOUT = 10.0

try:
    import routeros_api
    HAS_ROUTEROS_LIB = True
except ImportError:
    HAS_ROUTEROS_LIB = False
    logger.warning("routeros_api non installe — mode simulation actif pour MikroTik")


class MikroTikScript(RouterScript):
    """Script MikroTik — RouterOS API."""

    @property
    def brand_slug(self) -> str:
        return "mikrotik"

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
        logger.info("[MikroTik] create_user: %s@%s:%d (profile=%s, time=%ss, data=%s)",
                     username, router_ip, port, profile, time_limit_seconds,
                     f"{data_limit_bytes}B" if data_limit_bytes else "unlimited")

        if not HAS_ROUTEROS_LIB:
            return await self._simulate_call("create_user", router_ip, username)

        try:
            connection = routeros_api.RouterOsApiPool(
                router_ip,
                username=router_user,
                password=router_password,
                port=port,
                plaintext_login=True,
            )
            api = connection.get_api()

            # Format time-limit pour MikroTik: "1h30m", "30m", etc.
            time_limit_str = self._format_time_limit(time_limit_seconds) if time_limit_seconds else None

            # Construire les paramètres
            params = {
                "name": username,
                "password": password,
                "profile": profile,
            }
            if time_limit_str:
                params["limit-uptime"] = time_limit_str
            if data_limit_bytes:
                params["limit-bytes-total"] = str(data_limit_bytes)
            if mac_address:
                params["mac-address"] = mac_address
                params["mac-cookie-timeout"] = time_limit_str or "1d"

            api.get_resource("/ip/hotspot/user").add(**params)
            connection.disconnect()
            logger.info("[MikroTik] create_user REUSSI: %s@%s", username, router_ip)
            return True

        except Exception as e:
            logger.error("[MikroTik] create_user ERREUR: %s@%s — %s", username, router_ip, e)
            return False

    async def remove_user(self, router_ip: str, port: int, username: str,
                          router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[MikroTik] remove_user: %s@%s:%d", username, router_ip, port)

        if not HAS_ROUTEROS_LIB:
            return await self._simulate_call("remove_user", router_ip, username)

        try:
            connection = routeros_api.RouterOsApiPool(router_ip, username=router_user, password=router_password,
                                                        port=port, plaintext_login=True)
            api = connection.get_api()
            resource = api.get_resource("/ip/hotspot/user")
            users = resource.get(name=username)
            for u in users:
                resource.remove(id=u[".id"])
            connection.disconnect()
            logger.info("[MikroTik] remove_user REUSSI: %s@%s", username, router_ip)
            return True
        except Exception as e:
            logger.error("[MikroTik] remove_user ERREUR: %s — %s", username, e)
            return False

    async def kick_user(self, router_ip: str, port: int, mac_address: str,
                        router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        logger.info("[MikroTik] kick_user: %s@%s:%d", mac_address, router_ip, port)

        if not HAS_ROUTEROS_LIB:
            return await self._simulate_call("kick_user", router_ip, mac_address)

        try:
            connection = routeros_api.RouterOsApiPool(router_ip, username=router_user, password=router_password,
                                                        port=port, plaintext_login=True)
            api = connection.get_api()

            # Trouver l'utilisateur par MAC et le kick
            active = api.get_resource("/ip/hotspot/active")
            sessions = active.get(mac_address=mac_address)
            for s in sessions:
                active.remove(id=s[".id"])

            connection.disconnect()
            logger.info("[MikroTik] kick_user REUSSI: %s@%s", mac_address, router_ip)
            return True
        except Exception as e:
            logger.error("[MikroTik] kick_user ERREUR: %s — %s", mac_address, e)
            return False

    async def ping(self, router_ip: str, port: int,
                   router_user: str = "admin", router_password: str = "") -> bool:
        port = port or DEFAULT_PORT
        if not HAS_ROUTEROS_LIB:
            return True
        try:
            connection = routeros_api.RouterOsApiPool(router_ip, username=router_user, password=router_password,
                                                        port=port, plaintext_login=True, timeout=5)
            api = connection.get_api()
            api.get_resource("/system/resource").get()
            connection.disconnect()
            return True
        except Exception:
            return False

    async def _simulate_call(self, action: str, router_ip: str, identifier: str) -> bool:
        """Simulation quand routeros_api n'est pas installé."""
        logger.info("[MikroTik][SIMULATION] %s: %s@%s", action, identifier, router_ip)
        return True

    @staticmethod
    def _format_time_limit(seconds: int) -> str:
        """Convertit des secondes en format MikroTik (ex: 3600 -> '1h')."""
        if not seconds:
            return "0"
        parts = []
        hours, remainder = divmod(seconds, 3600)
        minutes, secs = divmod(remainder, 60)
        if hours:
            parts.append(f"{hours}h")
        if minutes:
            parts.append(f"{minutes}m")
        if secs:
            parts.append(f"{secs}s")
        return "".join(parts)
