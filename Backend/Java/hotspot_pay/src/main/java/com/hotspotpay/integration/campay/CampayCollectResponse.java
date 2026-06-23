package com.hotspotpay.integration.campay;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** Réponse de l'endpoint POST /api/collect/ de Campay */
@Data
public class CampayCollectResponse {

    /** Référence unique générée par Campay (à stocker comme gatewayTxId) */
    @JsonProperty("reference")
    private String reference;

    /** ussd_code retourné (affiché à l'utilisateur sur certaines intégrations) */
    @JsonProperty("ussd_code")
    private String ussdCode;

    /** Opérateur détecté par Campay (ex: "MTN", "ORANGE") */
    @JsonProperty("operator")
    private String operator;

    /** Message de statut */
    @JsonProperty("message")
    private String message;
}
