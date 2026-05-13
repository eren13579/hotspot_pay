package com.hotspotpay.portal.dto;


import com.hotspotpay.payment.enumeration.PaymentOperator;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PortalPaymentResponse {
    private String reference;
    private PaymentStatus status;
    private String message;
    private BigDecimal amount;
    private String currency;
    private String priceLabel;
    private PaymentOperator operator;
    private String clientPhone;
    private String clientMac;
    // Polling interval conseillé en ms pour le frontend
    private int pollingIntervalMs;
}