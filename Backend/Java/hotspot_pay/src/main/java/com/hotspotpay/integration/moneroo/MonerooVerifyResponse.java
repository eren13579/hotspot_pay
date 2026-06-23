package com.hotspotpay.integration.moneroo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MonerooVerifyResponse {

    @JsonProperty("message")
    private String message;

    @JsonProperty("data")
    private PaymentData data;

    @JsonProperty("errors")
    private Object errors;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaymentData {

        @JsonProperty("id")
        private String id;

        @JsonProperty("status")
        private String status;          // "initiated", "pending", "success", "failed", "cancelled"

        @JsonProperty("is_processed")
        private Boolean isProcessed;

        @JsonProperty("processed_at")
        private String processedAt;

        @JsonProperty("amount")
        private Long amount;

        // ✅ OBJET — pas String
        @JsonProperty("currency")
        private CurrencyInfo currency;

        @JsonProperty("amount_formatted")
        private String amountFormatted;

        @JsonProperty("description")
        private String description;

        @JsonProperty("return_url")
        private String returnUrl;

        @JsonProperty("environment")
        private String environment;

        @JsonProperty("initiated_at")
        private String initiatedAt;

        @JsonProperty("created_at")
        private String createdAt;

        // ✅ Map pour les métadonnées — contient notre référence interne
        @JsonProperty("metadata")
        private Map<String, Object> metadata;

        // ✅ Objets complexes — ignorés car pas nécessaires pour le traitement
        @JsonProperty("app")
        private Object app;

        @JsonProperty("customer")
        private Object customer;

        @JsonProperty("capture")
        private CaptureInfo capture;    // présent quand le paiement est initié côté opérateur

        @JsonProperty("link")
        private Object link;

        @JsonProperty("custom_fields_data")
        private Object customFieldsData;

        // ── Helper : extraire notre référence interne ──────────────────────
        public String extractReference() {
            if (metadata == null) return null;
            Object ref = metadata.get("reference");
            return ref != null ? ref.toString() : null;
        }
    }

    // ── Objet currency ────────────────────────────────────────────────────
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CurrencyInfo {
        @JsonProperty("name")
        private String name;

        @JsonProperty("symbol")
        private String symbol;

        @JsonProperty("code")
        private String code;             // "XAF"

        @JsonProperty("icon_url")
        private String iconUrl;
    }

    // ── Objet capture (info opérateur) ────────────────────────────────────
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CaptureInfo {
        @JsonProperty("identifier")
        private String identifier;

        @JsonProperty("failure_message")
        private String failureMessage;

        @JsonProperty("failure_error_code")
        private String failureErrorCode;

        @JsonProperty("amount")
        private Long amount;

        // ✅ Objet aussi
        @JsonProperty("currency")
        private CurrencyInfo currency;

        @JsonProperty("method")
        private Object method;

        @JsonProperty("gateway")
        private GatewayInfo gateway;

        @JsonProperty("phone_number")
        private Object phoneNumber;

        @JsonProperty("metadata")
        private Object metadata;

        @JsonProperty("context")
        private Object context;
    }

    // ── Objet gateway (statut côté opérateur) ────────────────────────────
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GatewayInfo {
        @JsonProperty("id")
        private String id;

        @JsonProperty("name")
        private String name;

        @JsonProperty("short_code")
        private String shortCode;

        @JsonProperty("transaction_id")
        private String transactionId;

        @JsonProperty("transaction_status")
        private String transactionStatus;   // "COMPLETED", "FAILED", etc.

        @JsonProperty("transaction_failure_message")
        private String transactionFailureMessage;
    }
}