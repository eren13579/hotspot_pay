import logging
import secrets
from typing import Optional, List

from app.domain.models.hotspot import Hotspot
from app.domain.repositories.abstract.hotspot_repository import IHotspotRepository

logger = logging.getLogger(__name__)

ONLINE_THRESHOLD_SECONDS = 30


class HotspotService:
    def __init__(self, hotspot_repo: IHotspotRepository):
        self._repo = hotspot_repo

    # ── CRUD ────────────────────────────────────────────────────────────

    async def create(self, user_id: str, name: str, location: str = None,
                     mikrotik_ip: str = "", mikrotik_port: int = 8728,
                     mikrotik_user: str = "", mikrotik_password_enc: str = "",
                     hotspot_profile: str = "default", router_brand: str = "mikrotik",
                     router_type: str = None, model_id: str = None) -> Hotspot:
        """Créer un nouveau hotspot."""
        import uuid
        hotspot = Hotspot(
            id=str(uuid.uuid4()),
            hotspot_id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            location=location,
            mikrotik_ip=mikrotik_ip,
            mikrotik_port=mikrotik_port,
            mikrotik_user=mikrotik_user,
            mikrotik_password_enc=mikrotik_password_enc,
            hotspot_profile=hotspot_profile,
            router_brand=router_brand or "mikrotik",
            router_type=router_type,
            model_id=model_id,
        )
        saved = await self._repo.create(hotspot)
        logger.info("Hotspot créé hotspot_id=%s user=%s", saved.hotspot_id, user_id)
        return saved

    async def get_by_hotspot_id(self, hotspot_id: str) -> Optional[Hotspot]:
        return await self._repo.get_by_hotspot_id(hotspot_id)

    async def get_owned_hotspot(self, hotspot_id: str, user_id: str) -> Optional[Hotspot]:
        return await self._repo.get_by_hotspot_id_and_user(hotspot_id, user_id)

    async def list_by_user(self, user_id: str, skip: int = 0, limit: int = 20) -> List[Hotspot]:
        return await self._repo.get_by_user_id(user_id, skip=skip, limit=limit)

    async def count_by_user(self, user_id: str) -> int:
        return await self._repo.count_by_user_id(user_id)

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[Hotspot]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def count_all(self) -> int:
        return await self._repo.count_all()

    async def exists_ip_for_user(self, mikrotik_ip: str, user_id: str) -> bool:
        return await self._repo.exists_by_ip_and_user(mikrotik_ip, user_id)

    async def update(self, hotspot: Hotspot) -> Hotspot:
        updated = await self._repo.update(hotspot)
        if updated:
            logger.info("Hotspot mis à jour hotspot_id=%s", hotspot.hotspot_id)
        return updated

    async def delete(self, hotspot_id: str) -> bool:
        ok = await self._repo.delete_by_hotspot_id(hotspot_id)
        if ok:
            logger.info("Hotspot supprimé hotspot_id=%s", hotspot_id)
        return ok

    # ── Status / Test ───────────────────────────────────────────────────

    async def get_status(self, hotspot_id: str, user_id: str = None) -> Optional[dict]:
        """Retourne le statut Pull du routeur basé sur last_ping_at."""
        if user_id:
            hotspot = await self._repo.get_by_hotspot_id_and_user(hotspot_id, user_id)
        else:
            hotspot = await self._repo.get_by_hotspot_id(hotspot_id)
        if not hotspot:
            return None

        if not hotspot.router_token:
            return {
                "hotspot_id": hotspot.hotspot_id,
                "name": hotspot.name,
                "is_online": False,
                "last_ping_at": hotspot.last_ping_at,
                "message": "Token routeur non configuré. Générez un token.",
            }

        from datetime import datetime, timezone
        last_poll = hotspot.last_ping_at
        if last_poll and last_poll.tzinfo is None:
            last_poll = last_poll.replace(tzinfo=timezone.utc)
        online = (
            last_poll is not None
            and (datetime.now(timezone.utc).replace(tzinfo=None) - last_poll.replace(tzinfo=None)).total_seconds() < ONLINE_THRESHOLD_SECONDS
        )

        if online:
            seconds_ago = int((datetime.now(timezone.utc).replace(tzinfo=None) - last_poll.replace(tzinfo=None)).total_seconds())
            message = f"Routeur ONLINE — dernier poll il y a {seconds_ago}s"
        elif last_poll is None:
            message = "Aucun poll reçu. Vérifiez le script MikroTik Scheduler."
        else:
            seconds_ago = int((datetime.now(timezone.utc).replace(tzinfo=None) - last_poll.replace(tzinfo=None)).total_seconds())
            message = f"Routeur OFFLINE — dernier poll il y a {seconds_ago}s"

        return {
            "hotspot_id": hotspot.hotspot_id,
            "name": hotspot.name,
            "is_online": online,
            "last_ping_at": hotspot.last_ping_at,
            "message": message,
        }

    # ── Token ───────────────────────────────────────────────────────────

    async def generate_router_token(self, hotspot_id: str) -> Optional[str]:
        hotspot = await self._repo.get_by_hotspot_id(hotspot_id)
        if not hotspot:
            return None
        token = secrets.token_urlsafe(32)
        await self._repo.update_router_token(hotspot_id, token)
        logger.info("Token généré hotspot_id=%s", hotspot_id)
        return token

    async def revoke_router_token(self, hotspot_id: str) -> bool:
        hotspot = await self._repo.get_by_hotspot_id(hotspot_id)
        if not hotspot:
            return False
        await self._repo.update_router_token(hotspot_id, None)
        logger.info("Token révoqué hotspot_id=%s", hotspot_id)
        return True

    def validate_router_token(self, hotspot: Hotspot, token: str) -> bool:
        if not hotspot.router_token:
            return False
        return secrets.compare_digest(hotspot.router_token, token)

    def sanitize(self, value: str) -> str:
        if not value:
            return ""
        return value.replace('"', '').replace('\r', '').replace('\n', '').replace('\\', '')

    def build_mikrotik_script(self, hotspot_id: str, token: str, base_url: str) -> str:
        safe_id = self.sanitize(hotspot_id)
        safe_token = self.sanitize(token)
        safe_url = self.sanitize(base_url)
        return (
            "# ============================================================\r\n"
            "# HotspotPay — Script MikroTik RouterOS Long Polling\r\n"
            "# Version : 3.0 — Architecture Hybride (Pseudo-Push / Long Polling)\r\n"
            "# Compatible : RouterOS 6.x et 7.x\r\n"
            "#\r\n"
            "# INSTALLATION :\r\n"
            "#   1. System -> Scripts -> Add  |  Name: hotspotpay-longpoll\r\n"
            "#   2. System -> Scheduler -> Add  |  Interval: 00:00:05\r\n"
            "# ============================================================\r\n"
            "\r\n"
            ":local hotspotId   \"" + safe_id + "\"\r\n"
            ":local routerToken \"" + safe_token + "\"\r\n"
            ":local serverUrl   \"" + safe_url + "\"\r\n"
            ":local defaultProfile \"default\"\r\n"
            "\r\n"
            ":if ([:len [/ip hotspot find]] = 0) do={\r\n"
            "    :log warning \"HotspotPay: Aucune interface HotSpot configuree\"\r\n"
            "    :error \"no hotspot interface\"\r\n"
            "}\r\n"
            "\r\n"
            ":local pendingUrl ($serverUrl . \"/api/v1/router/\" . $hotspotId . \"/pending-actions?token=\" . $routerToken)\r\n"
            ":local rawResponse \"\"\r\n"
            "\r\n"
            ":do {\r\n"
            "    /tool fetch url=$pendingUrl mode=https http-method=get \\\r\n"
            "        http-header-field=(\"X-Router-Token: \" . $routerToken) \\\r\n"
            "        output=user duration=25s keep-result=no as-value do={\r\n"
            "            :set rawResponse $\"data\"\r\n"
            "        }\r\n"
            "} on-error={\r\n"
            "    :log debug \"HotspotPay: Pas de connexion au serveur\"\r\n"
            "    :error \"connection failed\"\r\n"
            "}\r\n"
            "\r\n"
            ":if ([:len $rawResponse] < 10) do={\r\n"
            "    :log debug \"HotspotPay: Reponse vide\"\r\n"
            "    :error \"empty response\"\r\n"
            "}\r\n"
            "\r\n"
            ":local countPos [:find $rawResponse \"\\\"count\\\":\" 0]\r\n"
            ":if ($countPos < 0) do={ :log debug \"HotspotPay: Format inattendu\" :error \"bad format\" }\r\n"
            ":local countStart ($countPos + 8)\r\n"
            ":local countEnd [:find $rawResponse \",\" $countStart]\r\n"
            ":if ($countEnd < 0) do={ :set countEnd [:find $rawResponse \"}\" $countStart] }\r\n"
            ":local actionCount [:tonum [:pick $rawResponse $countStart $countEnd]]\r\n"
            ":if ($actionCount = 0) do={ :log debug \"HotspotPay: 0 action\" :error \"no actions\" }\r\n"
            "\r\n"
            ":log info (\"HotspotPay: \" . $actionCount . \" action(s) a traiter\")\r\n"
            ":local cursor 0\r\n"
            "\r\n"
            ":for i from=0 to=($actionCount - 1) do={\r\n"
            "    :local posId [:find $rawResponse \"\\\"actionId\\\"\" $cursor]\r\n"
            "    :if ($posId < 0) do={ :error \"no more actions\" }\r\n"
            "    :set cursor ($posId + 1)\r\n"
            "    :local vs [:find $rawResponse \"\\\"\" ($posId + 11)]\r\n"
            "    :local ve [:find $rawResponse \"\\\"\" ($vs + 1)]\r\n"
            "    :local actionId [:pick $rawResponse ($vs + 1) $ve]\r\n"
            "\r\n"
            "    :local posType [:find $rawResponse \"\\\"type\\\"\" $posId]\r\n"
            "    :local tsv [:find $rawResponse \"\\\"\" ($posType + 7)]\r\n"
            "    :local tev [:find $rawResponse \"\\\"\" ($tsv + 1)]\r\n"
            "    :local actionType [:pick $rawResponse ($tsv + 1) $tev]\r\n"
            "\r\n"
            "    :local posUn [:find $rawResponse \"\\\"username\\\"\" $posId]\r\n"
            "    :local unStart [:find $rawResponse \"\\\"\" ($posUn + 11)]\r\n"
            "    :local unEnd   [:find $rawResponse \"\\\"\" ($unStart + 1)]\r\n"
            "    :local username [:pick $rawResponse ($unStart + 1) $unEnd]\r\n"
            "\r\n"
            "    :local success true\r\n"
            "    :local errorMsg \"\"\r\n"
            "\r\n"
            "    :if ($actionType = \"CREATE_USER\") do={\r\n"
            "        :local posPw [:find $rawResponse \"\\\"password\\\"\" $posId]\r\n"
            "        :local pwS [:find $rawResponse \"\\\"\" ($posPw + 11)]\r\n"
            "        :local pwE [:find $rawResponse \"\\\"\" ($pwS + 1)]\r\n"
            "        :local password [:pick $rawResponse ($pwS + 1) $pwE]\r\n"
            "        :local posProf [:find $rawResponse \"\\\"profile\\\"\" $posId]\r\n"
            "        :local profile $defaultProfile\r\n"
            "        :if ($posProf > 0) do={\r\n"
            "            :local prS [:find $rawResponse \"\\\"\" ($posProf + 10)]\r\n"
            "            :local prE [:find $rawResponse \"\\\"\" ($prS + 1)]\r\n"
            "            :local profVal [:pick $rawResponse ($prS + 1) $prE]\r\n"
            "            :if ([:len $profVal] > 0) do={ :set profile $profVal }\r\n"
            "        }\r\n"
            "        :local posTl [:find $rawResponse \"\\\"timeLimit\\\"\" $posId]\r\n"
            "        :local timeLimitStr \"\"\r\n"
            "        :if ($posTl > 0) do={\r\n"
            "            :local tlS [:find $rawResponse \"\\\"\" ($posTl + 12)]\r\n"
            "            :local tlE [:find $rawResponse \"\\\"\" ($tlS + 1)]\r\n"
            "            :set timeLimitStr [:pick $rawResponse ($tlS + 1) $tlE]\r\n"
            "        }\r\n"
            "        :local existing [/ip hotspot user find name=$username]\r\n"
            "        :if ([:len $existing] > 0) do={ /ip hotspot user remove $existing }\r\n"
            "        :local addCmd (\"/ip hotspot user add name=\" . $username . \" password=\" . $password . \" profile=\" . $profile)\r\n"
            "        :if ([:len $timeLimitStr] > 0) do={ :set addCmd ($addCmd . \" limit-uptime=\" . $timeLimitStr) }\r\n"
            "        :do {\r\n"
            "            :execute $addCmd\r\n"
            "            :log info (\"HotspotPay: CREATE_USER OK user=\" . $username)\r\n"
            "        } on-error={\r\n"
            "            :set success false\r\n"
            "            :set errorMsg \"create_user_failed\"\r\n"
            "        }\r\n"
            "    }\r\n"
            "\r\n"
            "    :if ($actionType = \"REMOVE_USER\") do={\r\n"
            "        :do {\r\n"
            "            :local userEntry [/ip hotspot user find name=$username]\r\n"
            "            :if ([:len $userEntry] > 0) do={ /ip hotspot user remove $userEntry }\r\n"
            "        } on-error={\r\n"
            "            :set success false\r\n"
            "            :set errorMsg \"remove_user_failed\"\r\n"
            "        }\r\n"
            "    }\r\n"
            "\r\n"
            "    :if ($actionType = \"KICK_SESSION\") do={\r\n"
            "        :do {\r\n"
            "            :local activeEntry [/ip hotspot active find user=$username]\r\n"
            "            :if ([:len $activeEntry] > 0) do={ /ip hotspot active remove $activeEntry }\r\n"
            "        } on-error={\r\n"
            "            :set success false\r\n"
            "            :set errorMsg \"kick_session_failed\"\r\n"
            "        }\r\n"
            "    }\r\n"
            "\r\n"
            "    :local doneUrl ($serverUrl . \"/api/v1/router/\" . $hotspotId . \"/actions/\" . $actionId . \"/done?token=\" . $routerToken)\r\n"
            "    :local doneBody \"\"\r\n"
            "    :if ($success) do={\r\n"
            "        :set doneBody \"{\\\"success\\\":true,\\\"error\\\":\\\"\\\"}\"\r\n"
            "    } else={\r\n"
            "        :set doneBody (\"{\\\"success\\\":false,\\\"error\\\":\\\"\" . $errorMsg . \"\\\"}\")\r\n"
            "    }\r\n"
            "    :do {\r\n"
            "        /tool fetch url=$doneUrl mode=https http-method=post \\\r\n"
            "            http-header-field=\"Content-Type: application/json\" \\\r\n"
            "            http-data=$doneBody output=none keep-result=no duration=5s\r\n"
            "    } on-error={\r\n"
            "        :log error (\"HotspotPay: ACK FAILED actionId=\" . $actionId)\r\n"
            "    }\r\n"
            "}\r\n"
            "\r\n"
            ":log info (\"HotspotPay: Cycle termine — \" . $actionCount . \" action(s) traitee(s)\")\r\n"
        )

    # ── Inter-service (Java register) ───────────────────────────────────

    async def register_hotspot(self, hotspot: Hotspot) -> Hotspot:
        saved = await self._repo.create(hotspot)
        logger.info("Hotspot enregistré (inter-service) hotspot_id=%s", saved.hotspot_id)
        return saved

    async def register_router_ping(self, hotspot_id: str) -> None:
        await self._repo.update_ping(hotspot_id)
        logger.debug("Router ping hotspot_id=%s", hotspot_id)
