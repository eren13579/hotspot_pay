"""
Service de generation de scripts routeur pre-configures.

Pour un hotspot donne, genere un pre-rempli avec :
  - hotspot_id
  - router_token
  - polling_url (URL complete authentifiee)
  - fastapi_host, fastapi_port

Le script est adapte a la marque du routeur :
  - MikroTik : script RouterOS .rsc (natif) ou bash agent
  - TP-Link, Huawei, Ubiquiti, Tenda : bash agent HTTP

L'utilisateur telecharge le script et l'installe sur son routeur.
Une fois en route, le script poll FastAPI et execute les actions
(CREATE_USER, REMOVE_USER, KICK_SESSION) automatiquement.
"""
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict

from app.config.settings import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"


def _get_fastapi_url() -> str:
    return settings.get_public_url()


def _load_template(filename: str) -> str:
    template_path = TEMPLATES_DIR / filename
    if template_path.exists():
        return template_path.read_text(encoding="utf-8")
    logger.warning("Template introuvable: %s", template_path)
    return ""


def _apply_placeholders(template: str, replacements: dict) -> str:
    """Remplace les placeholders dans un template via str.replace()."""
    result = template
    for key, value in replacements.items():
        result = result.replace(key, str(value))
    return result


def generate_router_script(
    hotspot_id: str,
    router_token: str,
    brand_slug: str = "mikrotik",
) -> Dict[str, str]:
    fastapi_url = _get_fastapi_url()
    polling_url = f"{fastapi_url}/api/v1/router/{hotspot_id}/pending-actions?token={router_token}"
    ack_base_url = f"{fastapi_url}/api/v1/router/{hotspot_id}/actions"
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    if brand_slug == "mikrotik":
        template = _load_template("mikrotik_script.rsc")
        ext = "rsc"
    elif (TEMPLATES_DIR / f"{brand_slug}_agent.sh").exists():
        template = _load_template(f"{brand_slug}_agent.sh")
        ext = "sh"
    else:
        template = _load_template("mikrotik_agent.sh")
        ext = "sh"

    from urllib.parse import urlparse
    parsed = urlparse(fastapi_url)
    fastapi_host = parsed.hostname or "localhost"
    fastapi_port = str(parsed.port) if parsed.port else str(settings.PORT)

    script = _apply_placeholders(template, {
        "{hotspot_id}": hotspot_id,
        "{router_token}": router_token,
        "{polling_url}": polling_url,
        "{ack_base_url}": ack_base_url,
        "{generated_at}": generated_at,
        "{fastapi_host}": fastapi_host,
        "{fastapi_port}": fastapi_port,
        "__HOTSPOT_ID__": hotspot_id,
        "__ROUTER_TOKEN__": router_token,
        "__POLLING_URL__": polling_url,
        "__ACK_BASE_URL__": ack_base_url,
        "__GENERATED_AT__": generated_at,
    })

    filename = f"hotspotpay-{brand_slug}-{hotspot_id[:8]}.{ext}"
    instructions = _generate_instructions(brand_slug, hotspot_id, router_token, polling_url)

    logger.info("Script genere pour hotspot=%s (brand=%s, %d chars)",
                hotspot_id, brand_slug, len(script))

    return {
        "script": script,
        "filename": filename,
        "content_type": "text/plain; charset=utf-8",
        "instructions": instructions,
        "brand": brand_slug,
        "hotspot_id": hotspot_id,
        "polling_url": polling_url,
        "generated_at": generated_at,
    }


def _generate_instructions(brand_slug: str, hotspot_id: str, token: str, polling_url: str) -> str:
    if brand_slug == "mikrotik":
        return f"""============================================================
  HOTSPOTPAY — INSTALLATION SCRIPT MIKROTIK
============================================================
  Hotspot ID ........... {hotspot_id}
  Token ................ {token}
  URL Polling .......... {polling_url}
============================================================
  INSTALLATION (2 methodes)
============================================================
  METHODE 1 — Script polling (recommandee)
  1. Winbox -> System -> Scripts -> [+]
  2. Name: hotspotpay-poll
  3. Coller le script dans Source
  4. System -> Scheduler -> [+] — Interval 30s, On-event:
     /system script run hotspotpay-poll
  5. Log -> Filter "[HotspotPay]" — voir les actions en temps reel
============================================================
  METHODE 2 — Import .rsc
  1. Winbox -> Files -> Upload le fichier .rsc
  2. Terminal : /import hotspotpay-mikrotik-xxx.rsc
============================================================"""
    return f"""============================================================
  HOTSPOTPAY — INSTALLATION ({brand_slug})
============================================================
  Marque .............. {brand_slug}
  Hotspot ID ........... {hotspot_id}
  Token ................ {token}
============================================================"""
