"""
Configuration pour les tests d'intégration.

Utilise ASGITransport (pas de serveur réel) et mock la DB + Redis.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
import sys
from pathlib import Path

# Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


@pytest.fixture(scope="session", autouse=True)
def mock_db_and_redis():
    """Mock la base de données et Redis pour tous les tests d'intégration."""
    mock_session = AsyncMock()
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=False)

    with patch("app.config.database.async_session_factory") as mock_factory, \
         patch("app.config.database.init_db", new_callable=AsyncMock), \
         patch("app.infrastructure.messaging.action_queue.action_queue") as mock_queue:

        mock_factory.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_factory.return_value.__aexit__ = AsyncMock(return_value=False)

        mock_queue.connect = AsyncMock()
        mock_queue.close = AsyncMock()
        mock_queue._use_redis = False
        mock_queue._redis = None

        yield


@pytest_asyncio.fixture
async def client():
    """Client HTTP de test."""
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
