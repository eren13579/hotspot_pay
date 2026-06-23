package com.hotspotpay.router.controller;

import com.hotspotpay.router.dto.RouterBrandResponse;
import com.hotspotpay.router.service.RouterBrandService;
import com.hotspotpay.router.service.RouterModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/router-brands", "/router/brands"})
@RequiredArgsConstructor
public class RouterBrandPublicController {

    private final RouterBrandService brandService;
    private final RouterModelService modelService;

    @GetMapping
    public ResponseEntity<List<RouterBrandResponse>> listActiveBrands() {
        return ResponseEntity.ok(brandService.findAll(true));
    }

    @GetMapping("/{slug}/models")
    public ResponseEntity<?> listModelsByBrand(@PathVariable String slug) {
        var brand = brandService.findBySlug(slug);
        return ResponseEntity.ok(modelService.findActiveByBrand(brand.getId()));
    }
}
