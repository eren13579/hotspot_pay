package com.hotspotpay.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class HotspotStatsDto {
    private String hotspotId;
    private String hotspotName;
    private String location;
    private Boolean isOnline;

    // Revenus
    private BigDecimal totalRevenue;
    private BigDecimal revenueToday;
    private BigDecimal revenueThisMonth;

    // Sessions
    private long totalSessions;
    private long activeSessions;

    // Paiements
    private long totalPayments;
    private long paidPayments;
    private long failedPayments;
    private double conversionRate;

    // Forfait le plus vendu
    private String topPlanName;
    private long topPlanCount;

    // Opérateur le plus utilisé
    private String topOperator;

    // Revenus par jour (7 derniers jours) — pour le graphique
    private List<DailyRevenueDto> dailyRevenue;

    @Getter
    @Builder
    public static class DailyRevenueDto {
        private String date;          // "2026-05-13"
        private BigDecimal revenue;
        private long sessions;
    }
}