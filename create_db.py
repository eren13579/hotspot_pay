import asyncio
import asyncpg

async def create_database():
    # Se connecter à la base 'postgres' par défaut pour créer la nouvelle DB
    conn = await asyncpg.connect(
        host="127.0.0.1",
        port=5432,
        user="postgres",
        password="Teda@2003",
        database="postgres"
    )

    # Vérifier si la DB existe déjà
    row = await conn.fetchrow(
        "SELECT 1 FROM pg_database WHERE datname = $1", "hostpot_fastapi"
    )

    if row:
        print("La base 'hostpot_fastapi' existe deja")
    else:
        await conn.execute('CREATE DATABASE "hostpot_fastapi"')
        print("Base 'hostpot_fastapi' creee avec succes")

    await conn.close()

asyncio.run(create_database())
