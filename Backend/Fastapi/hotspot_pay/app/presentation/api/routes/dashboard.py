"""
Dashboard routes — aggregate stats for hotspot owner.

Aggregates data from hotspot_fastapi tables (hotspots, sessions, payments).
Inline DashboardService for aggregation queries.
"""
import logging
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


class DashboardService:
    """Aggregate analytics from hotspot_fastapi tables."""

    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_overview(self, user_id: str,
                           start_date: Optional[str] = None,
                           end_date: Optional[str] = None) -> dict:
        """Global stats: total hotspots, active sessions, revenue today/this month."""
        async with self._db as session:
            # Compute date range for revenue queries
            today = date.today()
            sd = today - timedelta(days=30)
            ed = today
            if start_date:
                try: sd = datetime.strptime(start_date, '%Y-%m-%d').date()
                except: pass
            if end_date:
                try: ed = datetime.strptime(end_date, '%Y-%m-%d').date()
                except: pass
            period_days = max((ed - sd).days, 1)
            prev_sd = sd - timedelta(days=period_days)
            prev_ed = sd - timedelta(days=1)
            # Total hotspots
            hs_result = await session.execute(
                text("SELECT COUNT(*) FROM hotspots WHERE user_id = :uid"),
                {"uid": user_id},
            )
            total_hotspots = hs_result.scalar() or 0

            # Active sessions
            sess_result = await session.execute(
                text("SELECT COUNT(*) FROM sessions WHERE status = 'ACTIVE'"),
            )
            active_sessions = sess_result.scalar() or 0

            # Online hotspots (ping in last 30s)
            online_hs = await session.execute(
                text("SELECT COUNT(*) FROM hotspots WHERE user_id = :uid AND last_ping_at IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - last_ping_at)) < 30"),
                {"uid": user_id},
            )
            online_hotspots = online_hs.scalar() or 0

            # Total revenue (all payments with SUCCESS status)
            rev_result = await session.execute(
                text("SELECT COALESCE(SUM(amount::numeric), 0) FROM payments WHERE status = 'SUCCESS'"),
            )
            total_revenue = float(rev_result.scalar() or 0)

            # Revenue today
            rev_today = await session.execute(
                text("SELECT COALESCE(SUM(amount::numeric), 0) FROM payments WHERE status = 'SUCCESS' AND paid_at::date = CURRENT_DATE"),
            )
            revenue_today = float(rev_today.scalar() or 0)

            # Revenue this month
            rev_month = await session.execute(
                text("SELECT COALESCE(SUM(amount::numeric), 0) FROM payments WHERE status = 'SUCCESS' AND paid_at >= date_trunc('month', CURRENT_DATE)"),
            )
            revenue_month = float(rev_month.scalar() or 0)

            # Total tickets for user's hotspots
            tickets = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE hotspot_id IN (SELECT hotspot_id FROM hotspots WHERE user_id = :uid)"),
                {"uid": user_id},
            )
            total_tickets = tickets.scalar() or 0

            # Available tickets (not used/expired/revoked)
            avail = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE hotspot_id IN (SELECT hotspot_id FROM hotspots WHERE user_id = :uid) AND status = 'AVAILABLE'"),
                {"uid": user_id},
            )
            available_tickets = avail.scalar() or 0

            # Total plans for user's hotspots
            plans = await session.execute(
                text("SELECT COUNT(*) FROM plans WHERE hotspot_id IN (SELECT hotspot_id FROM hotspots WHERE user_id = :uid)"),
                {"uid": user_id},
            )
            total_plans = plans.scalar() or 0

            # Used / expired tickets
            used = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE hotspot_id IN (SELECT hotspot_id FROM hotspots WHERE user_id = :uid) AND status = 'USED'"),
                {"uid": user_id},
            )
            used_tickets = used.scalar() or 0

            expired = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE hotspot_id IN (SELECT hotspot_id FROM hotspots WHERE user_id = :uid) AND status = 'EXPIRED'"),
                {"uid": user_id},
            )
            expired_tickets = expired.scalar() or 0

            revoked = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE hotspot_id IN (SELECT hotspot_id FROM hotspots WHERE user_id = :uid) AND status = 'REVOKED'"),
                {"uid": user_id},
            )
            revoked_tickets = revoked.scalar() or 0

            # Revenue by day (filtered by date range)
            rev_days = await session.execute(
                text("""
                    SELECT p.paid_at::date AS date, COALESCE(SUM(p.amount::numeric), 0) AS revenue
                    FROM payments p
                    JOIN hotspots h ON p.hotspot_id = h.hotspot_id
                    WHERE p.status = 'SUCCESS' AND h.user_id = :uid
                      AND p.paid_at::date >= :sd AND p.paid_at::date <= :ed
                    GROUP BY p.paid_at::date
                    ORDER BY p.paid_at::date
                """),
                {"uid": user_id, "sd": sd, "ed": ed},
            )
            revenue_by_day = [
                {"date": str(row.date), "revenue": float(row.revenue)}
                for row in rev_days.fetchall()
            ]

            # Sessions by day (filtered by date range)
            sess_days = await session.execute(
                text("""
                    SELECT s.created_at::date AS date, COUNT(*) AS sessions
                    FROM sessions s
                    JOIN hotspots h ON s.hotspot_id = h.hotspot_id
                    WHERE h.user_id = :uid
                      AND s.created_at::date >= :sd AND s.created_at::date <= :ed
                    GROUP BY s.created_at::date
                    ORDER BY s.created_at::date
                """),
                {"uid": user_id, "sd": sd, "ed": ed},
            )
            sessions_by_day = [
                {"date": str(row.date), "sessions": row.sessions}
                for row in sess_days.fetchall()
            ]

            # Revenue for previous period (growth comparison)
            prev_rev = await session.execute(
                text("""
                    SELECT COALESCE(SUM(amount::numeric), 0) FROM payments
                    WHERE status = 'SUCCESS' AND hotspot_id IN (
                        SELECT hotspot_id FROM hotspots WHERE user_id = :uid
                    )
                    AND paid_at::date >= :psd AND paid_at::date <= :ped
                """),
                {"uid": user_id, "psd": prev_sd, "ped": prev_ed},
            )
            previous_period_revenue = float(prev_rev.scalar() or 0)

            # Current period revenue for growth calculation
            current_period_revenue = float(
                (await session.execute(
                    text("""
                        SELECT COALESCE(SUM(amount::numeric), 0) FROM payments
                        WHERE status = 'SUCCESS' AND hotspot_id IN (
                            SELECT hotspot_id FROM hotspots WHERE user_id = :uid
                        )
                        AND paid_at::date >= :sd2 AND paid_at::date <= :ed2
                    """),
                    {"uid": user_id, "sd2": sd, "ed2": ed},
                )).scalar() or 0)

            # Recent payments (last 10)
            recent = await session.execute(
                text("""
                    SELECT p.paid_at, p.amount, p.status, p.hotspot_id, h.name AS hotspot_name
                    FROM payments p
                    JOIN hotspots h ON p.hotspot_id = h.hotspot_id
                    WHERE p.status = 'SUCCESS' AND h.user_id = :uid
                    ORDER BY p.paid_at DESC
                    LIMIT 10
                """),
                {"uid": user_id},
            )
            recent_payments = [
                {
                    "paidAt": str(row.paid_at),
                    "amount": float(row.amount),
                    "status": row.status,
                    "hotspotId": row.hotspot_id,
                    "hotspotName": row.hotspot_name,
                }
                for row in recent.fetchall()
            ]

            # Top hotspots by revenue for this user
            top = await session.execute(
                text("""
                    SELECT h.name, h.hotspot_id, COALESCE(SUM(p.amount::numeric), 0) AS revenue
                    FROM hotspots h
                    LEFT JOIN payments p ON h.hotspot_id = p.hotspot_id AND p.status = 'SUCCESS'
                    WHERE h.user_id = :uid
                    GROUP BY h.hotspot_id, h.name
                    ORDER BY revenue DESC
                    LIMIT 3
                """),
                {"uid": user_id},
            )
            top_hotspots = [
                {"name": row.name, "hotspotId": row.hotspot_id, "revenue": float(row.revenue)}
                for row in top.fetchall()
            ]

        return {
            "totalHotspots": total_hotspots,
            "onlineHotspots": online_hotspots,
            "activeSessions": active_sessions,
            "totalRevenue": total_revenue,
            "revenueToday": revenue_today,
            "revenueThisMonth": revenue_month,
            "revenueByDay": revenue_by_day,
            "sessionsByDay": sessions_by_day,
            "totalTickets": total_tickets,
            "availableTickets": available_tickets,
            "usedTickets": used_tickets,
            "expiredTickets": expired_tickets,
            "revokedTickets": revoked_tickets,
            "totalPlans": total_plans,
            "topHotspots": top_hotspots,
            "recentPayments": recent_payments,
            "currentPeriodRevenue": current_period_revenue,
            "previousPeriodRevenue": previous_period_revenue,
        }

    async def get_hotspot_stats(self, user_id: str, hotspot_id: str, admin_override: bool = False) -> dict:
        """Detailed stats for a specific hotspot."""
        async with self._db as session:
            # Verify ownership (sauf pour admin en override)
            if not admin_override:
                hs = await session.execute(
                    text("SELECT id FROM hotspots WHERE hotspot_id = :hid AND user_id = :uid"),
                    {"hid": hotspot_id, "uid": user_id},
                )
                if not hs.scalar():
                    raise HTTPException(status_code=404, detail="Hotspot not found")

            # Total sessions
            sess_count = await session.execute(
                text("SELECT COUNT(*) FROM sessions WHERE hotspot_id = :hid"),
                {"hid": hotspot_id},
            )

            # Total revenue for this hotspot
            rev = await session.execute(
                text("SELECT COALESCE(SUM(amount::numeric), 0) FROM payments WHERE hotspot_id = :hid AND status = 'SUCCESS'"),
                {"hid": hotspot_id},
            )

            return {
                "totalSessions": sess_count.scalar() or 0,
                "totalRevenue": float(rev.scalar() or 0),
            }

    async def get_admin_overview(self,
                                   start_date: Optional[str] = None,
                                   end_date: Optional[str] = None) -> dict:
        """Admin stats: count ALL hotspots, sessions, revenue, distinct users."""
        async with self._db as session:
            # Compute date range
            today = date.today()
            sd = today - timedelta(days=30)
            ed = today
            if start_date:
                try: sd = datetime.strptime(start_date, '%Y-%m-%d').date()
                except: pass
            if end_date:
                try: ed = datetime.strptime(end_date, '%Y-%m-%d').date()
                except: pass
            period_days = max((ed - sd).days, 1)
            prev_sd = sd - timedelta(days=period_days)
            prev_ed = sd - timedelta(days=1)
            hs_result = await session.execute(
                text("SELECT COUNT(*) FROM hotspots"),
            )
            total_hotspots = hs_result.scalar() or 0

            sess_result = await session.execute(
                text("SELECT COUNT(*) FROM sessions WHERE status = 'ACTIVE'"),
            )
            active_sessions = sess_result.scalar() or 0

            online_hs = await session.execute(
                text("SELECT COUNT(*) FROM hotspots WHERE last_ping_at IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - last_ping_at)) < 30"),
            )
            online_hotspots = online_hs.scalar() or 0

            rev_result = await session.execute(
                text("SELECT COALESCE(SUM(amount::numeric), 0) FROM payments WHERE status = 'SUCCESS'"),
            )
            total_revenue = float(rev_result.scalar() or 0)

            rev_today = await session.execute(
                text("SELECT COALESCE(SUM(amount::numeric), 0) FROM payments WHERE status = 'SUCCESS' AND paid_at::date = CURRENT_DATE"),
            )
            revenue_today = float(rev_today.scalar() or 0)

            rev_month = await session.execute(
                text("SELECT COALESCE(SUM(amount::numeric), 0) FROM payments WHERE status = 'SUCCESS' AND paid_at >= date_trunc('month', CURRENT_DATE)"),
            )
            revenue_this_month = float(rev_month.scalar() or 0)

            users_result = await session.execute(
                text("SELECT COUNT(DISTINCT user_id) FROM hotspots"),
            )
            total_users = users_result.scalar() or 0

            # Global ticket count
            tkts = await session.execute(
                text("SELECT COUNT(*) FROM tickets"),
            )
            total_tickets = tkts.scalar() or 0

            # Available tickets
            avail = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE status = 'AVAILABLE'"),
            )
            available_tickets = avail.scalar() or 0

            # Global plan count
            plns = await session.execute(
                text("SELECT COUNT(*) FROM plans"),
            )
            total_plans = plns.scalar() or 0

            # Used / expired / revoked tickets
            used = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE status = 'USED'"),
            )
            used_tickets = used.scalar() or 0

            expired = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE status = 'EXPIRED'"),
            )
            expired_tickets = expired.scalar() or 0

            revoked = await session.execute(
                text("SELECT COUNT(*) FROM tickets WHERE status = 'REVOKED'"),
            )
            revoked_tickets = revoked.scalar() or 0

            # Revenue by day (filtered by date range)
            rev_days = await session.execute(
                text("""
                    SELECT paid_at::date AS date, COALESCE(SUM(amount::numeric), 0) AS revenue
                    FROM payments
                    WHERE status = 'SUCCESS'
                      AND paid_at::date >= :sd AND paid_at::date <= :ed
                    GROUP BY paid_at::date
                    ORDER BY paid_at::date
                """),
                {"sd": sd, "ed": ed},
            )
            revenue_by_day = [
                {"date": str(row.date), "revenue": float(row.revenue)}
                for row in rev_days.fetchall()
            ]

            # Sessions by day (filtered by date range)
            sess_days = await session.execute(
                text("""
                    SELECT s.created_at::date AS date, COUNT(*) AS sessions
                    FROM sessions s
                    WHERE s.created_at::date >= :sd AND s.created_at::date <= :ed
                    GROUP BY s.created_at::date
                    ORDER BY s.created_at::date
                """),
                {"sd": sd, "ed": ed},
            )
            sessions_by_day = [
                {"date": str(row.date), "sessions": row.sessions}
                for row in sess_days.fetchall()
            ]

            # Previous period revenue
            prev_rev = await session.execute(
                text("""
                    SELECT COALESCE(SUM(amount::numeric), 0) FROM payments
                    WHERE status = 'SUCCESS'
                      AND paid_at::date >= :psd AND paid_at::date <= :ped
                """),
                {"psd": prev_sd, "ped": prev_ed},
            )
            previous_period_revenue = float(prev_rev.scalar() or 0)

            # Current period revenue
            current_period_revenue = float(
                (await session.execute(
                    text("""
                        SELECT COALESCE(SUM(amount::numeric), 0) FROM payments
                        WHERE status = 'SUCCESS'
                          AND paid_at::date >= :sd2 AND paid_at::date <= :ed2
                    """),
                    {"sd2": sd, "ed2": ed},
                )).scalar() or 0)

            # Recent payments (last 10)
            recent = await session.execute(
                text("""
                    SELECT p.paid_at, p.amount, p.status, p.hotspot_id, h.name AS hotspot_name
                    FROM payments p
                    JOIN hotspots h ON p.hotspot_id = h.hotspot_id
                    WHERE p.status = 'SUCCESS'
                    ORDER BY p.paid_at DESC
                    LIMIT 10
                """),
            )
            recent_payments = [
                {
                    "paidAt": str(row.paid_at),
                    "amount": float(row.amount),
                    "status": row.status,
                    "hotspotId": row.hotspot_id,
                    "hotspotName": row.hotspot_name,
                }
                for row in recent.fetchall()
            ]

            # Top 3 hotspots by revenue
            top = await session.execute(
                text("""
                    SELECT h.name, h.hotspot_id, COALESCE(SUM(p.amount::numeric), 0) AS revenue
                    FROM hotspots h
                    LEFT JOIN payments p ON h.hotspot_id = p.hotspot_id AND p.status = 'SUCCESS'
                    GROUP BY h.hotspot_id, h.name
                    ORDER BY revenue DESC
                    LIMIT 3
                """),
            )
            top_hotspots = [
                {"name": row.name, "hotspotId": row.hotspot_id, "revenue": float(row.revenue)}
                for row in top.fetchall()
            ]

        return {
            "totalHotspots": total_hotspots,
            "onlineHotspots": online_hotspots,
            "activeSessions": active_sessions,
            "totalRevenue": total_revenue,
            "revenueToday": revenue_today,
            "revenueThisMonth": revenue_this_month,
            "totalUsers": total_users,
            "revenueByDay": revenue_by_day,
            "sessionsByDay": sessions_by_day,
            "totalTickets": total_tickets,
            "availableTickets": available_tickets,
            "usedTickets": used_tickets,
            "expiredTickets": expired_tickets,
            "revokedTickets": revoked_tickets,
            "totalPlans": total_plans,
            "topHotspots": top_hotspots,
            "recentPayments": recent_payments,
            "currentPeriodRevenue": current_period_revenue,
            "previousPeriodRevenue": previous_period_revenue,
        }


