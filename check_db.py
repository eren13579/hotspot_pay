import asyncio
from sqlalchemy import text
from app.config.database import engine, Base

# IMPORTANT: importer les schemas pour les enregistrer dans Base.metadata
from app.infrastructure.persistence.schemas import HotspotSchema, TicketSchema, RouterActionSchema

async def check():
    print(f"Tables dans Base.metadata: {list(Base.metadata.tables.keys())}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
        ))
        tables = [row[0] for row in result]
        print(f"\nTables creees dans 'hostpot_fastapi' ({len(tables)}):")
        for t in tables:
            print(f"  OK - {t}")

asyncio.run(check())
