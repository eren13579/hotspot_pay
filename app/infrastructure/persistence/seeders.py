"""
Seeders — Données initiales pour router_brands et router_models.

Execute au demarrage si les tables sont vides.
"""
import logging
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.schemas import RouterBrandSchema, RouterModelSchema

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────
# DONNEES INITIALES
# ─────────────────────────────────────────────────────────

MIKROTIK_MODELS = [
    {"name": "hAP ac²", "slug": "hap-ac2", "connection_type": "api", "default_port": 8728},
    {"name": "hAP lite", "slug": "hap-lite", "connection_type": "api", "default_port": 8728},
    {"name": "RB2011", "slug": "rb2011", "connection_type": "api", "default_port": 8728},
    {"name": "RB3011", "slug": "rb3011", "connection_type": "api", "default_port": 8728},
    {"name": "CCR1009", "slug": "ccr1009", "connection_type": "api", "default_port": 8728},
    {"name": "CCR1036", "slug": "ccr1036", "connection_type": "api", "default_port": 8728},
    {"name": "mAP lite", "slug": "map-lite", "connection_type": "api", "default_port": 8728},
    {"name": "SXT lite5", "slug": "sxt-lite5", "connection_type": "api", "default_port": 8728},
]

TPLINK_MODELS = [
    {"name": "TL-WR841N", "slug": "tl-wr841n", "connection_type": "http", "default_port": 80},
    {"name": "TL-WR940N", "slug": "tl-wr940n", "connection_type": "http", "default_port": 80},
    {"name": "TL-WR1043ND", "slug": "tl-wr1043nd", "connection_type": "http", "default_port": 80},
    {"name": "Archer C50", "slug": "archer-c50", "connection_type": "http", "default_port": 80},
    {"name": "Archer C6", "slug": "archer-c6", "connection_type": "http", "default_port": 80},
]

HUAWEI_MODELS = [
    {"name": "B311-221", "slug": "b311-221", "connection_type": "http", "default_port": 80},
    {"name": "B525s-23a", "slug": "b525s-23a", "connection_type": "http", "default_port": 80},
    {"name": "B535-232", "slug": "b535-232", "connection_type": "http", "default_port": 80},
    {"name": "E5577Cs-321", "slug": "e5577cs-321", "connection_type": "http", "default_port": 80},
    {"name": "E8372h-153", "slug": "e8372h-153", "connection_type": "http", "default_port": 80},
    {"name": "B818-263", "slug": "b818-263", "connection_type": "http", "default_port": 80},
]

UBIQUITI_MODELS = [
    {"name": "UniFi AP AC Lite", "slug": "unifi-ap-ac-lite", "connection_type": "https", "default_port": 8443},
    {"name": "UniFi AP AC Pro", "slug": "unifi-ap-ac-pro", "connection_type": "https", "default_port": 8443},
    {"name": "UniFi Dream Machine", "slug": "udm", "connection_type": "https", "default_port": 443},
    {"name": "UniFi Dream Machine Pro", "slug": "udm-pro", "connection_type": "https", "default_port": 443},
    {"name": "UniFi nanoHD", "slug": "unifi-nanohd", "connection_type": "https", "default_port": 8443},
]

TENDA_MODELS = [
    {"name": "N301", "slug": "n301", "connection_type": "http", "default_port": 80},
    {"name": "F3", "slug": "f3", "connection_type": "http", "default_port": 80},
    {"name": "AC8", "slug": "ac8", "connection_type": "http", "default_port": 80},
    {"name": "AC10", "slug": "ac10", "connection_type": "http", "default_port": 80},
    {"name": "MW6", "slug": "mw6", "connection_type": "http", "default_port": 80},
]

BRANDS_DATA = [
    {
        "name": "MikroTik",
        "slug": "mikrotik",
        "description": "Routeurs MikroTik RouterOS — API native (port 8728). Très populaire pour les hotspots.",
        "logo_url": None,
        "models": MIKROTIK_MODELS,
    },
    {
        "name": "TP-Link",
        "slug": "tp-link",
        "description": "Routeurs grand public et hotspot TP-Link — Interface HTTP.",
        "logo_url": None,
        "models": TPLINK_MODELS,
    },
    {
        "name": "Huawei",
        "slug": "huawei",
        "description": "Routeurs Huawei 4G/5G et hotspot mobiles — API HTTP REST.",
        "logo_url": None,
        "models": HUAWEI_MODELS,
    },
    {
        "name": "Ubiquiti",
        "slug": "ubiquiti",
        "description": "Ubiquiti UniFi — Contrôleur centralisé, API HTTPS.",
        "logo_url": None,
        "models": UBIQUITI_MODELS,
    },
    {
        "name": "Tenda",
        "slug": "tenda",
        "description": "Routeurs Tenda grand public — Interface HTTP avec cookie auth.",
        "logo_url": None,
        "models": TENDA_MODELS,
    },
]


