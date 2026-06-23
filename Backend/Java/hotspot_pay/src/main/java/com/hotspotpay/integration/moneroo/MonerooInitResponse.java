package com.hotspotpay.integration.moneroo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MonerooInitResponse {

    // ✅ Moneroo retourne "message" pas "success"
    // La vraie structure est : { "message": "Transaction initialized successfully", "data": {...} }
    @JsonProperty("message")
    private String message;

    @JsonProperty("data")
    private PaymentData data;

    // ✅ Le succès se détecte par la PRÉSENCE de data.id, pas par un champ "success"
    public boolean isSuccess() {
        return data != null && data.getId() != null;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaymentData {

        @JsonProperty("id")
        private String id;

        @JsonProperty("checkout_url")
        private String checkoutUrl;

        @JsonProperty("status")
        private String status;

        @JsonProperty("amount")
        private Long amount;

        @JsonProperty("currency")
        private String currency;
    }
}