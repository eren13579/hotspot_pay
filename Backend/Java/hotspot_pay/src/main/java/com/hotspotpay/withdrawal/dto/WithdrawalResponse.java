package com.hotspotpay.withdrawal.dto;

import com.hotspotpay.withdrawal.enumeration.WithdrawalStatus;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class WithdrawalResponse {
    private String           withdrawalId;
    private BigDecimal       amount;
    private String           currency;
    private String           recipientPhone;
    private String           operator;
    private WithdrawalStatus status;
    private String           gatewayRef;
    private String           userId;
    private String           failureReason;
    private LocalDateTime    processedAt;
    private LocalDateTime    createdAt;
    private String           message;
}
