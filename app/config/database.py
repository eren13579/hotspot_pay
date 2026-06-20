import asyncio
import logging
import subprocess
import sys
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config.settings import get_settings

settings = get_settings()

# PostgreSQL async engine via asyncpg
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # verifie la connexion avant chaque emprunt
)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def _run_alembic_migrations():
    """Run alembic upgrade head in a subprocess to apply pending migrations."""
    logger = logging.getLogger(__name__)
    try:
        result = await asyncio.to_thread(
            subprocess.run,
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode == 0:
            logger.info("Migrations appliquées avec succès")
            if result.stdout:
                for line in result.stdout.strip().split("\n"):
                    if line.strip():
                        logger.info("alembic: %s", line)
        else:
            logger.warning("Échec migrations (ignoré — peut être normal sur première exécution): %s",
                           result.stderr.strip())
    except Exception as e:
        logger.warning("Impossible d'exécuter les migrations: %s (ignore)", e)


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_session() -> AsyncSession:
    """Context manager for background tasks that need their own session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    from app.infrastructure.persistence.schemas import (  # noqa: F401
        HotspotSchema, TicketSchema, RouterActionSchema,
        RouterBrandSchema, RouterModelSchema,
        PlanSchema, HotspotSessionSchema, PaymentSchema, UserSchema,
        SubscriptionSchema, SubscriptionPlanSchema,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Appliquer les migrations Alembic (créé la table alembic_version + pending)
    await _run_alembic_migrations()
    # Peupler les tables de référence si vides
    try:
        async with async_session_factory() as session:
            from app.infrastructure.persistence.seeders import (
                seed_router_brands_and_models,
                seed_subscription_plans,
            )
            await seed_router_brands_and_models(session)
            await seed_subscription_plans(session)
            await session.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Seeder echoue (non-critique): %s", e)
        try:
            await session.rollback()
        except Exception:
            pass
