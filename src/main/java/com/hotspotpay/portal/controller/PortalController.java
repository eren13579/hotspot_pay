package com.hotspotpay.portal.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.portal.dto.PortalPageDto;
import com.hotspotpay.portal.dto.PortalPaymentRequest;
import com.hotspotpay.portal.dto.PortalPaymentResponse;
import com.hotspotpay.portal.dto.PortalStatusResponse;
import hotspotpay.com.mvp.portal.dto.*;
import com.hotspotpay.portal.service.PortalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/portal")
@RequiredArgsConstructor
@Tag(name = "Portail Captif", description = "Endpoints publics appelés par la page HTML du portail captif MikroTik")
public class PortalController {

    private final PortalService portalService;

    /**
     * Appelé au chargement de la page portail captif.
     * MikroTik redirige vers :
     * https://saas.com/api/V1/portal/{hotspotId}?mac=AA:BB:CC:DD:EE:FF
     */
    @GetMapping("/{hotspotId}")
    @Operation(summary = "Charger la page portail — hotspot + forfaits actifs")
    public ResponseEntity<ApiResponse<PortalPageDto>> loadPage(
            @PathVariable String hotspotId,
            @RequestParam(required = false) String mac) {
        return ResponseEntity.ok(ApiResponse.ok(
                portalService.loadPage(hotspotId, mac)));
    }

    /**
     * Appelé quand le client choisit un forfait et clique sur "Payer".
     */
    @PostMapping("/pay")
    @Operation(summary = "Initier un paiement Mobile Money depuis le portail captif")
    public ResponseEntity<ApiResponse<PortalPaymentResponse>> pay(
            @Valid @RequestBody PortalPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Demande envoyée — confirmez sur votre téléphone",
                portalService.pay(request)));
    }

    /**
     * Polling de statut — appelé toutes les 5s par le JS du portail captif.
     * Quand wifiActivated = true → le frontend redirige le client vers internet.
     */
    @GetMapping("/payment/{reference}/status")
    @Operation(summary = "Vérifier le statut du paiement (polling 5s)")
    public ResponseEntity<ApiResponse<PortalStatusResponse>> checkStatus(
            @PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.ok(
                portalService.checkStatus(reference)));
    }
}