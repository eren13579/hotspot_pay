package com.hotspotpay.monitoring.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.router.service.FastApiRetryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

@Slf4j
@Service
public class FastApiMonitoringClient {

    private final RestClient restClient;

    public FastApiMonitoringClient(
            @Value("${fastapi.base-url:http://localhost:8444}") String baseUrl,
            @Value("${fastapi.api-key:change-me-to-a-strong-api-key}") String apiKey) {
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .requestFactory(factory)
                .build();
    }

    /**
     * Récupère les stats de monitoring des actions routeur depuis FastAPI.
     */
    public JsonNode getRouterActions(int limit) {
        return FastApiRetryHelper.retry("getRouterActions", () ->
            restClient.get()
                    .uri("/api/v1/admin/monitoring/router-actions?limit={limit}", limit)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }
}
