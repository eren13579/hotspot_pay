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

@Slf4j
@Service
public class FastApiSessionClient {

    private final RestClient restClient;

    public FastApiSessionClient(
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

    public JsonNode listByHotspot(String userId, String hotspotId) {
        try {
            return restClient.get()
                    .uri("/api/v1/sessions/hotspot/{hotspotId}", hotspotId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listSessions error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    public JsonNode getById(String userId, String sessionId) {
        try {
            return restClient.get()
                    .uri("/api/v1/sessions/{sessionId}", sessionId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getSession error sessionId={}: {}", sessionId, e.getMessage());
            return null;
        }
    }

    public JsonNode listActive() {
        try {
            return restClient.get()
                    .uri("/api/v1/sessions/active")
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listActiveSessions error: {}", e.getMessage());
            return null;
        }
    }

    public JsonNode listAll(String userId) {
        try {
            return restClient.get()
                    .uri("/api/v1/sessions/all")
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listAllSessions error: {}", e.getMessage());
            return null;
        }
    }

    public JsonNode revoke(String userId, String sessionId) {
        try {
            return restClient.post()
                    .uri("/api/v1/sessions/{sessionId}/revoke", sessionId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI revokeSession error sessionId={}: {}", sessionId, e.getMessage());
            return null;
        }
    }

    public JsonNode delete(String userId, String sessionId) {
        try {
            return restClient.delete()
                    .uri("/api/v1/sessions/{sessionId}", sessionId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI deleteSession error sessionId={}: {}", sessionId, e.getMessage());
            return null;
        }
    }
}
