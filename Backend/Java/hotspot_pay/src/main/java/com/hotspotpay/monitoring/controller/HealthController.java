package com.hotspotpay.monitoring.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.monitoring.dto.SystemHealthDto;
import com.hotspotpay.monitoring.service.HealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/health")
@RequiredArgsConstructor
@Tag(name = "Monitoring", description = "Santé du système - Admin uniquement")
public class HealthController {

    private final HealthService healthService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Vérification santé du système")
    public ResponseEntity<ApiResponse<SystemHealthDto>> health() {
        SystemHealthDto dto = healthService.check();
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}
