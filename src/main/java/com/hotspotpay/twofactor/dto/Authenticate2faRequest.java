package com.hotspotpay.twofactor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Authenticate2faRequest {

    @NotBlank(message = "Le token temporaire est obligatoire")
    private String tempToken;

    @NotNull(message = "Le code TOTP est obligatoire")
    private Integer totpCode;
}
