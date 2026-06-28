package com.hotspotpay.plan.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.plan.dto.CreatePlanRequest;
import com.hotspotpay.plan.dto.UpdatePlanRequest;
import com.hotspotpay.router.service.FastApiPlanClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Forfaits", description = "Gestion des forfaits WiFi par hotspot (proxy FastAPI)")
public class PlanController {

    private final FastApiPlanClient fastApiPlanClient;

    @PostMapping("/hotspots/{hotspotId}/plans")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Créer un forfait sur un hotspot")
    public ResponseEntity<ApiResponse<JsonNode>> create(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @Valid @RequestBody CreatePlanRequest request) {

        JsonNode result = fastApiPlanClient.createPlan(
                userId, hotspotId,
                request.getName(),
                request.getDescription(),
                request.getDurationMinutes(),
                request.getPrice() != null ? request.getPrice().toString() : "0",
                request.getCurrency(),
                request.getDownloadSpeedKbps(),
                request.getUploadSpeedKbps(),
                request.getDataLimitMb(),
                request.getDisplayOrder(),
                "default");

        if (result == null) {
            throw AppException.internalError("Erreur lors de la création du forfait (FastAPI)");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/hotspots/{hotspotId}/plans")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister tous les forfaits d'un hotspot (actifs + inactifs)")
    public ResponseEntity<ApiResponse<JsonNode>> findAll(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        JsonNode result = fastApiPlanClient.listPlans(userId, hotspotId);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement des forfaits (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/hotspots/{hotspotId}/plans/{planId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Détail d'un forfait")
    public ResponseEntity<ApiResponse<JsonNode>> findById(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId) {

        JsonNode result = fastApiPlanClient.getPlan(userId, hotspotId, planId);
        if (result == null) {
            throw AppException.notFound("Forfait introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @PutMapping("/hotspots/{hotspotId}/plans/{planId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier un forfait")
    public ResponseEntity<ApiResponse<JsonNode>> update(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId,
            @Valid @RequestBody UpdatePlanRequest request) {

        Map<String, Object> fields = new HashMap<>();
        if (request.getName() != null) fields.put("name", request.getName());
        if (request.getDescription() != null) fields.put("description", request.getDescription());
        if (request.getDurationMinutes() != null) fields.put("duration_minutes", request.getDurationMinutes());
        if (request.getPrice() != null) fields.put("price", request.getPrice().toString());
        if (request.getCurrency() != null) fields.put("currency", request.getCurrency());
        fields.put("download_speed_kbps", request.getDownloadSpeedKbps());
        fields.put("upload_speed_kbps", request.getUploadSpeedKbps());
        fields.put("data_limit_mb", request.getDataLimitMb());
        if (request.getDisplayOrder() != null) fields.put("display_order", request.getDisplayOrder());

        JsonNode result = fastApiPlanClient.updatePlan(userId, hotspotId, planId, fields);
        if (result == null) {
            throw AppException.notFound("Forfait introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @PatchMapping("/hotspots/{hotspotId}/plans/{planId}/toggle")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Activer / Désactiver un forfait")
    public ResponseEntity<ApiResponse<JsonNode>> toggle(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId) {

        JsonNode result = fastApiPlanClient.togglePlan(userId, hotspotId, planId);
        if (result == null) {
            throw AppException.notFound("Forfait introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @DeleteMapping("/hotspots/{hotspotId}/plans/{planId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer un forfait")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId) {

        boolean deleted = fastApiPlanClient.deletePlan(userId, hotspotId, planId);
        if (!deleted) {
            throw AppException.notFound("Forfait introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.ok("Forfait supprimé"));
    }

    @GetMapping("/portal/{hotspotId}/plans")
    @Operation(summary = "Forfaits actifs d'un hotspot (portail captif — public)")
    public ResponseEntity<ApiResponse<JsonNode>> findActive(
            @PathVariable String hotspotId) {

        JsonNode result = fastApiPlanClient.listActivePlans(hotspotId);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement des forfaits (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }
}
