package com.hotspotpay.monitoring.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.monitoring.service.FastApiMonitoringClient;
import com.hotspotpay.withdrawal.service.WithdrawalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/monitoring")
@RequiredArgsConstructor
@Tag(name = "Admin Monitoring", description = "Monitoring des actions routeur - Admin uniquement")
public class AdminMonitoringController {

    private final FastApiMonitoringClient fastApiMonitoringClient;
    private final WithdrawalService withdrawalService;

    @GetMapping("/router-actions")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Monitoring des actions routeur (file d'attente, statuts, historique)")
    public ResponseEntity<ApiResponse<JsonNode>> getRouterActions(
            @RequestParam(defaultValue = "50") int limit) {
        JsonNode fastApiResponse = fastApiMonitoringClient.getRouterActions(limit);
        return ResponseEntity.ok(ApiResponse.okFromFastApi(fastApiResponse));
    }

    @GetMapping("/notifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Compter les notifications admin (retraits en attente, etc.)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotificationCounts() {
        long pendingWithdrawals = withdrawalService.countPendingWithdrawals();
        long withdrawalsToday = withdrawalService.countWithdrawalsToday();

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "pendingWithdrawals", pendingWithdrawals,
                "withdrawalsToday", withdrawalsToday,
                "notificationsTotal", pendingWithdrawals // total badge = pending withdrawals
        )));
    }
}