def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    return DashboardService(db)


@router.get("/overview")
async def dashboard_overview(
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    start_date: Optional[str] = Query(None, description="Date début (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Date fin (YYYY-MM-DD)"),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    """Global dashboard stats for the authenticated user."""
    data = await dashboard_service.get_overview(user_id, start_date, end_date)
    return {"success": True, "data": data}


@router.get("/hotspot/{hotspot_id}")
async def dashboard_hotspot_stats(
    hotspot_id: str,
    user_id: str = Query(..., description="UUID de l'utilisateur"),
    admin_override: bool = Query(False, description="Contourner la vérification de propriété (admin)"),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    """Detailed dashboard stats for a specific hotspot.
    - Utilisateur normal : ne voit que ses propres hotspots.
    - Admin (admin_override=true) : peut voir n'importe quel hotspot.
    """
    data = await dashboard_service.get_hotspot_stats(user_id, hotspot_id, admin_override=admin_override)
    return {"success": True, "data": data}


@router.get("/admin/overview")
async def dashboard_admin_overview(
    start_date: Optional[str] = Query(None, description="Date début (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Date fin (YYYY-MM-DD)"),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    """Admin dashboard stats — all users, all hotspots, revenue."""
    data = await dashboard_service.get_admin_overview(start_date, end_date)
    return {"success": True, "data": data}
