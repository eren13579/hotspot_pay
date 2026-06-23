package com.hotspotpay.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFactorAuthenticateRequest {
    @NotBlank(message = "Le code TOTP est obligatoire")
    private String totpCode;

    @NotBlank(message = "Le token temporaire 2FA est obligatoire")
    private String tempToken;
}
