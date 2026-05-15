package com.hotspotpay.payment.dto;

import com.hotspotpay.payment.enumeration.PaymentOperator;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private String paymentId;
    private String reference;
    private String hotspotId;
    private String planId;
    private String clientPhone;
    private String clientMac;
    private PaymentOperator operator;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String description;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}