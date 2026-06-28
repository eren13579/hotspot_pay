package com.hotspotpay.router.service;

import com.hotspotpay.router.dto.RouterActionPayload;
import com.hotspotpay.router.enumeration.RouterActionType;
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
 * Client HTTP pour créer des actions routeur MikroTik via FastAPI.
 *
 * À la différence de FastApiTicketClient (qui gère l'activation de tickets),
 * ce client gère les actions génériques : CREATE_USER, REMOVE_USER, KICK_SESSION.
 *
 * Appelé par RouterActionService pour les révocations et expirations de sessions.
 */
@Slf4j
@Service
public class FastApiRouterActionClient {

    private final RestClient restClient;

    public FastApiRouterActionClient(
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

    /**
     * Crée une action routeur via FastAPI.
     *
     * @param hotspotId  ID du hotspot
     * @param actionType Type d'action (CREATE_USER, REMOVE_USER, KICK_SESSION)
     * @param payload    Données de l'action (username, password, etc.)
     * @param sessionId  ID de session Java (pour traçabilité dans comment)
     * @return l'action_id FastAPI ou null si échec
     */
    public String createAction(String hotspotId, RouterActionType actionType,
                                RouterActionPayload payload, String sessionId) {
        Map<String, Object> body = new HashMap<>();
        body.put("hotspot_id", hotspotId);
        body.put("action_type", actionType.name());
        body.put("username", payload.getUsername() != null ? payload.getUsername() : "");
        body.put("password", payload.getPassword() != null ? payload.getPassword() : "");
        body.put("profile", payload.getHotspotProfile() != null ? payload.getHotspotProfile() : "default");
        body.put("time_limit", payload.getTimeLimit() != null ? payload.getTimeLimit() : "");
        body.put("data_limit", payload.getDataLimit() != null ? payload.getDataLimit() : "");
        body.put("comment", payload.getComment() != null ? payload.getComment() : "HP:" + sessionId);
        body.put("mac_address", payload.getMacAddress() != null ? payload.getMacAddress() : "");

        return FastApiRetryHelper.retry("createAction", () -> {
            Map<String, Object> response = restClient.post()
                    .uri("/api/v1/router/actions/create")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response != null && "created".equals(response.get("status"))) {
                String actionId = (String) response.get("action_id");
                log.info("FastAPI: Action créée type={} user={} hotspot={} actionId={}",
                        actionType, payload.getUsername(), hotspotId, actionId);
                return actionId;
            }

            log.warn("FastAPI: Réponse inattendue pour création action: {}", response);
            return null;
        });
    }
}
