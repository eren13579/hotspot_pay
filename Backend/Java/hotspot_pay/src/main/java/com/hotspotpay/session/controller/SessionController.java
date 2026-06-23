package com.hotspotpay.session.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.router.service.FastApiSessionClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Sessions", description = "Gestion des sessions WiFi actives (proxy FastAPI)")
public class SessionController {

    private final FastApiSessionClient fastApiSessionClient;

    @GetMapping("/active")
    @Operation(summary = "Lister toutes les sessions actives (polling temps réel)")
    public ResponseEntity<ApiResponse<JsonNode>> listActive() {
        JsonNode result = fastApiSessionClient.listActive();
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement des sessions actives");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/hotspot/{hotspotId}")
    @Operation(summary = "Lister les sessions d'un hotspot")
    public ResponseEntity<ApiResponse<JsonNode>> findByHotspot(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        JsonNode result = fastApiSessionClient.listByHotspot(userId, hotspotId);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement des sessions (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/all")
    @Operation(summary = "Lister toutes les sessions (tous statuts, tous hotspots)")
    public ResponseEntity<ApiResponse<JsonNode>> listAll(
            @AuthenticationPrincipal String userId) {

        JsonNode result = fastApiSessionClient.listAll(userId);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement des sessions");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "Détail d'une session")
    public ResponseEntity<ApiResponse<JsonNode>> findById(
            @AuthenticationPrincipal String userId,
            @PathVariable String sessionId) {

        JsonNode result = fastApiSessionClient.getById(userId, sessionId);
        if (result == null) {
            throw AppException.notFound("Session introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @PostMapping("/{sessionId}/revoke")
    @Operation(summary = "Révoquer une session (déconnexion forcée MikroTik)")
    public ResponseEntity<ApiResponse<JsonNode>> revoke(
            @AuthenticationPrincipal String userId,
            @PathVariable String sessionId) {

        JsonNode result = fastApiSessionClient.revoke(userId, sessionId);
        if (result == null) {
            throw AppException.notFound("Session introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Supprimer définitivement une session expirée ou révoquée")
    public ResponseEntity<ApiResponse<JsonNode>> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String sessionId) {

        JsonNode result = fastApiSessionClient.delete(userId, sessionId);
        if (result == null) {
            throw AppException.notFound("Session introuvable");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }
}
