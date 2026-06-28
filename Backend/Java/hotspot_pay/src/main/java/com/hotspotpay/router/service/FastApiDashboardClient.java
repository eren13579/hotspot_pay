package com.hotspotpay.router.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

@Slf4j
@Service
public class FastApiDashboardClient {

    private final RestClient restClient;

    public FastApiDashboardClient(
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

    public JsonNode getOverview(String userId, String startDate, String endDate) {
        String url = "/api/v1/dashboard/overview?user_id={userId}";
        if (startDate != null && !startDate.isBlank()) url += "&start_date=" + startDate;
        if (endDate != null && !endDate.isBlank()) url += "&end_date=" + endDate;
        String finalUrl = url;
        return FastApiRetryHelper.retry("getOverview", () ->
            restClient.get()
                    .uri(finalUrl, userId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode getAdminOverview(String startDate, String endDate) {
        String url = "/api/v1/dashboard/admin/overview";
        if (startDate != null && !startDate.isBlank()) url += "?start_date=" + startDate;
        if (endDate != null && !endDate.isBlank()) url += "&end_date=" + endDate;
        String finalUrl = url;
        return FastApiRetryHelper.retry("getAdminOverview", () ->
            restClient.get()
                    .uri(finalUrl)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode getHotspotStats(String userId, String hotspotId, boolean adminOverride) {
        return FastApiRetryHelper.retry("getHotspotStats", () ->
            restClient.get()
                    .uri("/api/v1/dashboard/hotspot/{hotspotId}?user_id={userId}&admin_override={adminOverride}",
                         hotspotId, userId, adminOverride)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }
}
