package com.hotspotpay.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFactorCodeRequest {
    @NotBlank(message = "Le code TOTP est obligatoire")
    @JsonProperty("totpCode")
    private String code;

    // Optionnel : secret envoyé par le frontend lors de l'activation
    private String secret;
}
