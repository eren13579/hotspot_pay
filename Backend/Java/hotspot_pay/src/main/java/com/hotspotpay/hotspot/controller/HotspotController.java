package com.hotspotpay.hotspot.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.realtime.service.SystemSseService;
import com.hotspotpay.hotspot.dto.*;
import com.hotspotpay.router.service.FastApiClient;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Value;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * HotspotController — Proxy vers FastAPI.
 *
 * Toute la logique métier hotspot est maintenant dans le microservice FastAPI.
 * Ce controller fait uniquement le forward des requêtes HTTP vers FastAPI
 * après authentification JWT (Spring Security).
 *
 * FastAPI est la source de vérité pour les hotspots (DB: hotspot_fastapi).
 */
@RestController
@RequestMapping("/hotspots")
@RequiredArgsConstructor
@Tag(name = "Hotspots", description = "Gestion des hotspots (délégué à FastAPI)")
public class HotspotController {

    private final FastApiClient fastApiClient;
    private final SystemSseService systemSseService;

    @Value("${app.base-url:http://localhost:8080/api/V1}")
    private String appBaseUrl;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Créer un nouveau hotspot")
    public ResponseEntity<ApiResponse<JsonNode>> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateHotspotRequest request) {

        // Enrichir avec l'user_id du token JWT
        request.setUserId(userId);

        JsonNode result = fastApiClient.createHotspot(userId, request);
        if (result == null) {
            throw AppException.internalError("Erreur lors de la création du hotspot (FastAPI)");
        }

        systemSseService.broadcast("hotspot_updated", "created:" + userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.okFromFastApi(result));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister mes hotspots (admin = tous ou self)")
    public ResponseEntity<ApiResponse<Page<JsonNode>>> findAll(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20, sort = "created_at") Pageable pageable,
            @RequestParam(value = "scope", required = false) String scope) {

        int skip  = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // scope=self force le filtre par utilisateur, même pour un admin
        boolean useSelf = "self".equals(scope);
        JsonNode result = (isAdmin && !useSelf)
                ? fastApiClient.listAllHotspots(skip, limit)
                : fastApiClient.listHotspots(userId, skip, limit);
        if (result == null) {
            throw AppException.internalError("Erreur lors de la liste des hotspots (FastAPI)");
        }

        // Extraire items et total de la réponse FastAPI
        List<JsonNode> items = result.has("items")
                ? new com.fasterxml.jackson.databind.ObjectMapper().convertValue(
                        result.get("items"), new com.fasterxml.jackson.core.type.TypeReference<List<JsonNode>>() {})
                : List.of();
        int total = result.has("total") ? result.get("total").asInt(0) : items.size();

        return ResponseEntity.ok(
                ApiResponse.ok(new PageImpl<>(items, pageable, total)));
    }

    /**
     * GET /hotspots/public/{hotspotId} — Infos publiques (portail captif).
     * Accessible sans authentification.
     */
    @GetMapping("/public/{hotspotId}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Infos publiques d'un hotspot (portail captif)")
    public ResponseEntity<ApiResponse<JsonNode>> findPublic(
            @PathVariable String hotspotId) {

        JsonNode result = fastApiClient.getPublicHotspot(hotspotId);
        if (result == null) {
            throw AppException.notFound("Hotspot introuvable");
        }

        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/{hotspotId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<JsonNode>> findById(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        JsonNode result = fastApiClient.getHotspot(userId, hotspotId, isAdmin);
        if (result == null) {
            throw AppException.notFound("Hotspot introuvable ou accès non autorisé");
        }

        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @PutMapping("/{hotspotId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<JsonNode>> update(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @Valid @RequestBody UpdateHotspotRequest request) {

        JsonNode result = fastApiClient.updateHotspot(userId, hotspotId, request);
        if (result == null) {
            throw AppException.notFound("Hotspot introuvable ou accès non autorisé");
        }

        systemSseService.broadcast("hotspot_updated", "updated:" + hotspotId);

        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @DeleteMapping("/{hotspotId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean deleted = fastApiClient.deleteHotspot(userId, hotspotId, isAdmin);
        if (!deleted) {
            throw AppException.notFound("Hotspot introuvable ou accès non autorisé");
        }

        systemSseService.broadcast("hotspot_updated", "deleted:" + hotspotId);

        return ResponseEntity.ok(ApiResponse.ok("Hotspot supprimé"));
    }

    @PostMapping("/{hotspotId}/test")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Statut Pull du routeur (basé sur le dernier poll)")
    public ResponseEntity<ApiResponse<JsonNode>> testConnection(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        JsonNode result = fastApiClient.testConnection(userId, hotspotId);
        if (result == null) {
            throw AppException.notFound("Hotspot introuvable ou accès non autorisé");
        }

        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @PostMapping("/{hotspotId}/generate-token")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Générer le token + script MikroTik")
    public ResponseEntity<ApiResponse<JsonNode>> generateRouterToken(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        com.hotspotpay.router.dto.RouterTokenResponse resp =
                fastApiClient.generateRouterToken(userId, hotspotId);

        if (resp == null || !resp.isSuccess()) {
            throw AppException.internalError("Impossible de générer le token via FastAPI");
        }

        // Ajouter l'URL du portail captif à configurer dans MikroTik
        resp.setPortalUrl(
                appBaseUrl + "/portal/" + hotspotId + "?mac=$(mac-address)");

        // Convertir en JsonNode pour garder la structure FastAPI
        JsonNode data = new com.fasterxml.jackson.databind.ObjectMapper()
                .valueToTree(resp);

        return ResponseEntity.ok(ApiResponse.ok(resp.getMessage(), data));
    }

    @DeleteMapping("/{hotspotId}/router-token")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Révoquer le token routeur")
    public ResponseEntity<ApiResponse<Void>> revokeRouterToken(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        boolean revoked = fastApiClient.revokeRouterToken(userId, hotspotId);
        if (!revoked) {
            throw AppException.notFound("Hotspot introuvable ou accès non autorisé");
        }

        return ResponseEntity.ok(ApiResponse.ok("Token révoqué."));
    }
}
