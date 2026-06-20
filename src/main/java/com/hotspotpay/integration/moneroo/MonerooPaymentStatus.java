package com.hotspotpay.integration.moneroo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

/**
 * Réponse de GET /v1/payments/{id} de Moneroo.
 *
 * IMPORTANT : Utiliser /v1/payments/{id}/verify pour vérifier le statut
 * (retourne MonerooVerifyResponse qui a les métadonnées complètes).
 *
 * Statuts réels Moneroo (confirmés par MonerooVerifyResponse) :
 *   "pending"    → en attente
 *   "success"    → paiement réussi ✅   ← pas "completed"
 *   "failed"     → échec ❌
 *   "cancelled"  → annulé ❌
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MonerooPaymentStatus {

    @JsonProperty("id")
    private String id;

    /**
     * Statuts possibles: "pending", "success", "failed", "cancelled"
     * ⚠ C'est "success" (pas "completed")
     */
    @JsonProperty("status")
    private String status;

    @JsonProperty("amount")
    private Long amount;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("description")
    private String description;

    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonProperty("provider_reference")
    private String providerReference;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    // ── Helpers ──────────────────────────────────────────────────────────

    public boolean isSuccess() {
        return "success".equalsIgnoreCase(status);
    }

    public boolean isFailed() {
        return "failed".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status);
    }

    public boolean isPending() {
        return "pending".equalsIgnoreCase(status) || status == null;
    }

    /** Extrait notre référence interne depuis les métadonnées */
    public String extractReference() {
        if (metadata == null) return null;
        Object ref = metadata.get("reference");
        return ref != null ? ref.toString() : null;
    }
}
