package com.hotspotpay.payment.dto;

import com.hotspotpay.payment.enumeration.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentStatusResponse {
    private String reference;
    private PaymentStatus status;
    private String gatewayTxId;
    private String failureReason;
    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
}