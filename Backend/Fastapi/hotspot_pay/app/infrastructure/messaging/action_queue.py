import asyncio
import json
import logging
from collections import defaultdict
from typing import Dict, List, Optional

import redis.asyncio as redis

from app.config.settings import get_settings
from app.domain.models.router_action import RouterAction, ActionStatus

logger = logging.getLogger(__name__)
settings = get_settings()

REDIS_QUEUE_PREFIX = "hotspotpay:queue:"
REDIS_PENDING_PREFIX = "hotspotpay:pending:"
REDIS_NOTIFICATION_CHANNEL = "hotspotpay:notify"

# Safety limit for in-memory fallback to prevent OOM when Redis is down
MAX_MEMORY_QUEUE_SIZE = 10000


class ActionQueue:
    """Hybrid async queue per hotspot for Long Polling.

    Primary backend: Redis (survives restarts, multi-instance safe).
    Fallback: in-memory asyncio.Queue (if Redis unavailable).

    Flow:
    1. enqueue() → push to Redis list + publish notification
    2. wait_for_actions() → check pending first, then BRPOP with timeout
    """

    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._use_redis = False
        self._memory_queues: Dict[str, asyncio.Queue] = defaultdict(asyncio.Queue)
        self._memory_pending: Dict[str, List[RouterAction]] = defaultdict(list)
        self._memory_pending_data: Dict[str, str] = {}
        self._action_to_hotspot: Dict[str, str] = {}
        self._memory_size: int = 0  # track total queued items

    async def connect(self) -> None:
        """Initialize Redis connection. Falls back to in-memory on failure."""
        try:
            self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True, protocol=2)
            await self._redis.ping()
            self._use_redis = True
            logger.info("ActionQueue: Redis connected — persistent mode")
        except Exception as e:
            self._use_redis = False
            logger.warning("ActionQueue: Redis unavailable (%s) — in-memory fallback", e)

    async def close(self) -> None:
        if self._redis:
            await self._redis.close()

    def _queue_key(self, hotspot_id: str) -> str:
        return f"{REDIS_QUEUE_PREFIX}{hotspot_id}"

    def _pending_key(self, hotspot_id: str) -> str:
        return f"{REDIS_PENDING_PREFIX}{hotspot_id}"

    @staticmethod
    def _serialize(action: RouterAction) -> str:
        return json.dumps({
            "id": action.id,
            "action_id": action.action_id,
            "hotspot_id": action.hotspot_id,
            "action_type": action.action_type.value,
            "username": action.username,
            "password": action.password,
            "profile": action.profile,
            "time_limit": action.time_limit,
            "data_limit": action.data_limit,
            "comment": action.comment,
            "mac_address": action.mac_address,
            "status": action.status.value,
            "created_at": action.created_at.isoformat(),
        })

    @staticmethod
    def _deserialize(data: str) -> RouterAction:
        d = json.loads(data)
        return RouterAction(
            id=d["id"],
            action_id=d["action_id"],
            hotspot_id=d["hotspot_id"],
            action_type=d["action_type"],
            username=d["username"],
            password=d["password"],
            profile=d.get("profile", "default"),
            time_limit=d.get("time_limit"),
            data_limit=d.get("data_limit"),
            comment=d.get("comment"),
            mac_address=d.get("mac_address"),
            status=ActionStatus(d.get("status", "PENDING")),
        )

    async def enqueue(self, action: RouterAction) -> None:
        """Add a pending action to the hotspot queue."""
        hotspot_id = action.hotspot_id

        if self._use_redis:
            queue_key = self._queue_key(hotspot_id)
            pending_key = self._pending_key(hotspot_id)
            serialized = self._serialize(action)

            # Store serialized form for later LREM (avoids serialization mismatch)
            pipe = self._redis.pipeline()
            pipe.rpush(queue_key, serialized)
            pipe.sadd(pending_key, action.action_id)
            pipe.set(f"{pending_key}:data:{action.action_id}", serialized)
            pipe.publish(REDIS_NOTIFICATION_CHANNEL, hotspot_id)
            await pipe.execute()

            # Store hotspot mapping for O(1) mark_delivered
            await self._redis.set(f"{pending_key}:hotspot:{action.action_id}", hotspot_id)

            logger.info("Action enqueued (Redis): action_id=%s hotspot=%s user=%s",
                         action.action_id, hotspot_id, action.username)
        else:
            # Prevent OOM if Redis is down for extended periods
            if self._memory_size >= MAX_MEMORY_QUEUE_SIZE:
                logger.critical("Memory queue full (%d items) — dropping oldest action", self._memory_size)
                # Remove oldest from pending tracking
                if self._memory_pending[hotspot_id]:
                    oldest = self._memory_pending[hotspot_id].pop(0)
                    self._memory_pending_data.pop(oldest.action_id, None)
                    self._action_to_hotspot.pop(oldest.action_id, None)
                    self._memory_size -= 1

            self._memory_pending[hotspot_id].append(action)
            await self._memory_queues[hotspot_id].put(action)
            self._memory_pending_data[action.action_id] = self._serialize(action)
            self._action_to_hotspot[action.action_id] = hotspot_id
            self._memory_size += 1
            logger.info("Action enqueued (memory): action_id=%s hotspot=%s user=%s",
                         action.action_id, hotspot_id, action.username)

    async def wait_for_actions(self, hotspot_id: str, timeout: float = 20.0) -> Optional[RouterAction]:
        """Wait for the next pending action. Returns None on timeout."""
        if self._use_redis:
            return await self._wait_redis(hotspot_id, timeout)
        else:
            return await self._wait_memory(hotspot_id, timeout)

    async def _wait_redis(self, hotspot_id: str, timeout: float) -> Optional[RouterAction]:
        """Redis BRPOP — blocks until item available or timeout."""
        queue_key = self._queue_key(hotspot_id)
        try:
            result = await self._redis.blpop(queue_key, timeout=int(timeout))
            if result:
                _, data = result
                return self._deserialize(data)
        except Exception as e:
            logger.error("Redis wait error: %s — falling back to memory", e)
        return None

    async def _wait_memory(self, hotspot_id: str, timeout: float) -> Optional[RouterAction]:
        """In-memory asyncio.Queue wait."""
        try:
            action = await asyncio.wait_for(
                self._memory_queues[hotspot_id].get(), timeout=timeout)
            self._memory_size = max(0, self._memory_size - 1)
            # Also remove from pending tracking
            self._memory_pending[hotspot_id] = [
                a for a in self._memory_pending.get(hotspot_id, [])
                if a.action_id != action.action_id
            ]
            self._memory_pending_data.pop(action.action_id, None)
            self._action_to_hotspot.pop(action.action_id, None)
            return action
        except asyncio.TimeoutError:
            return None

    async def get_pending_actions(self, hotspot_id: str) -> List[RouterAction]:
        """Return all pending actions for a hotspot without removing them."""
        if self._use_redis:
            queue_key = self._queue_key(hotspot_id)
            try:
                items = await self._redis.lrange(queue_key, 0, -1)
                return [self._deserialize(d) for d in items]
            except Exception as e:
                logger.error("Redis lrange error for hotspot=%s: %s — falling back to memory", hotspot_id, e)
                return [a for a in self._memory_pending.get(hotspot_id, [])
                        if a.status == ActionStatus.PENDING]
        else:
            return [a for a in self._memory_pending.get(hotspot_id, [])
                    if a.status == ActionStatus.PENDING]

    async def mark_delivered(self, action_id: str) -> None:
        """Mark an action as delivered and remove it from the queue.

        Uses the ORIGINAL serialized form (stored at enqueue time) for exact LREM,
        avoiding the serialization mismatch bug where status has changed to DELIVERED.
        """
        if self._use_redis:
            # O(1) lookup of hotspot_id from stored mapping key
            hotspot_id = None
            async for key in self._redis.scan_iter(match=f"{REDIS_PENDING_PREFIX}*:hotspot:{action_id}"):
                hotspot_id = await self._redis.get(key)
                break

            if hotspot_id:
                queue_key = self._queue_key(hotspot_id)
                pending_key = self._pending_key(hotspot_id)
                # Use the ORIGINAL serialized form, not a re-serialization
                original_data = await self._redis.get(f"{pending_key}:data:{action_id}")
                if original_data:
                    await self._redis.lrem(queue_key, 1, original_data)
                else:
                    # Fallback: try to remove by scanning (slower but safe)
                    logger.warning("mark_delivered: original data not found for action_id=%s, using fallback", action_id)
                    items = await self._redis.lrange(queue_key, 0, -1)
                    for item in items:
                        d = json.loads(item)
                        if d.get("action_id") == action_id:
                            await self._redis.lrem(queue_key, 1, item)
                            break
                await self._redis.srem(pending_key, action_id)
                # Clean up stored data
                await self._redis.delete(f"{pending_key}:data:{action_id}")
                await self._redis.delete(f"{pending_key}:hotspot:{action_id}")
            else:
                logger.warning("mark_delivered: hotspot not found for action_id=%s", action_id)
        else:
            # Memory mode: O(1) lookup using index
            hotspot_id = self._action_to_hotspot.get(action_id)
            if hotspot_id and hotspot_id in self._memory_pending:
                for action in self._memory_pending[hotspot_id]:
                    if action.action_id == action_id:
                        action.mark_delivered()
                        break
                # Clean up
                self._memory_pending[hotspot_id] = [
                    a for a in self._memory_pending[hotspot_id]
                    if a.action_id != action_id
                ]
                self._memory_pending_data.pop(action_id, None)
                self._action_to_hotspot.pop(action_id, None)

    async def remove_delivered(self, hotspot_id: str) -> None:
        """Clean up delivered/acked actions from pending list."""
        if hotspot_id in self._memory_pending:
            delivered = [a for a in self._memory_pending[hotspot_id]
                         if a.status != ActionStatus.PENDING]
            self._memory_pending[hotspot_id] = [
                a for a in self._memory_pending[hotspot_id]
                if a.status == ActionStatus.PENDING
            ]
            # Clean up indexes
            for a in delivered:
                self._memory_pending_data.pop(a.action_id, None)
                self._action_to_hotspot.pop(a.action_id, None)
            self._memory_size -= len(delivered)

    def size(self, hotspot_id: str) -> int:
        return len(self._memory_pending.get(hotspot_id, []))


action_queue = ActionQueue()
