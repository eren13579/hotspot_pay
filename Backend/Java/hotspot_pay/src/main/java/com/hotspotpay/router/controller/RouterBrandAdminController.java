package com.hotspotpay.router.controller;

import com.hotspotpay.router.dto.RouterBrandRequest;
import com.hotspotpay.router.dto.RouterBrandResponse;
import com.hotspotpay.router.service.RouterBrandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/router-brands")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RouterBrandAdminController {

    private final RouterBrandService brandService;

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
    public ResponseEntity<RouterBrandResponse> create(@Valid @RequestBody RouterBrandRequest request) {
        RouterBrandResponse created = brandService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{slug}")
    public ResponseEntity<RouterBrandResponse> update(
            @PathVariable String slug,
            @Valid @RequestBody RouterBrandRequest request) {
        return ResponseEntity.ok(brandService.update(slug, request));
    }

    @PatchMapping("/{slug}/toggle")
    public ResponseEntity<Void> toggleActive(@PathVariable String slug) {
        brandService.toggleActive(slug);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{slug}")
    public ResponseEntity<Void> delete(@PathVariable String slug) {
        brandService.delete(slug);
        return ResponseEntity.noContent().build();
    }
}
