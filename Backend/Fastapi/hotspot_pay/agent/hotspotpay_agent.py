#!/usr/bin/env python3
"""
HotspotPay Agent — Routeur universel (multi-marque)

Poll FastAPI, exécute les actions sur le routeur, renvoie les ACK.

Usage :
    python hotspotpay_agent.py

L'agent récupère automatiquement la configuration depuis FastAPI :
  - IP du routeur
  - Credentials
  - Token

Il suffit de le lancer. L'utilisateur ne configure rien.
"""
import asyncio
import json
import logging
import os
import sys
import signal
from pathlib import Path

import httpx

from router_api import execute_on_router

# ── Configuration ──
FASTAPI_URL = os.getenv("FASTAPI_URL", "http://localhost:8443")
HOTSPOT_TOKEN = os.getenv("HOTSPOT_TOKEN", "")

# Long Polling : timeout court pour réactivité maximale
# Le routeur appelle toutes les 5s → réponse immédiate si action disponible
POLL_TIMEOUT = int(os.getenv("POLL_TIMEOUT", "10"))
# Intervalle minimum entre deux cycles (évite le busy-wait)
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5"))

LOG_FILE = Path(__file__).resolve().parent / "hotspotpay_agent.log"

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
logger = logging.getLogger("hotspotpay_agent")

# ── État global ──
running = True
router_config = {}


def log(msg: str):
    """Affiche et log un message."""
    print(f"[HotspotPay Agent] {msg}", flush=True)
    logger.info(msg)


async def fetch_router_config(hotspot_token: str) -> dict | None:
    """
    Récupère la configuration du routeur depuis FastAPI.

    Le token seul suffit — FastAPI renvoie les infos du hotspot
    incluant l'IP, les credentials, et la marque du routeur.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{FASTAPI_URL}/api/v1/agent/router-config",
                headers={"X-Router-Token": hotspot_token},
            )
            if resp.status_code == 200:
                return resp.json()
            logger.error("fetch_router_config: HTTP %d — %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.error("fetch_router_config: %s", e)
    return None


async def poll_actions(hotspot_token: str, hotspot_id: str) -> list[dict]:
    """Poll FastAPI pour récupérer les actions en attente (Long Polling).

    Timeout court (10s) : l'agent boucle rapidement pour minimiser
    le délai entre création d'action FastAPI et exécution sur le routeur.
    """
    try:
        async with httpx.AsyncClient(timeout=POLL_TIMEOUT + 5.0) as client:
            resp = await client.get(
                f"{FASTAPI_URL}/api/v1/router/{hotspot_id}/pending-actions",
                params={"token": hotspot_token},
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("actions", [])
            elif resp.status_code == 401:
                log("ERREUR: Token invalide — arrêt")
                global running
                running = False
            logger.error("poll_actions: HTTP %d", resp.status_code)
    except httpx.TimeoutException:
        pass  # Normal en long polling — aucune action disponible
    except Exception as e:
        logger.error("poll_actions: %s", e)
    return []


async def send_ack(hotspot_token: str, hotspot_id: str, action_id: str, success: bool, error: str = ""):
    """Envoie un ACK à FastAPI après exécution d'une action."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{FASTAPI_URL}/api/v1/router/{hotspot_id}/actions/{action_id}/done",
                json={"success": success, "error": error},
                params={"token": hotspot_token},
            )
            if resp.status_code != 200:
                logger.warning("send_ack: HTTP %d pour action %s", resp.status_code, action_id)
    except Exception as e:
        logger.error("send_ack: %s", e)


