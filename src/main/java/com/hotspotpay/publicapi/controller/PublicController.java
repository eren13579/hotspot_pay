package com.hotspotpay.publicapi.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.publicapi.dto.PublicSettingsResponse;
import com.hotspotpay.publicapi.service.PublicSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Tag(name = "Public — Paramètres", description = "Paramètres système accessibles sans authentification")
public class PublicController {

    private final PublicSettingsService publicSettingsService;

    @GetMapping("/settings")
    @Operation(summary = "Lire les paramètres publics (branding, general, about)")
    public ResponseEntity<ApiResponse<PublicSettingsResponse>> getSettings() {
        return ResponseEntity.ok(ApiResponse.ok(publicSettingsService.getSettings()));
    }
}
