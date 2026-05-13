package com.hotspotpay.hotspot.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.hotspot.dto.CreateHotspotRequest;
import com.hotspotpay.hotspot.dto.HotspotResponse;
import com.hotspotpay.hotspot.dto.HotspotStatusResponse;
import com.hotspotpay.hotspot.dto.UpdateHotspotRequest;
import hotspotpay.com.mvp.hotspot.dto.*;
import com.hotspotpay.hotspot.service.HotspotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/hotspots")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Hotspots", description = "Gestion des routeurs MikroTik")
public class HotspotController {

    private final HotspotService hotspotService;

    @PostMapping
    @Operation(summary = "Enregistrer un nouveau routeur MikroTik")
    public ResponseEntity<ApiResponse<HotspotResponse>> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateHotspotRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Hotspot créé avec succès",
                        hotspotService.create(userId, request)));
    }

    @GetMapping
    @Operation(summary = "Lister tous mes hotspots (paginé)")
    public ResponseEntity<ApiResponse<Page<HotspotResponse>>> findAll(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                hotspotService.findAll(userId, pageable)));
    }

    @GetMapping("/{hotspotId}")
    @Operation(summary = "Détail d'un hotspot")
    public ResponseEntity<ApiResponse<HotspotResponse>> findById(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {
        return ResponseEntity.ok(ApiResponse.ok(
                hotspotService.findById(userId, hotspotId)));
    }

    @PutMapping("/{hotspotId}")
    @Operation(summary = "Modifier un hotspot")
    public ResponseEntity<ApiResponse<HotspotResponse>> update(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @Valid @RequestBody UpdateHotspotRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Hotspot mis à jour",
                hotspotService.update(userId, hotspotId, request)));
    }

    @DeleteMapping("/{hotspotId}")
    @Operation(summary = "Supprimer un hotspot")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {
        hotspotService.delete(userId, hotspotId);
        return ResponseEntity.ok(ApiResponse.ok("Hotspot supprimé"));
    }

    @PostMapping("/{hotspotId}/test")
    @Operation(summary = "Tester la connexion RouterOS API")
    public ResponseEntity<ApiResponse<HotspotStatusResponse>> testConnection(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {
        return ResponseEntity.ok(ApiResponse.ok(
                hotspotService.testConnection(userId, hotspotId)));
    }
}