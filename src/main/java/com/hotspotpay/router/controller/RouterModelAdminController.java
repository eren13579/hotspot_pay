package com.hotspotpay.router.controller;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.router.dto.RouterModelRequest;
import com.hotspotpay.router.dto.RouterModelResponse;
import com.hotspotpay.router.service.RouterModelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/router-brands/{brandSlug}/models")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RouterModelAdminController {

    private final RouterModelService modelService;
    private final com.hotspotpay.router.service.RouterBrandService brandService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<List<RouterModelResponse>> listByBrand(@PathVariable String brandSlug) {
        var brand = brandService.findBySlug(brandSlug);
        return ResponseEntity.ok(modelService.findActiveByBrand(brand.getId()));
    }

    @PostMapping
    public ResponseEntity<RouterModelResponse> create(
            @AuthenticationPrincipal String adminId,
            @PathVariable String brandSlug,
            @Valid @RequestBody RouterModelRequest request) {
        var brand = brandService.findBySlug(brandSlug);
        request.setBrandId(brand.getId());
        RouterModelResponse created = modelService.create(request);
        auditService.log("CREATE_ROUTER_MODEL", "RouterModel", created.getId().toString(),
                "Admin " + adminId + " a créé le modèle " + request.getName() + " pour la marque " + brandSlug);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{modelId}")
    public ResponseEntity<RouterModelResponse> update(
            @AuthenticationPrincipal String adminId,
            @PathVariable UUID modelId,
            @Valid @RequestBody RouterModelRequest request) {
        var result = modelService.update(modelId, request);
        auditService.log("UPDATE_ROUTER_MODEL", "RouterModel", modelId.toString(),
                "Admin " + adminId + " a modifié le modèle " + modelId);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{modelId}/toggle")
    public ResponseEntity<Void> toggleActive(
            @AuthenticationPrincipal String adminId,
            @PathVariable UUID modelId) {
        modelService.toggleActive(modelId);
        auditService.log("TOGGLE_ROUTER_MODEL", "RouterModel", modelId.toString(),
                "Admin " + adminId + " a basculé l'état du modèle " + modelId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{modelId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String adminId,
            @PathVariable UUID modelId) {
        modelService.delete(modelId);
        auditService.log("DELETE_ROUTER_MODEL", "RouterModel", modelId.toString(),
                "Admin " + adminId + " a supprimé le modèle " + modelId);
        return ResponseEntity.noContent().build();
    }
}
