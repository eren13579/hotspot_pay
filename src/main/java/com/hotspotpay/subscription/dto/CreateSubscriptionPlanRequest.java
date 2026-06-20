package com.hotspotpay.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class CreateSubscriptionPlanRequest {

    @NotBlank
    private String planName;

    @NotNull
    @Positive
    private BigDecimal monthlyPrice;

    private BigDecimal yearlyPrice;

    @Positive
    private Integer maxHotspots;

    private String description;

    private boolean isPopular;

    private Map<String, Object> advantages;
}
