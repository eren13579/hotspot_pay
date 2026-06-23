package com.hotspotpay.twofactor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Disable2faRequest {

    @NotBlank(message = "Le mot de passe est obligatoire pour désactiver la 2FA")
    private String password;
}
