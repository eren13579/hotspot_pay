package com.hotspotpay.subscription.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.router.service.FastApiSubscriptionClient;
import com.hotspotpay.subscription.dto.CreateSubscriptionPlanRequest;
import com.hotspotpay.subscription.dto.SubscriptionPlanDto;
import com.hotspotpay.subscription.dto.SubscriptionResponse;
import com.hotspotpay.subscription.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Abonnements", description = "Gestion des abonnements SaaS")
public class SubscriptionController {

    private final FastApiSubscriptionClient fastApiSubscriptionClient;
    private final SubscriptionService       subscriptionService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Souscrire à un abonnement")
    public ResponseEntity<ApiResponse<JsonNode>> create(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, Object> request) {

        String planName = (String) request.getOrDefault("plan_name", "BASIC");
        int durationMonths = request.get("duration_months") instanceof Number
                ? ((Number) request.get("duration_months")).intValue() : 1;
        String currency = (String) request.getOrDefault("currency", "XAF");

        JsonNode result = fastApiSubscriptionClient.create(userId, planName, durationMonths, currency);
        if (result == null) {
            throw AppException.internalError("Erreur lors de la création de l'abonnement (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer mon abonnement actuel")
    public ResponseEntity<ApiResponse<JsonNode>> getCurrent(
            @AuthenticationPrincipal String userId) {

        JsonNode result = fastApiSubscriptionClient.getCurrent(userId);
        if (result == null) {
            throw AppException.notFound("Aucun abonnement actif trouvé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/me/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historique de mes abonnements")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getHistory(
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.findAllByUser(userId)));
    }

    @GetMapping("/plans")
    @Operation(summary = "Liste des plans d'abonnement disponibles")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDto>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getAvailablePlans()));
    }

    @PatchMapping("/admin/plans/{planId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un plan d'abonnement (prix, avantages) — proxy FastAPI")
    public ResponseEntity<ApiResponse<JsonNode>> updatePlan(
            @PathVariable String planId,
            @RequestBody Map<String, Object> updates) {

        JsonNode result = fastApiSubscriptionClient.updatePlan(planId, updates);
        if (result == null) {
            throw AppException.internalError("Erreur lors de la modification du plan (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    // ── Admin CRUD pour les plans d'abonnement (base de données locale) ──

    @GetMapping("/admin/plans")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Liste tous les plans (actifs + inactifs)")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDto>>> adminGetAllPlans() {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.adminGetAllPlans()));
    }

    @PostMapping("/admin/plans")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Créer un plan d'abonnement")
    public ResponseEntity<ApiResponse<SubscriptionPlanDto>> adminCreatePlan(
            @Valid @RequestBody CreateSubscriptionPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Plan créé avec succès",
                subscriptionService.adminCreatePlan(request)));
    }

    @PutMapping("/admin/plans/{planId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Modifier un plan d'abonnement")
    public ResponseEntity<ApiResponse<SubscriptionPlanDto>> adminUpdatePlan(
            @PathVariable UUID planId,
            @Valid @RequestBody CreateSubscriptionPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Plan modifié avec succès",
                subscriptionService.adminUpdatePlan(planId, request)));
    }

    @DeleteMapping("/admin/plans/{planId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Supprimer un plan d'abonnement")
    public ResponseEntity<ApiResponse<Void>> adminDeletePlan(
            @PathVariable UUID planId) {
        subscriptionService.adminDeletePlan(planId);
        return ResponseEntity.ok(ApiResponse.ok("Plan supprimé avec succès"));
    }

    @PatchMapping("/admin/plans/{planId}/toggle-popular")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Activer/désactiver le badge 'Populaire'")
    public ResponseEntity<ApiResponse<SubscriptionPlanDto>> adminTogglePopular(
            @PathVariable UUID planId) {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.adminTogglePopular(planId)));
    }
}
