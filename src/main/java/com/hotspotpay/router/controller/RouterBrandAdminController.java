package com.hotspotpay.router.controller;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.router.dto.RouterBrandRequest;
import com.hotspotpay.router.dto.RouterBrandResponse;
import com.hotspotpay.router.service.RouterBrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/router-brands")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RouterBrandAdminController {

    private final RouterBrandService brandService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<List<RouterBrandResponse>> listAll(
            @RequestParam(defaultValue = "false") boolean onlyActive) {
        List<RouterBrandResponse> brands = brandService.findAll(onlyActive);
        return ResponseEntity.ok(brands);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<RouterBrandResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(brandService.findBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<RouterBrandResponse> create(
            @AuthenticationPrincipal String adminId,
            @Valid @RequestBody RouterBrandRequest request) {
        RouterBrandResponse created = brandService.create(request);
        auditService.log("CREATE_ROUTER_BRAND", "RouterBrand", created.getSlug(),
                "Admin " + adminId + " a créé la marque " + request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{slug}")
    public ResponseEntity<RouterBrandResponse> update(
            @AuthenticationPrincipal String adminId,
            @PathVariable String slug,
            @Valid @RequestBody RouterBrandRequest request) {
        var result = brandService.update(slug, request);
        auditService.log("UPDATE_ROUTER_BRAND", "RouterBrand", slug,
                "Admin " + adminId + " a modifié la marque " + slug);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{slug}/toggle")
    public ResponseEntity<Void> toggleActive(
            @AuthenticationPrincipal String adminId,
            @PathVariable String slug) {
        brandService.toggleActive(slug);
        auditService.log("TOGGLE_ROUTER_BRAND", "RouterBrand", slug,
                "Admin " + adminId + " a basculé l'état de la marque " + slug);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{slug}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String adminId,
            @PathVariable String slug) {
        brandService.delete(slug);
        auditService.log("DELETE_ROUTER_BRAND", "RouterBrand", slug,
                "Admin " + adminId + " a supprimé la marque " + slug);
        return ResponseEntity.noContent().build();
    }
}
