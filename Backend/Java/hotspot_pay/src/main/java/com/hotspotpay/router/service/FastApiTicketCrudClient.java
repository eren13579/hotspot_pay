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
        try {
            return restClient.post()
                    .uri("/api/v1/tickets/import")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI importTickets error: {}", e.getMessage());
            return null;
        }
    }

    public JsonNode listByHotspot(String hotspotId) {
        try {
            return restClient.get()
                    .uri("/api/v1/tickets?hotspot_id={hotspotId}", hotspotId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listTickets error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    public JsonNode revoke(String ticketId) {
        try {
            return restClient.post()
                    .uri("/api/v1/tickets/{ticketId}/revoke", ticketId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI revokeTicket error ticketId={}: {}", ticketId, e.getMessage());
            return null;
        }
    }

    public boolean deleteByTicketId(String ticketId) {
        try {
            restClient.delete()
                    .uri("/api/v1/tickets/{ticketId}", ticketId)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            log.error("FastAPI deleteTicket error ticketId={}: {}", ticketId, e.getMessage());
            return false;
        }
    }

    public JsonNode deleteAllByHotspot(String hotspotId) {
        try {
            return restClient.delete()
                    .uri("/api/v1/tickets?hotspot_id={hotspotId}", hotspotId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI deleteAllTickets error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    // ── Portal captif ─────────────────────────────────────────────────────

    public JsonNode portalConnect(String hotspotId, String username, String password,
                                   String mac, String phone) {
        try {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("hotspot_id", hotspotId);
            body.put("username", username);
            body.put("password", password);
            if (mac != null) body.put("mac", mac);
            if (phone != null) body.put("phone", phone);

            return restClient.post()
                    .uri("/api/v1/tickets/portal/connect")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI portalConnect error hotspotId={} user={}: {}",
                    hotspotId, username, e.getMessage());
            return null;
        }
    }

    public JsonNode getPortalTicketInfo(String hotspotId, String username) {
        try {
            return restClient.get()
                    .uri("/api/v1/tickets/portal/{hotspotId}/{username}/info",
                            hotspotId, username)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getPortalTicketInfo error hotspotId={} user={}: {}",
                    hotspotId, username, e.getMessage());
            return null;
        }
    }
}
