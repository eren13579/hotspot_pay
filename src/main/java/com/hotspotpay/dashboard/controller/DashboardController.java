package com.hotspotpay.dashboard.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.dashboard.dto.CountsDto;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.plan.repository.PlanRepository;
import com.hotspotpay.router.service.FastApiDashboardClient;
import com.hotspotpay.ticket.repository.TicketRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Dashboard", description = "Statistiques et analytics (proxy FastAPI)")
public class DashboardController {

    private final FastApiDashboardClient fastApiDashboardClient;
    private final HotspotRepository hotspotRepository;
    private final TicketRepository ticketRepository;
    private final PlanRepository planRepository;

    @GetMapping("/overview")
    @Operation(summary = "Stats globales : revenus, sessions, hotspots")
    public ResponseEntity<ApiResponse<JsonNode>> getOverview(
            @AuthenticationPrincipal String userId) {
        JsonNode result = fastApiDashboardClient.getOverview(userId, null, null);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement du dashboard (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/hotspot/{hotspotId}")
    @Operation(summary = "Stats détaillées d'un hotspot")
    public ResponseEntity<ApiResponse<JsonNode>> getHotspotStats(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        JsonNode result = fastApiDashboardClient.getHotspotStats(userId, hotspotId, isAdmin);
        if (result == null) {
            throw AppException.notFound("Hotspot introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/admin/overview")
    @Operation(summary = "Dashboard admin global (tous les utilisateurs)")
    public ResponseEntity<ApiResponse<JsonNode>> getAdminOverview() {
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw AppException.forbidden("Accès réservé aux administrateurs");
        }
        JsonNode result = fastApiDashboardClient.getAdminOverview(null, null);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement du dashboard admin (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/counts")
    @Operation(summary = "Compteurs : hotspots, tickets, forfaits")
    public ResponseEntity<ApiResponse<CountsDto>> getCounts(
            @AuthenticationPrincipal String userId) {
        long hotspots = hotspotRepository.countByUserId(userId);
        long tickets = ticketRepository.countByUserId(userId);
        long plans = planRepository.countByHotspotId("ALL");
        // Fallback : compter les plans de tous les hotspots de l'utilisateur
        if (plans == 0) {
            plans = hotspotRepository.findByUserId(userId)
                    .stream()
                    .mapToLong(h -> planRepository.countByHotspotId(h.getHotspotId()))
                    .sum();
        }
        return ResponseEntity.ok(ApiResponse.ok(
                CountsDto.builder()
                        .hotspotCount(hotspots)
                        .ticketCount(tickets)
                        .planCount(plans)
                        .build()));
    }
}
