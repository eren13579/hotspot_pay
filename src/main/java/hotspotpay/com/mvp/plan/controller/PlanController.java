package hotspotpay.com.mvp.plan.controller;

import hotspotpay.com.mvp.common.dto.ApiResponse;
import hotspotpay.com.mvp.plan.dto.CreatePlanRequest;
import hotspotpay.com.mvp.plan.dto.PlanResponse;
import hotspotpay.com.mvp.plan.dto.UpdatePlanRequest;
import hotspotpay.com.mvp.plan.service.PlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Forfaits", description = "Gestion des forfaits WiFi par hotspot")
public class PlanController {

    private final PlanService planService;

    // ── Routes propriétaire (authentifié) ──────────────────────────────────

    @PostMapping("/hotspots/{hotspotId}/plans")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Créer un forfait sur un hotspot")
    public ResponseEntity<ApiResponse<PlanResponse>> create(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @Valid @RequestBody CreatePlanRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Forfait créé avec succès",
                        planService.create(userId, hotspotId, request)));
    }

    @GetMapping("/hotspots/{hotspotId}/plans")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister tous les forfaits d'un hotspot (actifs + inactifs)")
    public ResponseEntity<ApiResponse<List<PlanResponse>>> findAll(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {
        return ResponseEntity.ok(ApiResponse.ok(
                planService.findAll(userId, hotspotId)));
    }

    @GetMapping("/hotspots/{hotspotId}/plans/{planId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Détail d'un forfait")
    public ResponseEntity<ApiResponse<PlanResponse>> findById(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId) {
        return ResponseEntity.ok(ApiResponse.ok(
                planService.findById(userId, hotspotId, planId)));
    }

    @PutMapping("/hotspots/{hotspotId}/plans/{planId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier un forfait")
    public ResponseEntity<ApiResponse<PlanResponse>> update(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId,
            @Valid @RequestBody UpdatePlanRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Forfait mis à jour",
                planService.update(userId, hotspotId, planId, request)));
    }

    @PatchMapping("/hotspots/{hotspotId}/plans/{planId}/toggle")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Activer / Désactiver un forfait")
    public ResponseEntity<ApiResponse<Void>> toggle(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId) {
        planService.toggleActive(userId, hotspotId, planId);
        return ResponseEntity.ok(ApiResponse.ok("Statut du forfait mis à jour"));
    }

    @DeleteMapping("/hotspots/{hotspotId}/plans/{planId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer un forfait")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String planId) {
        planService.delete(userId, hotspotId, planId);
        return ResponseEntity.ok(ApiResponse.ok("Forfait supprimé"));
    }

    // ── Route publique portail captif ──────────────────────────────────────

    @GetMapping("/portal/{hotspotId}/plans")
    @Operation(summary = "Forfaits actifs d'un hotspot (portail captif — public)")
    public ResponseEntity<ApiResponse<List<PlanResponse>>> findActive(
            @PathVariable String hotspotId) {
        return ResponseEntity.ok(ApiResponse.ok(
                planService.findActive(hotspotId)));
    }
}