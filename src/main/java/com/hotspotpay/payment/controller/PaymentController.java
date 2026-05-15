package com.hotspotpay.payment.controller;

import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.dto.PaymentResponse;
import com.hotspotpay.payment.dto.PaymentStatusResponse;
import com.hotspotpay.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ✅ Initier un paiement (protégé JWT)
    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiate(
            @Valid @RequestBody InitiatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.initiate(request));
    }

    // ✅ Vérifier le statut d'un paiement
    @GetMapping("/{reference}/status")
    public ResponseEntity<PaymentStatusResponse> getStatus(@PathVariable String reference) {
        return ResponseEntity.ok(paymentService.getStatus(reference));
    }

    // ✅ Lister les paiements d'un hotspot (protégé JWT)
    @GetMapping("/hotspot/{hotspotId}")
    public ResponseEntity<Page<PaymentResponse>> findByHotspot(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String hotspotId,
            Pageable pageable) {
        return ResponseEntity.ok(
                paymentService.findByHotspot(userDetails.getUsername(), hotspotId, pageable)
        );
    }

    // ✅ Webhook MTN MoMo — PUBLIC (pas de JWT)
    @PostMapping("/webhook/mtn")
    public ResponseEntity<Void> webhookMtn(@RequestBody Map<String, Object> payload) {
        log.info("📨 MTN Webhook received: {}", payload);
        String reference    = (String) payload.get("externalId");
        String gatewayTxId  = (String) payload.get("financialTransactionId");
        String eventId      = (String) payload.getOrDefault("referenceId", gatewayTxId);
        String status       = (String) payload.get("status");

        if ("SUCCESSFUL".equalsIgnoreCase(status)) {
            paymentService.confirmFromWebhook(reference, gatewayTxId, eventId, "MTN_MOMO", true);
        } else {
            paymentService.confirmFromWebhook(reference, gatewayTxId, eventId, "MTN_MOMO", false);
        }
        return ResponseEntity.ok().build();
    }

    // ✅ Webhook Orange Money — PUBLIC
    @PostMapping("/webhook/orange")
    public ResponseEntity<Void> webhookOrange(@RequestBody Map<String, Object> payload) {
        log.info("📨 Orange Webhook received: {}", payload);
        String reference   = (String) payload.get("order_id");
        String gatewayTxId = (String) payload.get("txnid");
        String eventId     = (String) payload.getOrDefault("notif_token", gatewayTxId);
        String status      = (String) payload.get("status");

        if ("SUCCESS".equalsIgnoreCase(status)) {
            paymentService.confirmFromWebhook(reference, gatewayTxId, eventId, "ORANGE_MONEY", true);
        } else {
            paymentService.confirmFromWebhook(reference, gatewayTxId, eventId, "ORANGE_MONEY", false);
        }
        return ResponseEntity.ok().build();
    }

    // ✅ Webhook Campay — PUBLIC
    @PostMapping("/webhook/campay")
    public ResponseEntity<Void> webhookCampay(@RequestBody Map<String, Object> payload) {
        log.info("📨 Campay Webhook received: {}", payload);
        String reference   = (String) payload.get("external_reference");
        String gatewayTxId = (String) payload.get("reference");
        String status      = (String) payload.get("status");

        if ("SUCCESSFUL".equalsIgnoreCase(status)) {
            paymentService.confirmFromWebhook(reference, gatewayTxId, gatewayTxId, "CAMPAY", true);
        } else {
            paymentService.confirmFromWebhook(reference, gatewayTxId, gatewayTxId, "CAMPAY", false);
        }
        return ResponseEntity.ok().build();
    }
}