"""
Admin Monitoring routes — router actions queue monitoring.

Provides aggregated stats about the router action queue for the admin dashboard.
Exposes pending/failed/acked action counts, per-hotspot breakdown, and recent actions.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.domain.models.router_action import ActionStatus, RouterActionType
from app.infrastructure.persistence.schemas import RouterActionSchema

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/monitoring", tags=["Admin Monitoring"])


@router.get("/router-actions")
async def get_router_actions_monitoring(
    limit: int = Query(50, ge=1, le=200, description="Nombre d'actions récentes"),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated router action stats for admin monitoring dashboard.

    Returns:
    - counts: total actions grouped by status
    - recentActions: last N actions
    - perHotspot: action count per hotspot (top 20)
    - summary: overall metrics
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    one_hour_ago = now - timedelta(hours=1)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    async with db as session:
        # ── Counts by status ──
        status_counts = {}
        for status in ActionStatus:
            result = await session.execute(
                text("SELECT COUNT(*) FROM router_actions WHERE status = :status"),
                {"status": status.value},
            )
            status_counts[status.value] = result.scalar() or 0

        # ── Counts by type ──
        type_counts = {}
        for atype in RouterActionType:
            result = await session.execute(
                text("SELECT COUNT(*) FROM router_actions WHERE action_type = :atype"),
                {"atype": atype.value},
            )
            type_counts[atype.value] = result.scalar() or 0

        # ── Actions created last hour ──
        result = await session.execute(
            text("SELECT COUNT(*) FROM router_actions WHERE created_at >= :cutoff"),
            {"cutoff": one_hour_ago},
        )
        last_hour_count = result.scalar() or 0

        # ── Actions created today ──
        result = await session.execute(
            text("SELECT COUNT(*) FROM router_actions WHERE created_at >= :cutoff"),
            {"cutoff": today_start},
        )
        today_count = result.scalar() or 0

        # ── Error rate (ACK_FAILED / total acked) ──
        result = await session.execute(
            text("""
                SELECT
                    COUNT(*) FILTER (WHERE ack_success = false) AS failed,
                    COUNT(*) FILTER (WHERE ack_success IS NOT NULL) AS total
                FROM router_actions
            """),
        )
        row = result.one()
        total_acked = row.total or 0
        failed_acks = row.failed or 0
        error_rate = round((failed_acks / total_acked * 100), 1) if total_acked > 0 else 0.0

        # ── Average delivery time (for ACK_SUCCESS actions) ──
        result = await session.execute(
            text("""
                SELECT AVG(EXTRACT(EPOCH FROM (ack_at - created_at))) AS avg_delivery_s
                FROM router_actions
                WHERE ack_success = true AND ack_at IS NOT NULL AND created_at IS NOT NULL
            """),
        )
        avg_delivery_s = result.scalar()
        avg_delivery_seconds = round(avg_delivery_s, 1) if avg_delivery_s else None

        # ── Recent actions ──
        result = await session.execute(
            text("""
                SELECT ra.*, h.name AS hotspot_name
                FROM router_actions ra
                LEFT JOIN hotspots h ON ra.hotspot_id = h.hotspot_id
                ORDER BY ra.created_at DESC
                LIMIT :lim
            """),
            {"lim": limit},
        )
        recent = []
        for row in result.fetchall():
            recent.append({
                "actionId": row.action_id,
                "hotspotId": row.hotspot_id,
                "hotspotName": row.hotspot_name or "N/A",
                "actionType": row.action_type,
                "username": row.username,
                "status": row.status,
                "ackSuccess": row.ack_success,
                "ackError": row.ack_error,
                "createdAt": row.created_at.isoformat() if row.created_at else None,
                "deliveredAt": row.delivered_at.isoformat() if row.delivered_at else None,
                "ackAt": row.ack_at.isoformat() if row.ack_at else None,
            })

        # ── Per-hotspot breakdown ──
        result = await session.execute(
            text("""
                SELECT
                    ra.hotspot_id,
                    COALESCE(h.name, 'N/A') AS hotspot_name,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE ra.status = 'PENDING') AS pending,
                    COUNT(*) FILTER (WHERE ra.status = 'ACK_FAILED') AS failed,
                    MAX(ra.created_at) AS last_action_at
                FROM router_actions ra
                LEFT JOIN hotspots h ON ra.hotspot_id = h.hotspot_id
                GROUP BY ra.hotspot_id, h.name
                ORDER BY total DESC
                LIMIT 20
            """),
        )
        per_hotspot = []
        for row in result.fetchall():
            per_hotspot.append({
                "hotspotId": row.hotspot_id,
                "hotspotName": row.hotspot_name,
                "total": row.total,
                "pending": row.pending,
                "failed": row.failed,
                "lastActionAt": row.last_action_at.isoformat() if row.last_action_at else None,
            })

    return {
        "success": True,
        "data": {
            "counts": status_counts,
            "typeCounts": type_counts,
            "summary": {
                "totalToday": today_count,
                "totalLastHour": last_hour_count,
                "errorRate": error_rate,
                "failedAcks": failed_acks,
                "totalAcked": total_acked,
                "avgDeliverySeconds": avg_delivery_seconds,
            },
            "recentActions": recent,
            "perHotspot": per_hotspot,
        },
    }
