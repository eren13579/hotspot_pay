package com.hotspotpay.payment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.payment.util.WebhookValidationUtil;
import com.hotspotpay.router.service.FastApiPaymentClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Paiements", description = "Gestion des paiements Mobile Money (proxy FastAPI)")
public class PaymentController {

    private final FastApiPaymentClient fastApiPaymentClient;
    private final WebhookValidationUtil webhookValidationUtil;

    // ──────────────────────────────────────────────────────────────────────
    // DASHBOARD PROPRIÉTAIRE (Proxy FastAPI)
    // ──────────────────────────────────────────────────────────────────────

    @GetMapping("/hotspots/{hotspotId}/payments")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historique des paiements d'un hotspot")
    public ResponseEntity<ApiResponse<JsonNode>> findByHotspot(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        JsonNode result = fastApiPaymentClient.listPaymentsByHotspot(userId, hotspotId);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement des paiements (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    // ──────────────────────────────────────────────────────────────────────
    // WEBHOOKS OPÉRATEURS — forward to FastAPI
    // ──────────────────────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse<JsonNode>> forwardWebhook(String operator,
                                                                   Map<String, Object> payload,
                                                                   HttpServletRequest request) {
        if (!webhookValidationUtil.isIpAllowed(request)) {
            return ResponseEntity.status(403).build();
        }
        log.info("[Webhook {}] forwarding to FastAPI payload={}", operator, payload);

        JsonNode result = fastApiPaymentClient.processWebhook(operator, payload);
        if (result == null) {
            // FastAPI unreachable — fallback to local processing
            log.warn("[Webhook {}] FastAPI unreachable, falling back to local processing", operator);
            throw AppException.internalError("FastAPI indisponible pour le webhook");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @PostMapping("/payments/mtn/webhook")
    @Operation(summary = "Webhook MTN Mobile Money")
    public ResponseEntity<ApiResponse<JsonNode>> mtnWebhook(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        return forwardWebhook("mtn", payload, request);
    }

    @PostMapping("/payments/orange/webhook")
    @Operation(summary = "Webhook Orange Money")
    public ResponseEntity<ApiResponse<JsonNode>> orangeWebhook(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        return forwardWebhook("orange", payload, request);
    }

    @PostMapping("/payments/campay/webhook")
    @Operation(summary = "Webhook Campay (MTN/Orange via Campay)")
    public ResponseEntity<ApiResponse<JsonNode>> campayWebhook(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        return forwardWebhook("campay", payload, request);
    }

    @PostMapping("/payments/moneroo/webhook")
    @Operation(summary = "Webhook Moneroo")
    public ResponseEntity<ApiResponse<JsonNode>> monerooWebhook(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        return forwardWebhook("moneroo", payload, request);
    }
}
