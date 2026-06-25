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
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("hotspot_id", hotspotId);
        body.put("plan_id", planId);
        body.put("client_phone", clientPhone);
        if (clientMac != null) body.put("client_mac", clientMac);
        body.put("operator", operator);
        body.put("amount", amount);

        return FastApiRetryHelper.retry("initiatePayment", () ->
            restClient.post()
                    .uri("/api/v1/payments/initiate")
                    .header("user-id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode listPaymentsByHotspot(String userId, String hotspotId) {
        return FastApiRetryHelper.retry("listPaymentsByHotspot", () ->
            restClient.get()
                    .uri("/api/v1/payments/hotspot/{hotspotId}", hotspotId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode getPayment(String userId, String paymentId) {
        return FastApiRetryHelper.retry("getPayment", () ->
            restClient.get()
                    .uri("/api/v1/payments/{paymentId}", paymentId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode validateHotspotPlan(String hotspotId, String planId) {
        return FastApiRetryHelper.retry("validateHotspotPlan", () ->
            restClient.get()
                    .uri("/api/v1/payments/validate-hotspot-plan/{hotspotId}/{planId}",
                            hotspotId, planId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode processWebhook(String operator, Map<String, Object> payload) {
        return FastApiRetryHelper.retry("processWebhook", () ->
            restClient.post()
                    .uri("/api/v1/payments/webhook/{operator}", operator)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode getPlanPrice(String planName) {
        return FastApiRetryHelper.retry("getPlanPrice", () ->
            restClient.get()
                    .uri("/api/v1/admin/subscriptions/plans/{planName}", planName)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode refundPayment(String paymentId) {
        return FastApiRetryHelper.retry("refundPayment", () ->
            restClient.post()
                    .uri("/api/v1/payments/{paymentId}/refund", paymentId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }
}
