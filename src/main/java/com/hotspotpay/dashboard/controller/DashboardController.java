package com.hotspotpay.dashboard.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.dashboard.dto.HotspotStatsDto;
import com.hotspotpay.dashboard.dto.OverviewDto;
import com.hotspotpay.dashboard.service.DashboardService;
import com.hotspotpay.session.model.Session;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Dashboard", description = "Statistiques et analytics pour le propriétaire")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    @Operation(summary = "Stats globales : revenus, sessions, conversion, hotspots")
    public ResponseEntity<ApiResponse<OverviewDto>> getOverview(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.getOverview(userId)));
    }

    @GetMapping("/hotspot/{hotspotId}")
    @Operation(summary = "Stats détaillées d'un hotspot (7 jours, top forfait, top opérateur)")
    public ResponseEntity<ApiResponse<HotspotStatsDto>> getHotspotStats(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.getHotspotStats(userId, hotspotId)));
    }

    @GetMapping("/hotspot/{hotspotId}/sessions")
    @Operation(summary = "Sessions actives et historique d'un hotspot")
    public ResponseEntity<ApiResponse<Page<Session>>> getActiveSessions(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PageableDefault(size = 20, sort = "activatedAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.getActiveSessions(userId, hotspotId, pageable)));
    }
}