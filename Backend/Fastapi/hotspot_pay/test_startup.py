import asyncio
from app.config.database import init_db, engine
from app.infrastructure.persistence.schemas import HotspotSchema, TicketSchema, RouterActionSchema

async def test():
    print("Test demarrage FastAPI avec PostgreSQL...")
    try:
        await init_db()
        print("init_db() OK")

        # Tester une requete simple
        from sqlalchemy import text, select
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"Base de donnees: {db_name}")

            result = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
            ))
            tables = [row[0] for row in result]
            print(f"Tables: {tables}")

        print("\nFastAPI + PostgreSQL OK — pret a demarrer!")
    except Exception as e:
        print(f"ERREUR: {type(e).__name__}: {e}")
    finally:
        await engine.dispose()

asyncio.run(test())
