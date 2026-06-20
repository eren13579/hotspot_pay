package com.hotspotpay.payment.dto;

import com.hotspotpay.payment.enumeration.PaymentOperator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class InitiatePaymentRequest {

    @NotBlank(message = "L'ID du hotspot est obligatoire")
    private String hotspotId;

    @NotBlank(message = "L'ID du forfait est obligatoire")
    private String planId;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(
            regexp = "^\\+?[1-9]\\d{7,14}$",
            message = "Format téléphone invalide"
    )
    private String phone;

    @NotBlank(message = "L'adresse MAC est obligatoire")
    @Pattern(
            regexp = "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$",
            message = "Format MAC invalide (ex: AA:BB:CC:DD:EE:FF)"
    )
    private String mac;

    @NotNull(message = "L'opérateur est obligatoire")
    private PaymentOperator operator;

    /** Plan name for subscription payments (e.g. "standard", "pro", "premium") */
    private String planName;
}