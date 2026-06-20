package com.hotspotpay.integration.moneroo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MonerooWebhookEvent {

    @JsonProperty("event")
    private String event;   // "payment.success", "payment.failed", "payment.cancelled"

    @JsonProperty("data")
    private PaymentData data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaymentData {

        @JsonProperty("id")
        private String id;

        @JsonProperty("status")
        private String status;

        @JsonProperty("amount")
        private Long amount;

        // ✅ Objet, pas String
        @JsonProperty("currency")
        private MonerooVerifyResponse.CurrencyInfo currency;

        @JsonProperty("metadata")
        private Map<String, Object> metadata;

        @JsonProperty("capture")
        private Object capture;

        @JsonProperty("customer")
        private Object customer;

        @JsonProperty("app")
        private Object app;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    public boolean isPaymentSuccess() {
        return "payment.success".equals(event);
    }

    public boolean isPaymentFailed() {
        return "payment.failed".equals(event) || "payment.cancelled".equals(event);
    }

    /**
     * Extrait la référence interne depuis les metadata Moneroo.
     * Vérifie plusieurs clés possibles : "reference", "ref", "order_id".
     * Log un avertissement si aucune référence n'est trouvée.
     */
    public String extractReference() {
        if (data == null || data.getMetadata() == null) {
            log.error("MonerooWebhook: metadata null — impossible d'extraire la référence interne. event={}", event);
            return null;
        }
        Map<String, Object> metadata = data.getMetadata();
        // Essayer plusieurs clés possibles
        String[] possibleKeys = {"reference", "ref", "order_id"};
        for (String key : possibleKeys) {
            Object ref = metadata.get(key);
            if (ref != null && !ref.toString().isBlank()) {
                return ref.toString();
            }
        }
        log.error("MonerooWebhook: aucune référence interne trouvée dans metadata. event={}, metadataKeys={}",
                event, metadata.keySet());
        return null;
    }
}