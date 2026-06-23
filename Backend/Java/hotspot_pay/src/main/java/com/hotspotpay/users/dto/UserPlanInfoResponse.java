package com.hotspotpay.users.dto;

import com.hotspotpay.users.role.PlanLimits;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Résumé du plan actuel de l'utilisateur avec ses limites.
 * Exposé via GET /users/me/plan-info
 */
@Getter
@Builder
public class UserPlanInfoResponse {

    private String  planType;
    private int     maxHotspots;
    private int     currentHotspots;
    private int     maxPlansPerHotspot;
    private boolean canWithdraw;
    private BigDecimal maxWithdrawalAmountXAF;
    private BigDecimal minWithdrawalAmountXAF;
    private boolean advancedAnalytics;
    private boolean prioritySupport;
    private int     dataRetentionMonths;

    /** Nombre de hotspots restants avant la limite */
    public int getRemainingHotspots() {
        if (maxHotspots == Integer.MAX_VALUE) return 999;
        return Math.max(0, maxHotspots - currentHotspots);
    }

    /** true si l'utilisateur est à la limite ou a dépassé */
    public boolean isAtHotspotLimit() {
        return currentHotspots >= maxHotspots;
    }

    public static UserPlanInfoResponse of(String planType, int currentHotspots) {
        PlanLimits limits = PlanLimits.of(planType);
        return UserPlanInfoResponse.builder()
                .planType(planType)
                .maxHotspots(limits.getMaxHotspots())
                .currentHotspots(currentHotspots)
                .maxPlansPerHotspot(limits.getMaxPlansPerHotspot())
                .canWithdraw(limits.isCanWithdraw())
                .maxWithdrawalAmountXAF(limits.getMaxWithdrawalAmountXAF())
                .minWithdrawalAmountXAF(limits.getMinWithdrawalAmountXAF())
                .advancedAnalytics(limits.isAdvancedAnalytics())
                .prioritySupport(limits.isPrioritySupport())
                .dataRetentionMonths(limits.getDataRetentionMonths())
                .build();
    }
}