async def process_actions_batch(hotspot_token: str, hotspot_id: str, actions: list[dict]):
    """Traite un batch d'actions en parallèle quand possible.

   CREATE_USER sont séquentiels (pour éviter les conflits MikroTik).
    Les ACK sont tous envoyés en parallèle après exécution.
    """
    results = []
    for action in actions:
        action_id = action.get("actionId", "")
        action_type = action.get("type", "")
        username = action.get("username", "")
        password = action.get("password", "")
        profile = action.get("profile", "default")
        mac_address = action.get("macAddress", "")

        log(f"▶ Action #{action_id}: {action_type} user={username} mac={mac_address}")

        cfg = router_config
        success, error = await execute_on_router(
            brand=cfg.get("router_brand", "mikrotik"),
            router_ip=cfg.get("router_ip", ""),
            router_port=cfg.get("router_port", 8728),
            router_user=cfg.get("router_user", "admin"),
            router_pass=cfg.get("router_pass", ""),
            action_type=action_type,
            username=username,
            password=password,
            profile=profile,
            mac_address=mac_address,
        )

        if success:
            log(f"✅ Action #{action_id}: {action_type} {username} — OK")
        else:
            log(f"❌ Action #{action_id}: {action_type} {username} — ERREUR: {error}")

        results.append((hotspot_token, hotspot_id, action_id, success, error))

    # Envoyer tous les ACK en parallèle (non bloquant)
    await asyncio.gather(
        *[send_ack(*r) for r in results],
        return_exceptions=True,
    )


async def process_action(hotspot_token: str, hotspot_id: str, action: dict):
    """Traite une action unique (compatibilité)."""
    await process_actions_batch(hotspot_token, hotspot_id, [action])


async def main():
    global running, router_config

    log("=" * 50)
    log("  HotspotPay Agent — Démarrage")
    log("=" * 50)

    # ── Vérifier le token ──
    if not HOTSPOT_TOKEN:
        log("ERREUR: variable HOTSPOT_TOKEN non définie")
        log("Usage: set HOTSPOT_TOKEN=votre_token && python hotspotpay_agent.py")
        log("Ou définir FASTAPI_URL si le service n'est pas sur localhost:8443")
        sys.exit(1)

    # ── Récupérer la config du routeur ──
    log("Récupération de la configuration du routeur...")
    config = await fetch_router_config(HOTSPOT_TOKEN)
    if not config:
        log("ERREUR: Impossible de récupérer la config du routeur")
        log("Vérifiez le token et que FastAPI est accessible")
        sys.exit(1)

    router_config = config
    log(f"Routeur: {config.get('router_brand', '?')} @ {config.get('router_ip', '?')}")
    log(f"Hotspot: {config.get('hotspot_id', '?')} ({config.get('hotspot_name', '?')})")

    # ── Boucle principale ──
    log(f"Démarrage du polling (intervalle: {POLL_INTERVAL}s)")
    log("Appuyez sur Ctrl+C pour arrêter")
    log("")

    consecutive_errors = 0
    max_errors = 10

    hotspot_id = config.get("hotspot_id", "")

    while running:
        try:
            actions = await poll_actions(HOTSPOT_TOKEN, hotspot_id)
            consecutive_errors = 0

            if actions:
                log(f"📋 {len(actions)} action(s) à exécuter")
                if not running:
                    continue
                # Traiter toutes les actions ensemble (parallèle pour les ACK)
                await process_actions_batch(HOTSPOT_TOKEN, hotspot_id, actions)
                # Boucler IMMÉDIATEMENT pour traiter les actions suivantes
                # Ne pas attendre — si il y a encore des actions, on les traite tout de suite
                continue
            else:
                logger.debug("Aucune action — polling dans %ds", POLL_INTERVAL)

        except KeyboardInterrupt:
            break
        except Exception as e:
            consecutive_errors += 1
            logger.error("Erreur boucle: (%d/%d) %s", consecutive_errors, max_errors, e)
            if consecutive_errors >= max_errors:
                log("Trop d'erreurs consécutives — arrêt")
                break
            await asyncio.sleep(5)
            continue

        if running:
            await asyncio.sleep(POLL_INTERVAL)

    log("Agent arrêté.")


def handle_signal(sig, frame):
    global running
    log("Signal d'arrêt reçu...")
    running = False


if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    asyncio.run(main())
