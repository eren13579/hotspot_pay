package com.hotspotpay.integration.moneroo;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** Réponse de GET /v1/payments/{id} de Moneroo */
@Data
public class MonerooPaymentStatus {

    @JsonProperty("id")
    private String id;

    /**
     * Statuts possibles Moneroo :
     *   "pending"    → en attente
     *   "completed"  → paiement réussi
     *   "failed"     → échec
     *   "cancelled"  → annulé
     */
    @JsonProperty("status")
    private String status;

    @JsonProperty("amount")
    private Long amount;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("reference")
    private String reference;

    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonProperty("provider_reference")
    private String providerReference;
}