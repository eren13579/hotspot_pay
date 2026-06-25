package com.hotspotpay.router.service;

import com.hotspotpay.ticket.model.Ticket;
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

/**
 * Client HTTP pour appeler le microservice FastAPI lors de l'activation de tickets.
 *
 * Deux modes :
 * 1. Activation d'un ticket existant (flux portail captif ticket manuel)
 * 2. Activation directe avec credentials générés (flux paiement Mobile Money)
 */
@Slf4j
@Service
public class FastApiTicketClient {

    private final RestClient restClient;
    private final String baseUrl;
    private final String apiKey;

    public FastApiTicketClient(
            @Value("${fastapi.base-url:http://localhost:8443}") String baseUrl,
            @Value("${fastapi.api-key:change-me-to-a-strong-api-key}") String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .requestFactory(factory)
                .build();
    }

    /**
     * Active un ticket existant via FastAPI (flux portail captif ticket).
     */
    public boolean activateTicket(String hotspotId, Ticket ticket) {
        return activateTicketDirect(
                hotspotId,
                ticket.getUsername(),
                ticket.getPassword(),
                ticket.getProfile(),
                ticket.getUptimeLimit(),
                ticket.getDataLimit() != null ? ticket.getDataLimit().toString() : null,
                ticket.getComment()
        );
    }

    /**
     * Active des credentials générés directement via FastAPI (flux paiement Mobile Money).
     * Appelle POST /api/v1/tickets/activate-direct — ne nécessite pas de ticket pré-importé.
     * Appelé par PaymentServiceImpl.activateSession().
     */
    public boolean activateGeneratedCredentials(String hotspotId, String username, String password,
                                                 String profile, String timeLimit, String dataLimit,
                                                 String macAddress, String sessionId) {
        Map<String, Object> body = new HashMap<>();
        body.put("hotspot_id", hotspotId);
        body.put("username", username);
        body.put("password", password);
        body.put("profile", profile != null ? profile : "default");
        body.put("time_limit", timeLimit != null ? timeLimit : "");
        body.put("data_limit", dataLimit != null ? dataLimit : "");
        body.put("comment", "HP:" + sessionId);
        body.put("mac_address", macAddress != null ? macAddress : "");

        return FastApiRetryHelper.retryBool("activateGeneratedCredentials", () -> {
            Map<String, Object> response = restClient.post()
                    .uri("/api/v1/tickets/activate-direct")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && "activated".equals(response.get("status"))) {
                log.info("FastAPI: Credentials activés user={} hotspot={} actionId={}",
                        username, hotspotId, response.get("action_id"));
                return true;
            }

            log.warn("FastAPI: Réponse inattendue pour activation directe: {}", response);
            return false;
        });
    }

    /**
     * Envoie le POST vers FastAPI /activate (interne, utilisé par activateTicket()).
     */
    private boolean activateTicketDirect(String hotspotId, String username, String password,
                                         String profile, String timeLimit, String dataLimit,
                                         String comment) {
        Map<String, Object> body = new HashMap<>();
        body.put("hotspot_id", hotspotId);
        body.put("username", username);
        body.put("password", password);
        body.put("profile", profile != null ? profile : "default");
        body.put("time_limit", timeLimit != null ? timeLimit : "");
        body.put("data_limit", dataLimit != null ? dataLimit : "");
        body.put("comment", comment != null ? comment : "");

        return FastApiRetryHelper.retryBool("activateTicketDirect", () -> {
            Map<String, Object> response = restClient.post()
                    .uri("/api/v1/tickets/activate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && "activated".equals(response.get("status"))) {
                log.info("FastAPI: Ticket activé user={} hotspot={} actionId={}",
                        username, hotspotId, response.get("action_id"));
                return true;
            }

            log.warn("FastAPI: Réponse inattendue pour activation ticket: {}", response);
            return false;
        });
    }
}
