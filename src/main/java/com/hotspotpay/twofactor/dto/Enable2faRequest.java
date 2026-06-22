package com.hotspotpay.twofactor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Enable2faRequest {

    @NotBlank(message = "Le secret est obligatoire")
    private String secret;

    @NotNull(message = "Le code de vérification est obligatoire")
    private Integer totpCode;
}
