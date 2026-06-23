"""
Seed initial des marques et modèles de routeurs dans la BDD FastAPI.
Usage: python seed_router_data.py
"""
import asyncio
import asyncpg
from datetime import datetime, timezone

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5432,
    "user": "postgres",
    "password": "Teda@2003",
    "database": "hostpot_fastapi",  # la BDD utilisée par FastAPI
}

BRANDS = [
    ("MikroTik", "mikrotik", "Routeurs professionnels RouterOS — standard WISP"),
    ("TP-Link", "tp-link", "Routeurs abordables, largement utilisés en Afrique"),
    ("Ubiquiti", "ubiquiti", "Equipements WISP professionnels — UniFi, AirMax"),
    ("Huawei", "huawei", "Routeurs 4G/5G et hotspots mobiles"),
    ("Tenda", "tenda", "Routeurs grand public, petits cybercafés"),
    ("ZTE", "zte", "Routeurs 4G/5G, souvent fournis par les opérateurs"),
    ("Cisco", "cisco", "Equipements entreprises haut de gamme"),
    ("D-Link", "d-link", "Routeurs pour PME et usage domestique"),
]

MODELS = {
    "mikrotik": [
        ("hAP ac²", "hap-ac2", "api", 8728),
        ("hAP ax²", "hap-ax2", "api", 8728),
        ("hAP Lite", "hap-lite", "api", 8728),
        ("RB951Ui", "rb951", "api", 8728),
        ("RB2011", "rb2011", "api", 8728),
        ("CCR1009", "ccr1009", "api", 8728),
        ("SXT LTE", "sxt-lte", "api", 8728),
        ("mAP Lite", "map-lite", "api", 8728),
        ("RB4011", "rb4011", "api", 8728),
        ("Chateau 5G", "chateau-5g", "api", 8728),
    ],
    "tp-link": [
        ("EAP225", "eap225", "http", 80),
        ("EAP245", "eap245", "http", 80),
        ("EAP610", "eap610", "http", 80),
        ("CPE210", "cpe210", "http", 80),
        ("CPE510", "cpe510", "http", 80),
        ("CPE710", "cpe710", "http", 80),
        ("Archer C6", "archer-c6", "http", 80),
        ("Archer AX50", "archer-ax50", "http", 80),
        ("TL-WA850RE", "tl-wa850re", "http", 80),
        ("Deco M5", "deco-m5", "http", 80),
    ],
    "ubiquiti": [
        ("UniFi AP AC Lite", "uap-ac-lite", "http", 8443),
        ("UniFi AP AC Pro", "uap-ac-pro", "http", 8443),
        ("UniFi 6 Lite", "u6-lite", "http", 8443),
        ("UniFi 6 Pro", "u6-pro", "http", 8443),
        ("NanoStation M5", "nanostation-m5", "http", 80),
        ("NanoStation Loco M5", "nanostation-loco", "http", 80),
        ("AirMax AC M5", "airmax-ac-m5", "http", 80),
        ("LiteBeam AC", "litebeam-ac", "http", 80),
        ("UniFi Dream Machine", "udm", "http", 443),
        ("EdgeRouter X", "edgerouter-x", "ssh", 22),
    ],
    "huawei": [
        ("B311", "b311", "http", 80),
        ("B525", "b525", "http", 80),
        ("B535", "b535", "http", 80),
        ("B618", "b618", "http", 80),
        ("B818", "b818", "http", 80),
        ("E5577", "e5577", "http", 80),
        ("E5785", "e5785", "http", 80),
        ("E8372", "e8372", "http", 80),
    ],
    "tenda": [
        ("N301", "n301", "http", 80),
        ("F3", "f3", "http", 80),
        ("AC8", "ac8", "http", 80),
        ("AC10", "ac10", "http", 80),
        ("AC1200", "ac1200", "http", 80),
        ("MW6", "mw6", "http", 80),
        ("O3", "o3", "http", 80),
    ],
    "zte": [
        ("MF283", "mf283", "http", 80),
        ("MF286", "mf286", "http", 80),
        ("MF287", "mf287", "http", 80),
        ("MF289", "mf289", "http", 80),
        ("MC801A", "mc801a", "http", 80),
    ],
    "cisco": [
        ("Cisco 800 Series", "c800", "ssh", 22),
        ("Cisco ISR 4000", "isr4000", "ssh", 22),
        ("Cisco Meraki MR36", "meraki-mr36", "api", 443),
        ("Cisco Meraki MR84", "meraki-mr84", "api", 443),
    ],
    "d-link": [
        ("DIR-615", "dir-615", "http", 80),
        ("DIR-825", "dir-825", "http", 80),
        ("DIR-842", "dir-842", "http", 80),
        ("DIR-882", "dir-882", "http", 80),
        ("DAP-1650", "dap-1650", "http", 80),
        ("COVR-1200", "covr-1200", "http", 80),
    ],
}


def generate_uuid() -> str:
    import uuid
    return str(uuid.uuid4())


async def seed():
    conn = await asyncpg.connect(**DB_CONFIG)
    try:
        now = datetime.now(timezone.utc)

        # Créer les marques et récupérer leurs IDs
        brand_ids = {}
        for name, slug, desc in BRANDS:
            existing = await conn.fetchrow(
                "SELECT id FROM router_brands WHERE slug = $1", slug
            )
            if existing:
                brand_ids[slug] = str(existing["id"])
                print(f"  Marque existe deja : {name}")
            else:
                brand_id = generate_uuid()
                await conn.execute(
                    """INSERT INTO router_brands (id, name, slug, description, is_active, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                    brand_id, name, slug, desc, True, now, now
                )
                brand_ids[slug] = brand_id
                print(f"  Marque creee : {name}")

        # Créer les modèles
        total = 0
        for brand_slug, models in MODELS.items():
            brand_id = brand_ids.get(brand_slug)
            if not brand_id:
                continue
            for name, slug, conn_type, port in models:
                exists = await conn.fetchrow(
                    "SELECT id FROM router_models WHERE brand_id = $1 AND slug = $2",
                    brand_id, slug
                )
                if exists:
                    continue
                model_id = generate_uuid()
                await conn.execute(
                    """INSERT INTO router_models (id, brand_id, name, slug, connection_type, default_port, is_active, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
                    model_id, brand_id, name, slug, conn_type, port, True, now, now
                )
                total += 1
        print(f"\n  {total} modeles crees")

    finally:
        await conn.close()


if __name__ == "__main__":
    print("=== Seed Router Brands & Models (FastAPI DB) ===")
    asyncio.run(seed())
    print("=== Seed termine ===")
