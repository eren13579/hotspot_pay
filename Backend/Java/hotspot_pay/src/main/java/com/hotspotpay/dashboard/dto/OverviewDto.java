package com.hotspotpay.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class OverviewDto {
    // Revenus
    private BigDecimal totalRevenue;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisMonth;

    // Sessions
    private long totalSessions;
    private long activeSessions;
    private long sessionsToday;

    // Paiements
    private long totalPayments;
    private long pendingPayments;
    private long failedPayments;
    private double conversionRate;    // % paiements PAID / total initiés

    // Hotspots
    private long totalHotspots;
    private long onlineHotspots;

    // Meilleur hotspot du mois
    private String topHotspotName;
    private BigDecimal topHotspotRevenue;

    private LocalDateTime generatedAt;
}