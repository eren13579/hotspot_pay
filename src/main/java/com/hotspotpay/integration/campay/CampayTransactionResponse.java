package com.hotspotpay.integration.campay;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** Réponse de l'endpoint GET /api/transaction/{ref}/ de Campay */
@Data
public class CampayTransactionResponse {

    @JsonProperty("reference")
    private String reference;

    /**
     * Statut possible : "SUCCESSFUL", "FAILED", "PENDING"
     */
    @JsonProperty("status")
    private String status;

    @JsonProperty("amount")
    private String amount;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("operator")
    private String operator;

    @JsonProperty("code")
    private String code;

    @JsonProperty("operator_reference")
    private String operatorReference;
}