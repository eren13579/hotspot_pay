"""
API Routeur — Envoie les commandes au routeur physique selon la marque.

Supporte : mikrotik, tp-link, huawei, ubiquiti, tenda
"""
import logging
import httpx

logger = logging.getLogger(__name__)


async def execute_on_router(
    brand: str,
    router_ip: str,
    router_port: int,
    router_user: str,
    router_pass: str,
    action_type: str,
    username: str,
    password: str,
    profile: str = "default",
    mac_address: str = "",
) -> tuple[bool, str]:
    """
    Execute une action sur le routeur.

    Returns:
        (success: bool, error_message: str)
    """
    brand = brand.lower().strip()

    try:
        if brand == "mikrotik":
            return await _mikrotik(router_ip, router_port, router_user, router_pass,
                                   action_type, username, password, profile, mac_address)
        elif brand in ("tp-link", "tplink"):
            return await _tplink(router_ip, router_port, router_user, router_pass,
                                 action_type, username, password, profile, mac_address)
        elif brand == "huawei":
            return await _huawei(router_ip, router_port, router_user, router_pass,
                                 action_type, username, password, profile, mac_address)
        elif brand == "ubiquiti":
            return await _ubiquiti(router_ip, router_port, router_user, router_pass,
                                   action_type, username, password, profile, mac_address)
        elif brand == "tenda":
            return await _tenda(router_ip, router_port, router_user, router_pass,
                                action_type, username, password, profile, mac_address)
        else:
            return False, f"Marque non supportée: {brand}"
    except Exception as e:
        logger.error("[Agent] Erreur execute_on_router: %s", e)
        return False, str(e)


# ── MikroTik (via routeros_api) ──

async def _mikrotik(router_ip, port, user, passwd, action_type, username, password, profile, mac):
    try:
        import routeros_api  # noqa: F401
        has_lib = True
    except ImportError:
        has_lib = False

    if not has_lib:
        # Fallback SSH
        return await _mikrotik_ssh(router_ip, port, user, passwd, action_type, username, password, profile, mac)

    try:
        from routeros_api import RouterOsApiPool
        conn = RouterOsApiPool(router_ip, username=user, password=passwd,
                                port=port or 8728, plaintext_login=True)
        api = conn.get_api()

        if action_type == "CREATE_USER":
            params = {"name": username, "password": password, "profile": profile}
            if mac:
                params["mac-address"] = mac
            api.get_resource("/ip/hotspot/user").add(**params)
        elif action_type == "REMOVE_USER":
            users = api.get_resource("/ip/hotspot/user").get(name=username)
            for u in users:
                api.get_resource("/ip/hotspot/user").remove(id=u[".id"])
        elif action_type == "KICK_SESSION":
            if mac:
                active = api.get_resource("/ip/hotspot/active").get(mac_address=mac)
                for s in active:
                    api.get_resource("/ip/hotspot/active").remove(id=s[".id"])
        conn.disconnect()
        return True, ""
    except Exception as e:
        return False, str(e)


async def _mikrotik_ssh(router_ip, port, user, passwd, action_type, username, password, profile, mac):
    """Fallback MikroTik via SSH (sans routeros_api)."""
    try:
        import asyncssh  # noqa: F401
        has_ssh = True
    except ImportError:
        has_ssh = False

    if not has_ssh:
        return False, "routeros_api et asyncssh non installés"

    try:
        async with asyncssh.connect(router_ip, port=port or 22, username=user, password=passwd,
                                     known_hosts=None) as conn:
            if action_type == "CREATE_USER":
                cmd = f'/ip hotspot user add name="{username}" password="{password}" profile="{profile}"'
                if mac:
                    cmd += f' mac-address="{mac}"'
            elif action_type == "REMOVE_USER":
                cmd = f'/ip hotspot user remove [find name="{username}"]'
            elif action_type == "KICK_SESSION" and mac:
                cmd = f'/ip hotspot active remove [find mac-address="{mac}"]'
            else:
                return False, f"Action non supportée: {action_type}"
            await conn.run(cmd)
        return True, ""
    except Exception as e:
        return False, str(e)


# ── TP-Link ──

