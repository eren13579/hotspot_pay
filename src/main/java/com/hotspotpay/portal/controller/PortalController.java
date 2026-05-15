package com.hotspotpay.portal.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.portal.dto.PortalPageDto;
import com.hotspotpay.portal.dto.PortalPaymentRequest;
import com.hotspotpay.portal.dto.PortalPaymentResponse;
import com.hotspotpay.portal.dto.PortalStatusResponse;
import com.hotspotpay.portal.service.PortalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/portal")
@RequiredArgsConstructor
@Tag(name = "Portail Captif", description = "Endpoints MikroTik Publics")
public class PortalController {

    private final PortalService portalService;

    @GetMapping("/{hotspotId}")
    @Operation(summary = "Charger page portail captif")
    public ResponseEntity<ApiResponse<PortalPageDto>> loadPage(
            @PathVariable String hotspotId,
            @RequestParam(required = false) String mac) {
        return ResponseEntity.ok(ApiResponse.ok(portalService.loadPage(hotspotId, mac)));
    }

    @PostMapping("/pay")
    @Operation(summary = "Payer un forfait")
    public ResponseEntity<ApiResponse<PortalPaymentResponse>> pay(
            @Valid @RequestBody PortalPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(portalService.pay(request)));
    }

    @GetMapping("/payment/{reference}/status")
    @Operation(summary = "Vérifier statut (polling)")
    public ResponseEntity<ApiResponse<PortalStatusResponse>> checkStatus(
            @PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.ok(portalService.checkStatus(reference)));
    }
}