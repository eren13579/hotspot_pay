import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.infrastructure.persistence.schemas import RouterBrandSchema, RouterModelSchema

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/router-brands", tags=["Router Brands & Models"])


@router.get("")
async def list_brands(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Liste les marques de routeurs."""
    query = select(RouterBrandSchema).order_by(RouterBrandSchema.name)
    if active_only:
        query = query.where(RouterBrandSchema.is_active == True)

    result = await db.execute(query)
    brands = result.scalars().all()

    return {
        "count": len(brands),
        "brands": [
            {
                "id": b.id,
                "name": b.name,
                "slug": b.slug,
                "description": b.description,
                "logo_url": b.logo_url,
                "is_active": b.is_active,
            }
            for b in brands
        ],
    }


@router.get("/{brand_slug}")
async def get_brand(
    brand_slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Récupère une marque par son slug."""
    query = select(RouterBrandSchema).where(RouterBrandSchema.slug == brand_slug)
    result = await db.execute(query)
    brand = result.scalar_one_or_none()

    if not brand:
        raise HTTPException(status_code=404, detail="Marque non trouvée")

    return {
        "id": brand.id,
        "name": brand.name,
        "slug": brand.slug,
        "description": brand.description,
        "logo_url": brand.logo_url,
        "is_active": brand.is_active,
    }


@router.get("/{brand_slug}/models")
async def list_models_by_brand(
    brand_slug: str,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Liste les modèles d'une marque."""
    brand_query = select(RouterBrandSchema).where(RouterBrandSchema.slug == brand_slug)
    brand_result = await db.execute(brand_query)
    brand = brand_result.scalar_one_or_none()

    if not brand:
        raise HTTPException(status_code=404, detail="Marque non trouvée")

    query = select(RouterModelSchema).where(
        RouterModelSchema.brand_id == brand.id
    ).order_by(RouterModelSchema.name)

    if active_only:
        query = query.where(RouterModelSchema.is_active == True)

    result = await db.execute(query)
    models = result.scalars().all()

    return {
        "brand": brand.name,
        "brand_slug": brand.slug,
        "count": len(models),
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "slug": m.slug,
                "connection_type": m.connection_type,
                "default_port": m.default_port,
                "config_schema": m.config_schema,
                "is_active": m.is_active,
            }
            for m in models
        ],
    }
