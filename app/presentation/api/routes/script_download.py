"""
Endpoint de telechargement du script routeur pre-configure.

GET /api/v1/router/{hotspot_id}/download-script?token=XXX&brand=mikrotik&format=bash

Retourne le script en texte brut avec Content-Disposition pour forcer le telechargement.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.config.settings import get_settings
from app.infrastructure.persistence.schemas import HotspotSchema
from app.application.services.script_generator_service import generate_router_script

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/hotspots", tags=["Script Download"])

settings = get_settings()


@router.get("/{hotspot_id}/download-script")
async def download_router_script(
    hotspot_id: str,
    token: str = Query(..., description="Token du routeur"),
    brand: str = Query("mikrotik", description="Marque du routeur"),
    format: str = Query("bash", description="Format: bash ou rsc"),
    db: AsyncSession = Depends(get_db),
):
    """
    Genere et retourne le script routeur pre-configure.

    Le script contient :
    - hotspot_id      : identifiant du hotspot
    - router_token    : token d'authentification    - polling_url      : URL du endpoint Long Polling    - ack_base_url     : URL pour envoyer les ACK

    L'utilisateur telecharge le script et l'installe sur son routeur.
    """
    # Verifier que le hotspot existe et que le token est valide
    query = select(HotspotSchema).where(HotspotSchema.hotspot_id == hotspot_id)
    result = await db.execute(query)
    hotspot = result.scalar_one_or_none()

    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot non trouve")

    if not hotspot.router_token:
        raise HTTPException(status_code=403, detail="Aucun token genere pour ce hotspot")

    # Comparaison timing-safe
    import secrets
    if not secrets.compare_digest(hotspot.router_token, token):
        raise HTTPException(status_code=403, detail="Token invalide")

    # Generer le script
    script_data = generate_router_script(
        hotspot_id=hotspot_id,
        router_token=token,
        brand_slug=brand,
    )

    # Si format=rsc, forcer l'extension .rsc pour MikroTik
    filename = script_data["filename"]
    if format == "rsc" and brand == "mikrotik":
        filename = f"hotspotpay-mikrotik-{hotspot_id[:8]}.rsc"

    # Construire le contenu final avec les variables Shell
    script_content = script_data["script"]
    if format == "bash" or brand != "mikrotik":
        # Remplacer les placeholders bash
        script_content = script_content.replace("__HOTSPOT_ID__", hotspot_id)
        script_content = script_content.replace("__ROUTER_TOKEN__", token)
        script_content = script_content.replace("__POLLING_URL__", script_data["polling_url"])
        script_content = script_content.replace("__ACK_BASE_URL__", script_data["polling_url"].rsplit("/pending-actions", 1)[0] + "/actions")
        script_content = script_content.replace("__GENERATED_AT__", script_data["generated_at"])

    logger.info("Script telecharge: hotspot=%s brand=%s format=%s", hotspot_id, brand, format)

    return PlainTextResponse(
        content=script_content,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Hotspot-Id": hotspot_id,
            "X-Script-Brand": brand,
        },
    )


@router.get("/{hotspot_id}/script-info")
async def get_script_info(
    hotspot_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Retourne les informations du script sans le telecharger.
    Utile pour afficher les instructions dans l'interface.
    """
    query = select(HotspotSchema).where(HotspotSchema.hotspot_id == hotspot_id)
    result = await db.execute(query)
    hotspot = result.scalar_one_or_none()

    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot non trouve")

    import secrets
    if not secrets.compare_digest(hotspot.router_token, token or ""):
        raise HTTPException(status_code=403, detail="Token invalide")

    base_url = settings.get_public_url()

    return {
        "hotspot_id": hotspot_id,
        "has_token": bool(hotspot.router_token),
        "polling_url": f"{base_url}/api/v1/router/{hotspot_id}/pending-actions",
        "download_url": f"{base_url}/api/v1/router/{hotspot_id}/download-script?token={hotspot.router_token}&brand=mikrotik&format=bash",
        "instructions": {
            "mikrotik": "Telechargez le script bash, personnalisez les variables ROUTEUR, puis executez-le sur un PC connecte au routeur.",
            "download_steps": [
                "1. Cliquez sur le lien de telechargement",
                "2. Ouvrez le script dans un editeur",
                "3. Configurez ROUTEUR_IP, ROUTEUR_USER, ROUTEUR_PASS",                "4. Rendez executable: chmod +x hotspotpay-agent.sh",
                "5. Executez: ./hotspotpay-agent.sh &",
            ],
        },
    }
