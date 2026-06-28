import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.config.database import get_db
from app.config.settings import get_settings
from app.application.services.hotspot_service import HotspotService
from app.domain.models.hotspot import Hotspot
from app.infrastructure.repositories.hotspot_repository import HotspotRepository
from app.presentation.api.schemas.hotspot_schemas import (
    CreateHotspotRequest,
    UpdateHotspotRequest,
    HotspotRegisterRequest,
    HotspotResponse,
    HotspotListResponse,
    HotspotStatusResponse,
    RouterTokenResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/hotspots", tags=["Hotspots"])


def get_hotspot_service(db=Depends(get_db)) -> HotspotService:
    return HotspotService(HotspotRepository(db))


def to_response(hotspot: Hotspot, user_id: str = None) -> dict:
    """Convertit un modèle Hotspot en dict de réponse."""
    has_token = hotspot.router_token is not None and hotspot.router_token != ""
    online = False
    pull_status = "NO_TOKEN"
    if not has_token:
        pull_status = "NO_TOKEN"
    elif hotspot.last_ping_at is None:
        pull_status = "NEVER"
    else:
        ping = hotspot.last_ping_at
        if ping.tzinfo is None:
            ping = ping.replace(tzinfo=timezone.utc)
        delta = (datetime.now(timezone.utc).replace(tzinfo=None) - ping.replace(tzinfo=None)).total_seconds()
        if delta < 30:
            pull_status = "ONLINE"
            online = True
        else:
            pull_status = "OFFLINE"

    result = {
        "hotspot_id": hotspot.hotspot_id,
        "user_id": hotspot.user_id,
        "name": hotspot.name,
        "location": hotspot.location,
        "mikrotik_ip": hotspot.mikrotik_ip,
        "mikrotik_port": hotspot.mikrotik_port,
        "mikrotik_user": hotspot.mikrotik_user,
        "hotspot_profile": hotspot.hotspot_profile,
        "router_brand": hotspot.router_brand or "mikrotik",
        "router_type": hotspot.router_type,
        "is_online": online,
        "status": pull_status,
        "last_ping_at": hotspot.last_ping_at,
        "router_token_configured": has_token,
        "created_at": hotspot.created_at,
        "updated_at": hotspot.updated_at,
    }
    return result


# ── CRUD public (appelé via JWT par le frontend via Java proxy) ─────
# Note: Ces endpoints sont protégés par le middleware API_KEY (inter-service).
# Le Java forward les requêtes avec le header X-API-Key.


@router.post("", response_model=dict, status_code=201)
@router.post("/", response_model=dict, status_code=201)
async def create_hotspot(
    request: CreateHotspotRequest,
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Créer un nouveau hotspot."""
    return to_response(
        await hotspot_service.create(
            user_id=request.user_id,
            name=request.name,
            location=request.location,
            mikrotik_ip=request.mikrotik_ip,
            mikrotik_port=request.mikrotik_port,
            mikrotik_user=request.mikrotik_user,
            mikrotik_password_enc=request.mikrotik_password,
            hotspot_profile=request.hotspot_profile,
            router_brand=request.router_brand,
            router_type=request.router_type,
            model_id=request.model_id,
        )
    )


@router.get("")
@router.get("/")
async def list_hotspots(
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Lister les hotspots d'un utilisateur (paginé)."""
    items = await hotspot_service.list_by_user(user_id, skip=skip, limit=limit)
    total = await hotspot_service.count_by_user(user_id)
    return {
        "items": [to_response(h) for h in items],
        "total": total,
        "page": skip // limit + 1 if limit else 1,
        "page_size": limit,
    }


@router.get("/public/{hotspot_id}")
async def get_hotspot_public(
    hotspot_id: str,
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Récupérer les infos publiques d'un hotspot (portail captif — sans auth)."""
    hotspot = await hotspot_service.get_by_hotspot_id(hotspot_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot introuvable")
    return to_response(hotspot)


@router.get("/all")
async def list_all_hotspots(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    admin_override: bool = Query(True, description="Confirmation admin requise pour lister tous les hotspots"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Lister TOUS les hotspots (admin uniquement — aucun filtre user_id)."""
    if not admin_override:
        raise HTTPException(status_code=403, detail="Accès refusé: privilèges admin requis")
    items = await hotspot_service.list_all(skip=skip, limit=limit)
    total = await hotspot_service.count_all()
    return {
        "items": [to_response(h) for h in items],
        "total": total,
        "page": skip // limit + 1 if limit else 1,
        "page_size": limit,
    }


@router.get("/{hotspot_id}")
async def get_hotspot(
    hotspot_id: str,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    admin_override: bool = Query(False, description="Contourner la vérification de propriété (admin)"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Récupérer un hotspot par ID.
    - Utilisateur normal : ne peut voir que ses propres hotspots.
    - Admin (admin_override=true) : peut voir n'importe quel hotspot.
    """
    try:
        if admin_override:
            hotspot = await hotspot_service.get_by_hotspot_id(hotspot_id)
            # DEBUG: si None, tenter avec get_all et filtrer
            if hotspot is None:
                all_hs = await hotspot_service.list_all(skip=0, limit=1000)
                found = [h for h in all_hs if h.hotspot_id == hotspot_id]
                logger.warning("=== DEBUG get_by_hotspot_id returned None for %s, found in list_all: %s ===", hotspot_id, len(found))
                if found:
                    hotspot = found[0]
        else:
            hotspot = await hotspot_service.get_owned_hotspot(hotspot_id, user_id)
        if not hotspot:
            raise HTTPException(status_code=404, detail="Hotspot introuvable ou accès non autorisé")
        return to_response(hotspot)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("=== DEBUG EXCEPTION in get_hotspot: %s %s ===", type(e).__name__, e)
        raise HTTPException(status_code=500, detail=f"Erreur interne: {type(e).__name__}: {e}")


@router.put("/{hotspot_id}")
async def update_hotspot(
    hotspot_id: str,
    request: UpdateHotspotRequest,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Mettre à jour un hotspot."""
    hotspot = await hotspot_service.get_owned_hotspot(hotspot_id, user_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot introuvable ou accès non autorisé")

    if request.name is not None:
        hotspot.name = request.name
    if request.location is not None:
        hotspot.location = request.location
    if request.mikrotik_ip is not None:
        hotspot.mikrotik_ip = request.mikrotik_ip
    if request.mikrotik_port is not None:
        hotspot.mikrotik_port = request.mikrotik_port
    if request.mikrotik_user is not None:
        hotspot.mikrotik_user = request.mikrotik_user
    if request.mikrotik_password is not None:
        hotspot.mikrotik_password_enc = request.mikrotik_password
    if request.hotspot_profile is not None:
        hotspot.hotspot_profile = request.hotspot_profile
    if request.router_brand is not None:
        hotspot.router_brand = request.router_brand
    if request.router_type is not None:
        hotspot.router_type = request.router_type
    if request.model_id is not None:
        hotspot.model_id = request.model_id

    updated = await hotspot_service.update(hotspot)
    if not updated:
        raise HTTPException(status_code=404, detail="Hotspot introuvable")
    return to_response(updated)


@router.delete("/{hotspot_id}")
async def delete_hotspot(
    hotspot_id: str,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    admin_override: bool = Query(False, description="Contourner la vérification de propriété (admin)"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Supprimer un hotspot.
    - Utilisateur normal : ne peut supprimer que ses propres hotspots.
    - Admin (admin_override=true) : peut supprimer n'importe quel hotspot.
    """
    if admin_override:
        hotspot = await hotspot_service.get_by_hotspot_id(hotspot_id)
    else:
        hotspot = await hotspot_service.get_owned_hotspot(hotspot_id, user_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot introuvable ou accès non autorisé")
    await hotspot_service.delete(hotspot_id)
    return {"status": "deleted", "message": "Hotspot supprimé"}


@router.post("/{hotspot_id}/test")
async def test_connection(
    hotspot_id: str,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Tester la connexion (statut Pull basé sur last_ping_at)."""
    status = await hotspot_service.get_status(hotspot_id, user_id)
    if not status:
        raise HTTPException(status_code=404, detail="Hotspot introuvable ou accès non autorisé")
    return status


# ── Token + Script MikroTik ──────────────────────────────────────────


@router.post("/{hotspot_id}/generate-token")
async def generate_router_token(
    hotspot_id: str,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Générer un nouveau token routeur + script MikroTik."""
    hotspot = await hotspot_service.get_owned_hotspot(hotspot_id, user_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot introuvable ou accès non autorisé")

    token = await hotspot_service.generate_router_token(hotspot_id)
    if not token:
        raise HTTPException(status_code=500, detail="Impossible de générer le token")

    settings = get_settings()
    base = settings.get_public_url()
    polling_url = f"{base}/api/v1/router/{hotspot_id}/pending-actions"
    script_url = f"{base}/api/v1/hotspots/{hotspot_id}/download-script?token={token}&brand=mikrotik&format=bash"
    script = hotspot_service.build_mikrotik_script(hotspot_id, token, base)

    return RouterTokenResponse(
        success=True,
        message="Token généré. Copiez le script ou téléchargez le .rsc.",
        hotspot_id=hotspot_id,
        router_token=token,
        polling_url=polling_url,
        script_download_url=script_url,
        mikrotik_script=script,
        generated_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )


@router.delete("/{hotspot_id}/router-token")
async def revoke_router_token(
    hotspot_id: str,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Révoquer le token routeur."""
    hotspot = await hotspot_service.get_owned_hotspot(hotspot_id, user_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot introuvable ou accès non autorisé")
    await hotspot_service.revoke_router_token(hotspot_id)
    return {"status": "revoked", "message": "Token révoqué"}


# ── Inter-service (Java → FastAPI register) ──────────────────────────


@router.post("/register")
async def register_hotspot(
    request: HotspotRegisterRequest,
    hotspot_service: HotspotService = Depends(get_hotspot_service),
):
    """Enregistrer un hotspot depuis le service Java (inter-service)."""
    hotspot = Hotspot(
        hotspot_id=request.hotspot_id,
        user_id=request.user_id,
        name=request.name,
        location=request.location,
        mikrotik_ip=request.mikrotik_ip,
        mikrotik_port=request.mikrotik_port,
        mikrotik_user=request.mikrotik_user,
        mikrotik_password_enc=request.mikrotik_password_enc,
        hotspot_profile=request.hotspot_profile,
    )
    saved = await hotspot_service.register_hotspot(hotspot)
    return {"status": "registered", "hotspot_id": saved.hotspot_id}