async def _tplink(router_ip, port, user, passwd, action_type, username, password, profile, mac):
    base_url = f"http://{router_ip}:{port or 80}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if action_type == "CREATE_USER":
                resp = await client.post(f"{base_url}/cgi-bin/hotspot.cgi", data={
                    "action": "add", "username": username, "password": password, "profile": profile
                })
            elif action_type == "REMOVE_USER":
                resp = await client.post(f"{base_url}/cgi-bin/hotspot.cgi", data={
                    "action": "delete", "username": username
                })
            elif action_type == "KICK_SESSION" and mac:
                resp = await client.post(f"{base_url}/cgi-bin/hotspot.cgi", data={
                    "action": "kick", "mac": mac
                })
            else:
                return False, f"Action non supportée: {action_type}"
            return resp.status_code == 200, "" if resp.status_code == 200 else f"HTTP {resp.status_code}"
    except Exception as e:
        return False, str(e)


# ── Huawei ──

async def _huawei(router_ip, port, user, passwd, action_type, username, password, profile, mac):
    base_url = f"http://{router_ip}:{port or 80}"
    paths = {
        "create": "/api/user/hotspot/add",
        "remove": "/api/user/hotspot/remove",
        "kick": "/api/user/hotspot/disconnect",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if action_type == "CREATE_USER":
                resp = await client.post(f"{base_url}{paths['create']}",
                    json={"Username": username, "Password": password, "ProfileName": profile})
            elif action_type == "REMOVE_USER":
                resp = await client.post(f"{base_url}{paths['remove']}",
                    json={"Username": username})
            elif action_type == "KICK_SESSION" and mac:
                resp = await client.post(f"{base_url}{paths['kick']}",
                    json={"MacAddress": mac})
            else:
                return False, f"Action non supportée: {action_type}"
            return resp.status_code == 200, "" if resp.status_code == 200 else f"HTTP {resp.status_code}"
    except Exception as e:
        return False, str(e)


# ── Ubiquiti UniFi ──

async def _ubiquiti(router_ip, port, user, passwd, action_type, username, password, profile, mac):
    base_url = f"https://{router_ip}:{port or 8443}"
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            # Login
            login_resp = await client.post(f"{base_url}/api/login",
                json={"username": user or "admin", "password": passwd or ""})
            if login_resp.status_code != 200:
                return False, "Login UniFi échoué"

            if action_type == "CREATE_USER":
                resp = await client.post(f"{base_url}/api/s/default/rest/user",
                    json={"name": username, "note": f"HotspotPay-{username}"})
            elif action_type == "REMOVE_USER":
                # Trouver l'user ID
                users_resp = await client.get(f"{base_url}/api/s/default/rest/user")
                users = users_resp.json().get("data", [])
                user_id = next((u["_id"] for u in users if u.get("name") == username), None)
                if not user_id:
                    return False, f"Utilisateur {username} non trouvé"
                resp = await client.delete(f"{base_url}/api/s/default/rest/user/{user_id}")
            elif action_type == "KICK_SESSION" and mac:
                resp = await client.post(f"{base_url}/api/s/default/cmd/stamgr",
                    json={"cmd": "kick-sta", "mac": mac})
            else:
                return False, f"Action non supportée: {action_type}"
            return resp.status_code in (200, 201), "" if resp.status_code in (200, 201) else f"HTTP {resp.status_code}"
    except Exception as e:
        return False, str(e)


# ── Tenda ──

async def _tenda(router_ip, port, user, passwd, action_type, username, password, profile, mac):
    base_url = f"http://{router_ip}:{port or 80}"
    cookie = "admin:language=en; password=hotspotpay"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if action_type == "CREATE_USER":
                resp = await client.post(f"{base_url}/goform/HotspotUserAdd",
                    data={"username": username, "password": password, "profile": profile},
                    headers={"Cookie": cookie})
            elif action_type == "REMOVE_USER":
                resp = await client.post(f"{base_url}/goform/HotspotUserDel",
                    data={"username": username}, headers={"Cookie": cookie})
            elif action_type == "KICK_SESSION" and mac:
                resp = await client.post(f"{base_url}/goform/HotspotKick",
                    data={"mac": mac}, headers={"Cookie": cookie})
            else:
                return False, f"Action non supportée: {action_type}"
            return resp.status_code == 200, "" if resp.status_code == 200 else f"HTTP {resp.status_code}"
    except Exception as e:
        return False, str(e)
