package com.hotspotpay.subscription.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class SubscriptionPlanDto {
    private String planName;
    private BigDecimal monthlyPrice;
    private BigDecimal yearlyPrice;
    private Integer maxHotspots;
    private String description;
    private boolean isPopular;
}