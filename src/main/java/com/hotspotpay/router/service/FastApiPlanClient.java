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
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class FastApiPlanClient {

    private final RestClient restClient;

    public FastApiPlanClient(
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

    public JsonNode createPlan(String userId, String hotspotId, String name,
                                String description, Integer durationMinutes, String price,
                                String currency, Integer downloadSpeedKbps, Integer uploadSpeedKbps,
                                Integer dataLimitMb, Integer displayOrder, String hotspotProfile) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("name", name);
            if (description != null) body.put("description", description);
            body.put("duration_minutes", durationMinutes);
            body.put("price", price);
            if (currency != null) body.put("currency", currency);
            if (downloadSpeedKbps != null) body.put("download_speed_kbps", downloadSpeedKbps);
            if (uploadSpeedKbps != null) body.put("upload_speed_kbps", uploadSpeedKbps);
            if (dataLimitMb != null) body.put("data_limit_mb", dataLimitMb);
            if (displayOrder != null) body.put("display_order", displayOrder);
            if (hotspotProfile != null) body.put("hotspot_profile", hotspotProfile);

            return restClient.post()
                    .uri("/api/v1/hotspots/{hotspotId}/plans", hotspotId)
                    .header("user-id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI createPlan error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    public JsonNode listPlans(String userId, String hotspotId) {
        try {
            return restClient.get()
                    .uri("/api/v1/hotspots/{hotspotId}/plans", hotspotId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listPlans error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    public JsonNode getPlan(String userId, String hotspotId, String planId) {
        try {
            return restClient.get()
                    .uri("/api/v1/hotspots/{hotspotId}/plans/{planId}", hotspotId, planId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getPlan error planId={}: {}", planId, e.getMessage());
            return null;
        }
    }

    public JsonNode updatePlan(String userId, String hotspotId, String planId, Map<String, Object> fields) {
        try {
            return restClient.put()
                    .uri("/api/v1/hotspots/{hotspotId}/plans/{planId}", hotspotId, planId)
                    .header("user-id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(fields)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI updatePlan error planId={}: {}", planId, e.getMessage());
            return null;
        }
    }

    public JsonNode togglePlan(String userId, String hotspotId, String planId) {
        try {
            return restClient.post()
                    .uri("/api/v1/hotspots/{hotspotId}/plans/{planId}/toggle", hotspotId, planId)
                    .header("user-id", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI togglePlan error planId={}: {}", planId, e.getMessage());
            return null;
        }
    }

    public boolean deletePlan(String userId, String hotspotId, String planId) {
        try {
            restClient.delete()
                    .uri("/api/v1/hotspots/{hotspotId}/plans/{planId}", hotspotId, planId)
                    .header("user-id", userId)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            log.error("FastAPI deletePlan error planId={}: {}", planId, e.getMessage());
            return false;
        }
    }

    public JsonNode listActivePlans(String hotspotId) {
        try {
            return restClient.get()
                    .uri("/api/v1/hotspots/{hotspotId}/plans/active", hotspotId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listActivePlans error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }
}
