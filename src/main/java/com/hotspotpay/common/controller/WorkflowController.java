package com.hotspotpay.common.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.payment.service.PaymentWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller exposant les workflows métier complexes
 */
@Slf4j
@RestController
@RequestMapping("/api/V1/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final PaymentWorkflowService paymentWorkflowService;

    /**
     * Confirmer un paiement manuellement (utile pour debug/admin)
     */
    @PostMapping("/payments/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPayment(
            @RequestBody Map<String, String> body) {

        try {
            paymentWorkflowService.confirmPaymentFromWebhook(
                    body.get("reference"),
                    body.get("gatewayTxId"),
                    body.get("webhookEventId"),
                    body.get("operator")
            );

            return ResponseEntity.ok(ApiResponse.ok("Paiement confirmé avec succès"));

        } catch (Exception e) {
            log.error("Error confirming payment", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("CONFIRM_FAILED", e.getMessage()));
        }
    }

    /**
     * Rejeter un paiement manuellement (debug/admin)
     */
    @PostMapping("/payments/reject")
    public ResponseEntity<ApiResponse<Void>> rejectPayment(
            @RequestBody Map<String, String> body) {

        try {
            paymentWorkflowService.rejectPayment(
                    body.get("reference"),
                    body.get("reason")
            );

            return ResponseEntity.ok(ApiResponse.ok("Paiement rejeté"));

        } catch (Exception e) {
            log.error("Error rejecting payment", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("REJECT_FAILED", e.getMessage()));
        }
    }
}