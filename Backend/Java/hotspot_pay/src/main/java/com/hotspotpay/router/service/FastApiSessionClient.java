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
        return FastApiRetryHelper.retry("listByHotspot", () ->
            restClient.get()
                    .uri("/api/v1/sessions/hotspot/{hotspotId}", hotspotId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode getById(String userId, String sessionId) {
        return FastApiRetryHelper.retry("getById", () ->
            restClient.get()
                    .uri("/api/v1/sessions/{sessionId}", sessionId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode listActive() {
        return FastApiRetryHelper.retry("listActive", () ->
            restClient.get()
                    .uri("/api/v1/sessions/active")
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode listAll(String userId) {
        return FastApiRetryHelper.retry("listAll", () ->
            restClient.get()
                    .uri("/api/v1/sessions/all")
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode revoke(String userId, String sessionId) {
        return FastApiRetryHelper.retry("revoke", () ->
            restClient.post()
                    .uri("/api/v1/sessions/{sessionId}/revoke", sessionId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode delete(String userId, String sessionId) {
        return FastApiRetryHelper.retry("delete", () ->
            restClient.delete()
                    .uri("/api/v1/sessions/{sessionId}", sessionId)
                    .header("user-id", userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }
}
