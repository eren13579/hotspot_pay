package com.hotspotpay.withdrawal.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class WithdrawalRequest {

    @NotNull(message = "Le montant est obligatoire")
    @Positive(message = "Le montant doit être positif")
    private BigDecimal amount;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(regexp = "^\\+?[1-9]\\d{7,14}$", message = "Format téléphone invalide")
    private String recipientPhone;

    @NotBlank(message = "L'opérateur est obligatoire")
    private String operator; // MTN_MOMO, ORANGE_MONEY, CAMPAY, MONEROO
}
