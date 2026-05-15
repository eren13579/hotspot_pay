package com.hotspotpay.subscription.dto;

import com.hotspotpay.payment.enumeration.PaymentOperator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSubscriptionRequest {

    @NotBlank
    private String planName; // BASIC, PRO, ENTERPRISE

    @NotNull
    private Integer durationMonths; // 1 ou 12

    @NotNull
    private PaymentOperator operator;

    private String phone;
}