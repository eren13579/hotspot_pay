package com.hotspotpay.integration.moneroo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** Réponse de POST /v1/payments/initialize de Moneroo */
@Data
public class MonerooInitResponse {

    /** ID unique de la transaction Moneroo */
    @JsonProperty("id")
    private String id;

    /** URL de paiement à afficher ou vers laquelle rediriger */
    @JsonProperty("checkout_url")
    private String checkoutUrl;

    /** Statut initial : "pending" */
    @JsonProperty("status")
    private String status;

    /** Token de transaction (pour vérification webhook) */
    @JsonProperty("token")
    private String token;
}