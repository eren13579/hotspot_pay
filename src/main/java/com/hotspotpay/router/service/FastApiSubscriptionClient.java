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
public class FastApiSubscriptionClient {

    private final RestClient restClient;

    public FastApiSubscriptionClient(
            @Value("${fastapi.base-url:http://localhost:8443}") String baseUrl,
            @Value("${fastapi.api-key:change-me-to-a-strong-api-key}") String apiKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .requestFactory(factory)
                .build();
    }

    public JsonNode getCurrent(String userId) {
        try {
            return restClient.get()
                    .uri("/api/v1/subscriptions/me?user_id={userId}", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getCurrentSubscription error: {}", e.getMessage());
            return null;
        }
    }

    public JsonNode create(String userId, String planName, int durationMonths, String currency) {
        try {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("plan_name", planName);
            body.put("duration_months", durationMonths);
            body.put("currency", currency);

            return restClient.post()
                    .uri("/api/v1/subscriptions?user_id={userId}", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI createSubscription error: {}", e.getMessage());
            return null;
        }
    }

    public JsonNode listPlans() {
        try {
            return restClient.get()
                    .uri("/api/v1/subscriptions/plans")
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listSubscriptionPlans error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Récupère un plan d'abonnement par son nom (standard, pro, premium).
     * Utilise l'endpoint admin (read-only) qui ne nécessite pas de user-id.
     */
    public JsonNode getPlanByPlanName(String planName) {
        try {
            return restClient.get()
                    .uri("/api/v1/admin/subscriptions/plans/{planName}", planName)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getPlanByPlanName error plan={}: {}", planName, e.getMessage());
            return null;
        }
    }

    /**
     * Met à jour un plan d'abonnement (prix, avantages).
     * Réservé aux administrateurs.
     */
    public JsonNode updatePlan(String planName, Map<String, Object> updates) {
        try {
            return restClient.patch()
                    .uri("/api/v1/admin/subscriptions/plans/{planName}", planName)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(updates)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI updatePlan error plan={}: {}", planName, e.getMessage());
            return null;
        }
    }
}
