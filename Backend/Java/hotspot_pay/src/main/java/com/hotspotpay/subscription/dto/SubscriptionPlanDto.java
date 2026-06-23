package com.hotspotpay.subscription.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class SubscriptionPlanDto {
    private UUID id;
    private String planName;
    private BigDecimal monthlyPrice;
    private BigDecimal yearlyPrice;
    private Integer maxHotspots;
    private String description;
    @JsonProperty("isPopular")
    private boolean isPopular;
    private Map<String, Object> advantages;
}