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
public class FastApiTicketCrudClient {

    private final RestClient restClient;

    public FastApiTicketCrudClient(
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

    public JsonNode importTickets(Object requestBody) {
        return FastApiRetryHelper.retry("importTickets", () ->
            restClient.post()
                    .uri("/api/v1/tickets/import")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode listByHotspot(String hotspotId) {
        return FastApiRetryHelper.retry("listByHotspot", () ->
            restClient.get()
                    .uri("/api/v1/tickets?hotspot_id={hotspotId}", hotspotId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode revoke(String ticketId) {
        return FastApiRetryHelper.retry("revoke", () ->
            restClient.post()
                    .uri("/api/v1/tickets/{ticketId}/revoke", ticketId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public boolean deleteByTicketId(String ticketId) {
        return FastApiRetryHelper.retryBool("deleteByTicketId", () -> {
            restClient.delete()
                    .uri("/api/v1/tickets/{ticketId}", ticketId)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        });
    }

    public JsonNode deleteAllByHotspot(String hotspotId) {
        return FastApiRetryHelper.retry("deleteAllByHotspot", () ->
            restClient.delete()
                    .uri("/api/v1/tickets?hotspot_id={hotspotId}", hotspotId)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    // ── Portal captif ─────────────────────────────────────────────────────

    public JsonNode portalConnect(String hotspotId, String username, String password,
                                   String mac, String phone) {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("hotspot_id", hotspotId);
        body.put("username", username);
        body.put("password", password);
        if (mac != null) body.put("mac", mac);
        if (phone != null) body.put("phone", phone);

        return FastApiRetryHelper.retry("portalConnect", () ->
            restClient.post()
                    .uri("/api/v1/tickets/portal/connect")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }

    public JsonNode getPortalTicketInfo(String hotspotId, String username) {
        return FastApiRetryHelper.retry("getPortalTicketInfo", () ->
            restClient.get()
                    .uri("/api/v1/tickets/portal/{hotspotId}/{username}/info",
                            hotspotId, username)
                    .retrieve()
                    .body(JsonNode.class)
        );
    }
}
