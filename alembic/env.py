import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine

from alembic import context

# Alembic Config object
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Import ALL schemas so Base.metadata is populated ─────
from app.infrastructure.persistence.schemas import (
    HotspotSchema, TicketSchema, RouterActionSchema,
    RouterBrandSchema, RouterModelSchema,
    PlanSchema, HotspotSessionSchema, PaymentSchema, UserSchema,
    SubscriptionSchema, SubscriptionPlanSchema,
)
from app.config.database import Base
from app.config.settings import get_settings

target_metadata = Base.metadata

# Build async DB URL from same settings the app uses
settings = get_settings()
db_url = settings.DATABASE_URL  # already built with asyncpg+quote_plus


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL without connecting)."""
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations synchronously within its sync context."""
    connectable: AsyncEngine = create_async_engine(
        db_url,
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connect to actual DB)."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