async def seed_router_brands_and_models(session: AsyncSession) -> None:
    """Insère les brands et modèles si les tables sont vides."""
    # Vérifier si des brands existent déjà
    result = await session.execute(select(RouterBrandSchema).limit(1))
    if result.scalar_one_or_none() is not None:
        logger.info("Seeders: router_brands déjà peuplé — skip")
        return

    for brand_data in BRANDS_DATA:
        models_data = brand_data["models"]
        brand_id = str(uuid.uuid4())
        brand = RouterBrandSchema(id=brand_id, name=brand_data["name"], slug=brand_data["slug"], description=brand_data["description"], logo_url=brand_data["logo_url"])
        session.add(brand)
        await session.flush()

        for model_data in models_data:
            model = RouterModelSchema(id=str(uuid.uuid4()), brand_id=brand.id, **model_data)
            session.add(model)

        logger.info("Seeder: marque %s (%d modèles)", brand.name, len(models_data))

    await session.flush()
    total_models = sum(len(b["models"]) for b in BRANDS_DATA)
    logger.info("Seeders terminés: %d marques, %d modèles", len(BRANDS_DATA), total_models)


# ── Subscription plans ──────────────────────────────────────

SUBSCRIPTION_PLANS = [
    {
        "plan_id": "standard",
        "name": "Standard",
        "description": "Pour démarrer avec un hotspot MikroTik",
        "price": 0,
        "currency": "XAF",
        "duration_months": 0,
        "advantages": {
            "max_hotspots": 1,
            "max_hotspot_plans": 7,
            "max_withdrawal_xaf": 50000,
            "plan_fee_xaf": 0,
            "max_api_keys": 1,
            "allowed_brands": ["mikrotik"],
            "dashboard_level": "basic",
            "support_level": "email",
            "data_retention_months": 1,
        },
    },
    {
        "plan_id": "pro",
        "name": "Pro",
        "description": "Pour les professionnels — jusqu'à 4 hotspots",
        "price": 1500,
        "currency": "XAF",
        "duration_months": 1,
        "advantages": {
            "max_hotspots": 4,
            "max_hotspot_plans": 20,
            "max_withdrawal_xaf": 500000,
            "plan_fee_xaf": 100,
            "max_api_keys": 3,
            "allowed_brands": ["mikrotik", "tp-link", "ubiquiti"],
            "dashboard_level": "advanced",
            "support_level": "priority",
            "data_retention_months": 6,
        },
    },
    {
        "plan_id": "premium",
        "name": "Premium",
        "description": "Solution complète — jusqu'à 10 hotspots toutes marques",
        "price": 5000,
        "currency": "XAF",
        "duration_months": 1,
        "advantages": {
            "max_hotspots": 10,
            "max_hotspot_plans": 999,
            "max_withdrawal_xaf": 5000000,
            "plan_fee_xaf": 0,
            "max_api_keys": 999,
            "allowed_brands": ["mikrotik", "tp-link", "ubiquiti", "cisco", "huawei"],
            "dashboard_level": "full",
            "support_level": "24-7",
            "data_retention_months": 24,
        },
    },
]


async def seed_subscription_plans(session: AsyncSession) -> None:
    from app.infrastructure.persistence.schemas import SubscriptionPlanSchema

    # Vérifier si des plans existent déjà
    result = await session.execute(select(SubscriptionPlanSchema).limit(1))
    if result.scalar_one_or_none() is not None:
        logger.info("Seeders: subscription_plans déjà peuplé — skip")
        return

    import uuid
    for data in SUBSCRIPTION_PLANS:
        plan = SubscriptionPlanSchema(
            id=str(uuid.uuid4()),
            plan_id=data["plan_id"],
            name=data["name"],
            description=data["description"],
            price=data["price"],
            currency=data["currency"],
            duration_months=data["duration_months"],
            advantages=data["advantages"],
            is_active=True,
        )
        session.add(plan)
        logger.info("Seeder: plan %s (%d XAF)", data["plan_id"], data["price"])

    await session.flush()
    logger.info("Seeders: %d plans d'abonnement créés", len(SUBSCRIPTION_PLANS))
