import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.config.database import init_db, get_db_session
from app.infrastructure.messaging.action_queue import action_queue
from app.infrastructure.repositories.router_action_repository import RouterActionRepository
from app.application.services.router_action_service import RouterActionService
from app.presentation.api.middlewares.api_key_auth import ApiKeyMiddleware
from app.presentation.api.routes.health import router as health_router
from app.presentation.api.routes.router import router as router_router
from app.presentation.api.routes.tickets import router as tickets_router
from app.presentation.api.routes.hotspots import router as hotspots_router
from app.presentation.api.routes.router_brands import router as router_brands_router
from app.presentation.api.routes.script_download import router as script_download_router
from app.presentation.api.routes.plans import router as plans_router
from app.presentation.api.routes.sessions import router as sessions_router
from app.presentation.api.routes.payments import router as payments_router
from app.presentation.api.routes.dashboard import router as dashboard_router
from app.presentation.api.routes.subscriptions import router as subscriptions_router, admin_router as admin_subscriptions_router
from app.presentation.api.routes.admin_monitoring import router as admin_monitoring_router

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def _cleanup_expired_actions():
    while True:
        try:
            await asyncio.sleep(60)
            async with get_db_session() as session:
                repo = RouterActionRepository(session)
                service = RouterActionService(repo)
                count = await service.cleanup_expired()
                if count:
                    logger.info("Cleanup: %d expired action(s) removed", count)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Cleanup expired actions error: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HotspotPay FastAPI Microservice v%s", settings.APP_VERSION)
    await init_db()
    logger.info("Database initialized")
    await action_queue.connect()

    cleanup_task = asyncio.create_task(_cleanup_expired_actions())
    logger.info("Background cleanup task started (interval: 60s)")

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

    await action_queue.close()
    logger.info("Shutting down HotspotPay FastAPI Microservice")


_cors_origins = [o.strip() for o in settings.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Microservice FastAPI pour la gestion des hotspots MikroTik — HotspotPay",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API key middleware added AFTER CORS so CORS runs first (outermost),
# then API key check, then routes.
app.add_middleware(ApiKeyMiddleware)

app.include_router(health_router, prefix="")
app.include_router(router_router)
app.include_router(tickets_router)
app.include_router(hotspots_router)
app.include_router(router_brands_router)
app.include_router(script_download_router)
app.include_router(plans_router)
app.include_router(sessions_router)
app.include_router(payments_router)
app.include_router(dashboard_router)
app.include_router(subscriptions_router)
app.include_router(admin_subscriptions_router)
app.include_router(admin_monitoring_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
