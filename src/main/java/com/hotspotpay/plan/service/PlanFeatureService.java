package com.hotspotpay.plan.service;

import java.math.BigDecimal;

public interface PlanFeatureService {
    BigDecimal getFeatureLimit(String planType, String featureKey);
    boolean hasFeature(String planType, String featureKey);
    int getFeatureValue(String planType, String featureKey);
}