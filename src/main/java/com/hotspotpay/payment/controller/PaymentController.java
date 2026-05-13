package com.hotspotpay.payment.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.dto.PaymentResponse;
import com.hotspotpay.payment.dto.PaymentStatusResponse;
import hotspotpay.com.mvp.payment.dto.*;
import com.hotspotpay.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Paiements", description = "Portail captif + webhooks Mobile Money")
public class PaymentController {

    private final PaymentService paymentService;

    // ── Portail captif (public) ────────────────────────────────────────────

    @PostMapping("/portal/payments/initiate")
    @Operation(summary = "Initier un paiement MoMo (portail captif)")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiate(
            @Valid @RequestBody InitiatePaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Demande de paiement envoyée — confirmez sur votre téléphone",
                paymentService.initiate(request)));
    }

    @GetMapping("/portal/payments/status/{reference}")
    @Operation(summary = "Vérifier le statut d'un paiement (polling portail)")
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> getStatus(
            @PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.getStatus(reference)));
    }

    // ── Webhooks opérateurs (System) ───────────────────────────────────────

    @PostMapping("/payments/mtn/webhook")
    @Operation(summary = "Webhook MTN Mobile Money")
    public ResponseEntity<Void> mtnWebhook(@RequestBody Map<String, Object> payload) {
        log.info("MTN webhook received: {}", payload);
        String reference   = (String) payload.get("externalId");
        String txId        = (String) payload.get("financialTransactionId");
        String status      = (String) payload.get("status");
        boolean success    = "SUCCESSFUL".equals(status);
        paymentService.confirmFromWebhook(reference, txId, success);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/payments/orange/webhook")
    @Operation(summary = "Webhook Orange Money")
    public ResponseEntity<Void> orangeWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Orange webhook received: {}", payload);
        String reference = (String) payload.get("order_id");
        String txId      = (String) payload.getOrDefault("txnid", "");
        String status    = (String) payload.get("status");
        boolean success  = "SUCCESS".equals(status);
        paymentService.confirmFromWebhook(reference, txId, success);
        return ResponseEntity.ok().build();
    }

    // ── Dashboard propriétaire ─────────────────────────────────────────────

    @GetMapping("/hotspots/{hotspotId}/payments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historique paiements d'un hotspot")
    public ResponseEntity<ApiResponse<Page<PaymentResponse>>> findByHotspot(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.findByHotspot(userId, hotspotId, pageable)));
    }
}