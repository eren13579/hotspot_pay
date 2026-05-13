package com.hotspotpay.dashboard.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public class DashboardRepository {

    private final JdbcTemplate jdbc;

    public DashboardRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── Revenus globaux ────────────────────────────────────────────────────

    public BigDecimal totalRevenue(String userId) {
        String sql = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            JOIN hotspots h ON h.hotspot_id = p.hotspot_id
            WHERE h.user_id = ? AND p.status = 'PAID'
        """;
        return jdbc.queryForObject(sql, BigDecimal.class, userId);
    }

    public BigDecimal revenueToday(String userId) {
        String sql = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            JOIN hotspots h ON h.hotspot_id = p.hotspot_id
            WHERE h.user_id = ?
              AND p.status = 'PAID'
              AND DATE(p.paid_at) = CURRENT_DATE
        """;
        return jdbc.queryForObject(sql, BigDecimal.class, userId);
    }

    public BigDecimal revenueThisMonth(String userId) {
        String sql = """
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            JOIN hotspots h ON h.hotspot_id = p.hotspot_id
            WHERE h.user_id = ?
              AND p.status = 'PAID'
              AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', CURRENT_DATE)
        """;
        return jdbc.queryForObject(sql, BigDecimal.class, userId);
    }

    // ── Sessions ───────────────────────────────────────────────────────────

    public long totalSessions(String userId) {
        String sql = """
            SELECT COUNT(s.id)
            FROM sessions s
            JOIN hotspots h ON h.hotspot_id = s.hotspot_id
            WHERE h.user_id = ?
        """;
        return jdbc.queryForObject(sql, Long.class, userId);
    }

    public long activeSessions(String userId) {
        String sql = """
            SELECT COUNT(s.id)
            FROM sessions s
            JOIN hotspots h ON h.hotspot_id = s.hotspot_id
            WHERE h.user_id = ? AND s.status = 'ACTIVE'
        """;
        return jdbc.queryForObject(sql, Long.class, userId);
    }

    public long sessionsToday(String userId) {
        String sql = """
            SELECT COUNT(s.id)
            FROM sessions s
            JOIN hotspots h ON h.hotspot_id = s.hotspot_id
            WHERE h.user_id = ?
              AND DATE(s.activated_at) = CURRENT_DATE
        """;
        return jdbc.queryForObject(sql, Long.class, userId);
    }

    // ── Paiements ──────────────────────────────────────────────────────────

    public long totalPayments(String userId) {
        String sql = """
            SELECT COUNT(p.id)
            FROM payments p
            JOIN hotspots h ON h.hotspot_id = p.hotspot_id
            WHERE h.user_id = ?
        """;
        return jdbc.queryForObject(sql, Long.class, userId);
    }

    public long paymentsByStatus(String userId, String status) {
        String sql = """
            SELECT COUNT(p.id)
            FROM payments p
            JOIN hotspots h ON h.hotspot_id = p.hotspot_id
            WHERE h.user_id = ? AND p.status = ?
        """;
        return jdbc.queryForObject(sql, Long.class, userId, status);
    }

    // ── Hotspots ───────────────────────────────────────────────────────────

    public long totalHotspots(String userId) {
        String sql = "SELECT COUNT(id) FROM hotspots WHERE user_id = ?";
        return jdbc.queryForObject(sql, Long.class, userId);
    }

    public long onlineHotspots(String userId) {
        String sql = "SELECT COUNT(id) FROM hotspots WHERE user_id = ? AND is_online = TRUE";
        return jdbc.queryForObject(sql, Long.class, userId);
    }

    // ── Top hotspot du mois ────────────────────────────────────────────────

    public Map<String, Object> topHotspotThisMonth(String userId) {
        String sql = """
            SELECT h.name, COALESCE(SUM(p.amount), 0) AS revenue
            FROM hotspots h
            LEFT JOIN payments p ON p.hotspot_id = h.hotspot_id
                AND p.status = 'PAID'
                AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', CURRENT_DATE)
            WHERE h.user_id = ?
            GROUP BY h.hotspot_id, h.name
            ORDER BY revenue DESC
            LIMIT 1
        """;
        List<Map<String, Object>> rows = jdbc.queryForList(sql, userId);
        return rows.isEmpty() ? Map.of("name", "-", "revenue", BigDecimal.ZERO) : rows.get(0);
    }

    // ── Stats par hotspot ──────────────────────────────────────────────────

    public BigDecimal revenueByHotspot(String hotspotId) {
        String sql = """
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE hotspot_id = ? AND status = 'PAID'
        """;
        return jdbc.queryForObject(sql, BigDecimal.class, hotspotId);
    }

    public BigDecimal revenueByHotspotToday(String hotspotId) {
        String sql = """
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE hotspot_id = ? AND status = 'PAID'
              AND DATE(paid_at) = CURRENT_DATE
        """;
        return jdbc.queryForObject(sql, BigDecimal.class, hotspotId);
    }

    public BigDecimal revenueByHotspotThisMonth(String hotspotId) {
        String sql = """
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE hotspot_id = ? AND status = 'PAID'
              AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
        """;
        return jdbc.queryForObject(sql, BigDecimal.class, hotspotId);
    }

    public long sessionsByHotspot(String hotspotId) {
        String sql = "SELECT COUNT(id) FROM sessions WHERE hotspot_id = ?";
        return jdbc.queryForObject(sql, Long.class, hotspotId);
    }

    public long activeSessionsByHotspot(String hotspotId) {
        String sql = "SELECT COUNT(id) FROM sessions WHERE hotspot_id = ? AND status = 'ACTIVE'";
        return jdbc.queryForObject(sql, Long.class, hotspotId);
    }

    public long paymentsByHotspotAndStatus(String hotspotId, String status) {
        String sql = "SELECT COUNT(id) FROM payments WHERE hotspot_id = ? AND status = ?";
        return jdbc.queryForObject(sql, Long.class, hotspotId, status);
    }

    // ── Top forfait du hotspot ─────────────────────────────────────────────

    public Map<String, Object> topPlanByHotspot(String hotspotId) {
        String sql = """
            SELECT pl.name, COUNT(s.id) AS cnt
            FROM sessions s
            JOIN plans pl ON pl.plan_id = s.plan_id
            WHERE s.hotspot_id = ?
            GROUP BY pl.plan_id, pl.name
            ORDER BY cnt DESC
            LIMIT 1
        """;
        List<Map<String, Object>> rows = jdbc.queryForList(sql, hotspotId);
        return rows.isEmpty() ? Map.of("name", "-", "cnt", 0L) : rows.get(0);
    }

    // ── Top opérateur du hotspot ───────────────────────────────────────────

    public String topOperatorByHotspot(String hotspotId) {
        String sql = """
            SELECT operator
            FROM payments
            WHERE hotspot_id = ? AND status = 'PAID'
            GROUP BY operator
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """;
        List<String> rows = jdbc.queryForList(sql, String.class, hotspotId);
        return rows.isEmpty() ? "-" : rows.get(0);
    }

    // ── Revenus journaliers (7 derniers jours) ─────────────────────────────

    public List<Map<String, Object>> dailyRevenueLast7Days(String hotspotId) {
        String sql = """
            SELECT
                TO_CHAR(gs.day, 'YYYY-MM-DD') AS date,
                COALESCE(SUM(p.amount), 0)    AS revenue,
                COUNT(s.id)                   AS sessions
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
            ) AS gs(day)
            LEFT JOIN payments p
                ON DATE(p.paid_at) = gs.day
                AND p.hotspot_id = ?
                AND p.status = 'PAID'
            LEFT JOIN sessions s
                ON DATE(s.activated_at) = gs.day
                AND s.hotspot_id = ?
            GROUP BY gs.day
            ORDER BY gs.day ASC
        """;
        return jdbc.queryForList(sql, hotspotId, hotspotId);
    }
}