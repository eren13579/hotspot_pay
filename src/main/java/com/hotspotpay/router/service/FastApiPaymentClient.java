package com.hotspotpay.router.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
public class FastApiPaymentClient {

    private final RestClient restClient;

    public FastApiPaymentClient(
            @Value("${fastapi.base-url:http://localhost:8443}") String baseUrl,
            @Value("${fastapi.api-key:change-me-to-a-strong-api-key}") String apiKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .requestFactory(factory)
                .build();
    }

    public JsonNode initiatePayment(String userId, String hotspotId, String planId,
                                    String clientPhone, String clientMac, String operator, String amount) {
        try {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("hotspot_id", hotspotId);
            body.put("plan_id", planId);
            body.put("client_phone", clientPhone);
            if (clientMac != null) body.put("client_mac", clientMac);
            body.put("operator", operator);
            body.put("amount", amount);

            return restClient.post()
                    .uri("/api/v1/payments/initiate")
                    .header("user-id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI initiatePayment error: {}", e.getMessage());
            return null;
        }
    }

    public JsonNode listPaymentsByHotspot(String userId, String hotspotId) {
        try {
            return restClient.get()
                    .uri("/api/v1/payments/hotspot/{hotspotId}", hotspotId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listPaymentsByHotspot error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    public JsonNode getPayment(String userId, String paymentId) {
        try {
            return restClient.get()
                    .uri("/api/v1/payments/{paymentId}", paymentId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getPayment error paymentId={}: {}", paymentId, e.getMessage());
            return null;
        }
    }

    /**
     * Valide hotspot + plan auprès de FastAPI (source de vérité).
     * Retourne les infos du plan (price, currency, duration_minutes) si valide.
     */
    public JsonNode validateHotspotPlan(String hotspotId, String planId) {
        try {
            return restClient.get()
                    .uri("/api/v1/payments/validate-hotspot-plan/{hotspotId}/{planId}",
                            hotspotId, planId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI validateHotspotPlan error hotspotId={} planId={}: {}",
                    hotspotId, planId, e.getMessage());
            return null;
        }
    }

    public JsonNode processWebhook(String operator, Map<String, Object> payload) {
        try {
            return restClient.post()
                    .uri("/api/v1/payments/webhook/{operator}", operator)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI processWebhook error operator={}: {}", operator, e.getMessage());
            return null;
        }
    }

    /**
     * Récupère le prix d'un plan d'abonnement depuis FastAPI.
     * Utilisé par PaymentServiceImpl pour déterminer le montant des abonnements.
     */
    public JsonNode getPlanPrice(String planName) {
        try {
            return restClient.get()
                    .uri("/api/v1/admin/subscriptions/plans/{planName}", planName)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getPlanPrice error plan={}: {}", planName, e.getMessage());
            return null;
        }
    }
}
