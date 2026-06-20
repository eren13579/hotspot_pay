import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.config.database import engine, async_session_factory
from app.infrastructure.messaging.action_queue import action_queue

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health"])


@router.get("/")
async def root():
    return {
        "service": "HotspotPay FastAPI Microservice",
        "version": "1.0.0",
        "docs": "/docs",
    }


@router.get("/health")
async def health_check():
    """Basic health check — always returns 200 if the process is alive."""
    return {
        "status": "healthy",
        "service": "HotspotPay FastAPI Microservice",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/ready")
async def readiness_check():
    """Readiness probe — checks database and Redis connectivity."""
    checks = {}
    overall_healthy = True

    # Check PostgreSQL
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        logger.error("Health check: database error: %s", e)
        checks["database"] = f"error: {e}"
        overall_healthy = False

    # Check Redis (if configured)
    if action_queue._use_redis and action_queue._redis:
        try:
            await action_queue._redis.ping()
            checks["redis"] = "ok"
        except Exception as e:
            logger.error("Health check: Redis error: %s", e)
            checks["redis"] = f"error: {e}"
            overall_healthy = False
    else:
        checks["redis"] = "memory-fallback"

    status_code = 200 if overall_healthy else 503
    return {
        "status": "ready" if overall_healthy else "degraded",
        "checks": checks,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
