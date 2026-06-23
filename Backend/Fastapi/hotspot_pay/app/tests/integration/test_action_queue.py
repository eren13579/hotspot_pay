"""
Tests unitaires pour la file d'actions (mode mémoire — sans Redis).
"""
import pytest
import asyncio

from app.infrastructure.messaging.action_queue import ActionQueue
from app.domain.models.router_action import RouterAction, RouterActionType, ActionStatus


@pytest.fixture
def queue():
    """File en mémoire (Redis non disponible en test)."""
    q = ActionQueue()
    q._use_redis = False
    return q


@pytest.mark.asyncio
async def test_enqueue_and_wait(queue: ActionQueue):
    action = RouterAction(
        hotspot_id="hs1",
        action_type=RouterActionType.CREATE_USER,
        username="jez",
        password="245",
    )

    async def enqueue_later():
        await asyncio.sleep(0.1)
        await queue.enqueue(action)

    asyncio.create_task(enqueue_later())
    result = await queue.wait_for_actions("hs1", timeout=5.0)
    assert result is not None
    assert result.username == "jez"


@pytest.mark.asyncio
async def test_wait_timeout(queue: ActionQueue):
    result = await queue.wait_for_actions("empty-hs", timeout=0.3)
    assert result is None


@pytest.mark.asyncio
async def test_enqueue_multiple_hotspots(queue: ActionQueue):
    a1 = RouterAction(hotspot_id="hs1", action_type=RouterActionType.CREATE_USER,
                       username="user1", password="pass1")
    a2 = RouterAction(hotspot_id="hs2", action_type=RouterActionType.CREATE_USER,
                       username="user2", password="pass2")
    await queue.enqueue(a1)
    await queue.enqueue(a2)

    pending_hs1 = await queue.get_pending_actions("hs1")
    pending_hs2 = await queue.get_pending_actions("hs2")
    assert len(pending_hs1) == 1
    assert len(pending_hs2) == 1
    assert pending_hs1[0].username == "user1"
    assert pending_hs2[0].username == "user2"


@pytest.mark.asyncio
async def test_mark_delivered(queue: ActionQueue):
    action = RouterAction(hotspot_id="hs1", action_type=RouterActionType.CREATE_USER,
                           username="jez", password="245")
    await queue.enqueue(action)
    await queue.mark_delivered(action.action_id)

    pending = await queue.get_pending_actions("hs1")
    assert len(pending) == 0


@pytest.mark.asyncio
async def test_action_lifecycle(queue: ActionQueue):
    """Test complet: création → livraison → ACK."""
    action = RouterAction(hotspot_id="hs1", action_type=RouterActionType.CREATE_USER,
                           username="test", password="pass")
    assert action.status == ActionStatus.PENDING

    saved = await queue.enqueue(action)
    pending = await queue.get_pending_actions("hs1")
    assert len(pending) == 1

    await queue.mark_delivered(action.action_id)
    pending = await queue.get_pending_actions("hs1")
    assert len(pending) == 0


@pytest.mark.asyncio
async def test_serialization_roundtrip():
    """Vérifie que la sérialisation/désérialisation conserve les données."""
    original = RouterAction(
        hotspot_id="hs1",
        action_type=RouterActionType.CREATE_USER,
        username="jez",
        password="245",
        profile="1mois-3000",
        time_limit="4w2d",
        data_limit=6291456,
        comment="HP:sess123",
    )
    serialized = ActionQueue._serialize(original)
    restored = ActionQueue._deserialize(serialized)

    assert restored.action_id == original.action_id
    assert restored.hotspot_id == original.hotspot_id
    assert restored.action_type == original.action_type
    assert restored.username == original.username
    assert restored.password == original.password
    assert restored.profile == original.profile
    assert restored.time_limit == original.time_limit
    assert restored.data_limit == original.data_limit
    assert restored.comment == original.comment
