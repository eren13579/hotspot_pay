package com.hotspotpay.payment.dto;

import com.hotspotpay.payment.enumeration.PaymentOperator;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
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
    private String gatewayTxId;

    // ✅ AJOUT — lien de paiement Moneroo (null pour MTN/Orange/CamPay)
    private String checkoutUrl;

    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}