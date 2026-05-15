package com.hotspotpay.plan.service.impl;

import com.hotspotpay.plan.service.PlanFeatureService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
public class PlanFeatureServiceImpl implements PlanFeatureService {

    // Configuration statique des plans (à migrer vers base de données plus tard)
    private static final Map<String, Map<String, Object>> PLAN_FEATURES = Map.of(
            "BASIC", Map.of(
                    "daily_withdrawal_limit", new BigDecimal("100.00"),
                    "monthly_withdrawal_limit", new BigDecimal("1000.00"),
                    "max_hotspots", 1,
                    "analytics_basic", true,
                    "support_email", true
            ),
            "PRO", Map.of(
                    "daily_withdrawal_limit", new BigDecimal("500.00"),
                    "monthly_withdrawal_limit", new BigDecimal("5000.00"),
                    "max_hotspots", 5,
                    "analytics_advanced", true,
                    "support_priority", true,
                    "api_access", true
            ),
            "ENTERPRISE", Map.of(
                    "daily_withdrawal_limit", new BigDecimal("2000.00"),
                    "monthly_withdrawal_limit", new BigDecimal("20000.00"),
                    "max_hotspots", 50,
                    "analytics_enterprise", true,
                    "support_dedicated", true,
                    "api_access", true,
                    "white_label", true
            )
    );

    @Override
    public BigDecimal getFeatureLimit(String planType, String featureKey) {
        Map<String, Object> features = PLAN_FEATURES.get(planType.toUpperCase());
        if (features == null) {
            log.warn("Unknown plan type: {}, defaulting to BASIC", planType);
            features = PLAN_FEATURES.get("BASIC");
        }

        Object value = features.get(featureKey);
        return value instanceof BigDecimal ? (BigDecimal) value : BigDecimal.ZERO;
    }

    @Override
    public boolean hasFeature(String planType, String featureKey) {
        Map<String, Object> features = PLAN_FEATURES.get(planType.toUpperCase());
        if (features == null) return false;

        Object value = features.get(featureKey);
        return value instanceof Boolean && (Boolean) value;
    }

    @Override
    public int getFeatureValue(String planType, String featureKey) {
        Map<String, Object> features = PLAN_FEATURES.get(planType.toUpperCase());
        if (features == null) return 0;

        Object value = features.get(featureKey);
        return value instanceof Integer ? (Integer) value : 0;
    }
}