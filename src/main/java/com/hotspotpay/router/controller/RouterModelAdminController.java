package com.hotspotpay.router.controller;

import com.hotspotpay.router.dto.RouterModelRequest;
import com.hotspotpay.router.dto.RouterModelResponse;
import com.hotspotpay.router.service.RouterModelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping
    public ResponseEntity<List<RouterModelResponse>> listByBrand(@PathVariable String brandSlug) {
        var brand = brandService.findBySlug(brandSlug);
        return ResponseEntity.ok(modelService.findActiveByBrand(brand.getId()));
    }

    @PostMapping
    public ResponseEntity<RouterModelResponse> create(
            @PathVariable String brandSlug,
            @Valid @RequestBody RouterModelRequest request) {
        var brand = brandService.findBySlug(brandSlug);
        request.setBrandId(brand.getId());
        RouterModelResponse created = modelService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{modelId}")
    public ResponseEntity<RouterModelResponse> update(
            @PathVariable UUID modelId,
            @Valid @RequestBody RouterModelRequest request) {
        return ResponseEntity.ok(modelService.update(modelId, request));
    }

    @PatchMapping("/{modelId}/toggle")
    public ResponseEntity<Void> toggleActive(@PathVariable UUID modelId) {
        modelService.toggleActive(modelId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{modelId}")
    public ResponseEntity<Void> delete(@PathVariable UUID modelId) {
        modelService.delete(modelId);
        return ResponseEntity.noContent().build();
    }
}
