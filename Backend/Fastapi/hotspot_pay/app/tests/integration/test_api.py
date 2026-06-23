"""
Tests d'intégration pour les endpoints API.

On teste uniquement les endpoints qui ne necessitent pas de DB:
- Health checks
- Validation des query params (422)
- Documentation publique
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest_asyncio.fixture
async def client():
    with patch("app.config.database.init_db", new_callable=AsyncMock), \
         patch("app.config.database.async_session_factory") as mock_factory, \
         patch("app.infrastructure.messaging.action_queue.action_queue") as mock_q:

        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_factory.return_value = mock_session

        mock_q.connect = AsyncMock()
        mock_q.close = AsyncMock()
        mock_q._use_redis = False
        mock_q._redis = None

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_readiness_check(client: AsyncClient):
    response = await client.get("/health/ready")
    assert response.status_code in (200, 503)


@pytest.mark.asyncio
async def test_long_poll_missing_token(client: AsyncClient):
    response = await client.get("/api/v1/router/test-hs/pending-actions")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_health_is_public(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_docs_is_public(client: AsyncClient):
    response = await client.get("/docs")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_openapi_is_public(client: AsyncClient):
    response = await client.get("/openapi.json")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_redoc_is_public(client: AsyncClient):
    response = await client.get("/redoc")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_router_config_missing_token(client: AsyncClient):
    response = await client.get("/api/v1/router/agent/router-config")
    assert response.status_code == 422
