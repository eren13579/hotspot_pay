package com.hotspotpay.integration.campay;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** Réponse de l'endpoint /api/token/ de Campay */
@Data
public class CampayTokenResponse {

    @JsonProperty("token")
    private String token;

    @JsonProperty("expires_in")
    private Long expiresIn;
}
