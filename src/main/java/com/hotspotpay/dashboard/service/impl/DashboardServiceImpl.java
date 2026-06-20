package com.hotspotpay.dashboard.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.dashboard.dto.HotspotStatsDto;
import com.hotspotpay.dashboard.dto.OverviewDto;
import com.hotspotpay.dashboard.repository.DashboardRepository;
import com.hotspotpay.dashboard.service.DashboardService;
import com.hotspotpay.hotspot.model.Hotspot;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.session.model.Session;
import com.hotspotpay.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DashboardRepository dashboardRepository;
    private final HotspotRepository   hotspotRepository;
    private final SessionRepository   sessionRepository;

    @Override
    @Transactional(readOnly = true)
    public OverviewDto getOverview(String userId) {
        long totalPayments = dashboardRepository.totalPayments(userId);
        long paidPayments  = dashboardRepository.paymentsByStatus(userId, "PAID");
        double conversionRate = totalPayments > 0
                ? (double) paidPayments / totalPayments * 100
                : 0.0;

        Map<String, Object> topHotspot = dashboardRepository.topHotspotThisMonth(userId);

        return OverviewDto.builder()
                .totalRevenue(dashboardRepository.totalRevenue(userId))
                .revenueToday(dashboardRepository.revenueToday(userId))
                .revenueThisMonth(dashboardRepository.revenueThisMonth(userId))
                .totalSessions(dashboardRepository.totalSessions(userId))
                .activeSessions(dashboardRepository.activeSessions(userId))
                .sessionsToday(dashboardRepository.sessionsToday(userId))
                .totalPayments(totalPayments)
                .pendingPayments(dashboardRepository.paymentsByStatus(userId, "PENDING"))
                .failedPayments(dashboardRepository.paymentsByStatus(userId, "FAILED"))
                .conversionRate(round(conversionRate))
                .totalHotspots(dashboardRepository.totalHotspots(userId))
                .onlineHotspots(dashboardRepository.onlineHotspots(userId))
                .topHotspotName((String) topHotspot.get("name"))
                .topHotspotRevenue(toBigDecimal(topHotspot.get("revenue")))
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HotspotStatsDto getHotspotStats(String userId, String hotspotId) {
        Hotspot hotspot = hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));

        long totalPayments = dashboardRepository.paymentsByHotspotAndStatus(hotspotId, "PAID")
                + dashboardRepository.paymentsByHotspotAndStatus(hotspotId, "FAILED")
                + dashboardRepository.paymentsByHotspotAndStatus(hotspotId, "PENDING");
        long paidPayments  = dashboardRepository.paymentsByHotspotAndStatus(hotspotId, "PAID");
        long failedPayments= dashboardRepository.paymentsByHotspotAndStatus(hotspotId, "FAILED");

        double conversionRate = totalPayments > 0
                ? (double) paidPayments / totalPayments * 100
                : 0.0;

        Map<String, Object> topPlan     = dashboardRepository.topPlanByHotspot(hotspotId);
        String topOperator              = dashboardRepository.topOperatorByHotspot(hotspotId);
        List<Map<String, Object>> daily = dashboardRepository.dailyRevenueLast7Days(hotspotId);

        List<HotspotStatsDto.DailyRevenueDto> dailyRevenue = daily.stream()
                .map(row -> HotspotStatsDto.DailyRevenueDto.builder()
                        .date((String) row.get("date"))
                        .revenue(toBigDecimal(row.get("revenue")))
                        .sessions(toLong(row.get("sessions")))
                        .build())
                .toList();

        return HotspotStatsDto.builder()
                .hotspotId(hotspot.getHotspotId())
                .hotspotName(hotspot.getName())
                .location(hotspot.getLocation())
                .isOnline(hotspot.getIsOnline())
                .totalRevenue(dashboardRepository.revenueByHotspot(hotspotId))
                .revenueToday(dashboardRepository.revenueByHotspotToday(hotspotId))
                .revenueThisMonth(dashboardRepository.revenueByHotspotThisMonth(hotspotId))
                .totalSessions(dashboardRepository.sessionsByHotspot(hotspotId))
                .activeSessions(dashboardRepository.activeSessionsByHotspot(hotspotId))
                .totalPayments(totalPayments)
                .paidPayments(paidPayments)
                .failedPayments(failedPayments)
                .conversionRate(round(conversionRate))
                .topPlanName((String) topPlan.get("name"))
                .topPlanCount(toLong(topPlan.get("cnt")))
                .topOperator(topOperator)
                .dailyRevenue(dailyRevenue)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Session> getActiveSessions(String userId, String hotspotId, Pageable pageable) {
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));
        return sessionRepository.findAllByHotspotIdOrderByActivatedAtDesc(hotspotId, pageable);
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private double round(double value) {
        return BigDecimal.valueOf(value)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }

    private long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Long l) return l;
        if (value instanceof Number n) return n.longValue();
        return Long.parseLong(value.toString());
    }
}