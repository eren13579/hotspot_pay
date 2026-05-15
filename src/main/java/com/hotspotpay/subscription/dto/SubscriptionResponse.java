package com.hotspotpay.subscription.dto;

import com.hotspotpay.subscription.enumeration.SubscriptionStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class SubscriptionResponse {
    private String subscriptionId;
    private String planName;
    private BigDecimal amount;
    private String currency;
    private SubscriptionStatus status;
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;
    private Integer daysRemaining;
    private String message;
}