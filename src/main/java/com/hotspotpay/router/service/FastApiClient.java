package com.hotspotpay.router.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.hotspot.dto.*;
import com.hotspotpay.router.dto.RouterTokenResponse;
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
 * Client HTTP vers le microservice FastAPI — Gestion Hotspot.
 *
 * FastAPI est dorénavant la source de vérité pour toute la logique hotspot.
 * Ce client forward les requêtes Java → FastAPI pour les opérations CRUD hotspot.
 *
 * Endpoints couvert :
 *   POST   /api/v1/hotspots                     → créer
 *   GET    /api/v1/hotspots?user_id=            → lister
 *   GET    /api/v1/hotspots/{id}?user_id=       → détail
 *   PUT    /api/v1/hotspots/{id}?user_id=       → modifier
 *   DELETE /api/v1/hotspots/{id}?user_id=       → supprimer
 *   POST   /api/v1/hotspots/{id}/test?user_id=  → tester connexion
 *   POST   /api/v1/hotspots/{id}/generate-token?user_id= → générer token
 *   DELETE /api/v1/hotspots/{id}/router-token?user_id=   → révoquer token
 */
@Slf4j
@Service
public class FastApiClient {

    private final RestClient  restClient;
    private final String      baseUrl;
    private final String      apiKey;

    public FastApiClient(
            @Value("${fastapi.base-url:http://localhost:8443}") String baseUrl,
            @Value("${fastapi.api-key:change-me-to-a-strong-api-key}") String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey  = apiKey;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .requestFactory(factory)
                .build();
    }

    // ── CRUD Hotspot ───────────────────────────────────────────────────

    /**
     * POST /api/v1/hotspots — Créer un hotspot.
     */
    public JsonNode createHotspot(String userId, CreateHotspotRequest request) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("user_id", userId);
            body.put("name", request.getName());
            if (request.getLocation() != null) body.put("location", request.getLocation());
            body.put("mikrotik_ip", request.getMikrotikIp());
            body.put("mikrotik_port", request.getMikrotikPort() != null ? request.getMikrotikPort() : 8728);
            body.put("mikrotik_user", request.getMikrotikUser());
            body.put("mikrotik_password", request.getMikrotikPassword());
            body.put("hotspot_profile", request.getHotspotProfile() != null ? request.getHotspotProfile() : "default");
            if (request.getRouterBrand() != null) body.put("router_brand", request.getRouterBrand());
            if (request.getRouterType() != null) body.put("router_type", request.getRouterType());
            if (request.getModelId() != null) body.put("model_id", request.getModelId());
            return restClient.post()
                    .uri("/api/v1/hotspots?user_id={userId}", userId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI createHotspot error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * GET /api/v1/hotspots?user_id= — Lister les hotspots paginés.
     */
    public JsonNode listHotspots(String userId, int skip, int limit) {
        try {
            return restClient.get()
                    .uri(b -> b.path("/api/v1/hotspots")
                            .queryParam("user_id", userId)
                            .queryParam("skip", skip)
                            .queryParam("limit", limit)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listHotspots error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * GET /api/v1/hotspots/public/{hotspotId} — Infos publiques (portail captif).
     */
    public JsonNode getPublicHotspot(String hotspotId) {
        try {
            return restClient.get()
                    .uri("/api/v1/hotspots/public/{hotspotId}", hotspotId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getPublicHotspot error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * GET /api/v1/hotspots/all?skip=&limit= — Lister TOUS les hotspots (admin).
     */
    public JsonNode listAllHotspots(int skip, int limit) {
        try {
            return restClient.get()
                    .uri(b -> b.path("/api/v1/hotspots/all")
                            .queryParam("skip", skip)
                            .queryParam("limit", limit)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI listAllHotspots error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * GET /api/v1/hotspots/{hotspotId}?user_id=&admin_override= — Détail d'un hotspot.
     */
    public JsonNode getHotspot(String userId, String hotspotId, boolean adminOverride) {
        try {
            return restClient.get()
                    .uri(b -> b.path("/api/v1/hotspots/{hotspotId}")
                            .queryParam("user_id", userId)
                            .queryParam("admin_override", adminOverride)
                            .build(hotspotId))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getHotspot error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * PUT /api/v1/hotspots/{hotspotId}?user_id= — Modifier un hotspot.
     */
    public JsonNode updateHotspot(String userId, String hotspotId, UpdateHotspotRequest request) {
        try {
            return restClient.put()
                    .uri(b -> b.path("/api/v1/hotspots/{hotspotId}")
                            .queryParam("user_id", userId)
                            .build(hotspotId))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI updateHotspot error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * DELETE /api/v1/hotspots/{hotspotId}?user_id=&admin_override= — Supprimer un hotspot.
     */
    public boolean deleteHotspot(String userId, String hotspotId, boolean adminOverride) {
        try {
            restClient.delete()
                    .uri(b -> b.path("/api/v1/hotspots/{hotspotId}")
                            .queryParam("user_id", userId)
                            .queryParam("admin_override", adminOverride)
                            .build(hotspotId))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            log.error("FastAPI deleteHotspot error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * POST /api/v1/hotspots/{hotspotId}/test?user_id= — Tester connexion (statut Pull).
     */
    public JsonNode testConnection(String userId, String hotspotId) {
        try {
            return restClient.post()
                    .uri(b -> b.path("/api/v1/hotspots/{hotspotId}/test")
                            .queryParam("user_id", userId)
                            .build(hotspotId))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI testConnection error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * POST /api/v1/hotspots/{hotspotId}/generate-token?user_id=
     * Générer un token + script MikroTik.
     */
    public RouterTokenResponse generateRouterToken(String userId, String hotspotId) {
        try {
            return restClient.post()
                    .uri(b -> b.path("/api/v1/hotspots/{hotspotId}/generate-token")
                            .queryParam("user_id", userId)
                            .build(hotspotId))
                    .retrieve()
                    .body(RouterTokenResponse.class);
        } catch (RestClientException e) {
            log.error("FastAPI generateToken error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    /**
     * GET /api/v1/hotspots/{hotspotId}/plans/active — Forfaits actifs publics (portail captif).
     */
    public JsonNode getPublicActivePlans(String hotspotId) {
        try {
            return restClient.get()
                    .uri("/api/v1/hotspots/{hotspotId}/plans/active", hotspotId)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            log.error("FastAPI getPublicActivePlans error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * GET /api/v1/hotspots/{hotspotId}/download-script?token=&brand=&format=
     * Télécharger le script routeur pré-configuré (retourne le contenu texte).
     */
    public String downloadRouterScript(String hotspotId, String token, String brand, String format) {
        try {
            return restClient.get()
                    .uri(b -> b.path("/api/v1/hotspots/{hotspotId}/download-script")
                            .queryParam("token", token)
                            .queryParam("brand", brand)
                            .queryParam("format", format)
                            .build(hotspotId))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException e) {
            log.error("FastAPI downloadScript error hotspotId={}: {}", hotspotId, e.getMessage());
            return null;
        }
    }

    /**
     * DELETE /api/v1/hotspots/{hotspotId}/router-token?user_id=
     * Révoquer le token routeur.
     */
    public boolean revokeRouterToken(String userId, String hotspotId) {
        try {
            restClient.delete()
                    .uri(b -> b.path("/api/v1/hotspots/{hotspotId}/router-token")
                            .queryParam("user_id", userId)
                            .build(hotspotId))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            log.error("FastAPI revokeToken error hotspotId={}: {}", hotspotId, e.getMessage());
            return false;
        }
    }
}
