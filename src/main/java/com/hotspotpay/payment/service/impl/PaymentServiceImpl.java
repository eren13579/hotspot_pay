package com.hotspotpay.payment.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.dto.PaymentResponse;
import com.hotspotpay.payment.dto.PaymentStatusResponse;
import com.hotspotpay.payment.enumeration.PaymentOperator;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.service.PaymentService;
import com.hotspotpay.payment.service.PaymentWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentWorkflowService paymentWorkflowService;

    @Override
    @Transactional
    public PaymentResponse initiate(InitiatePaymentRequest request) {
        log.info("💳 Initiating payment | Hotspot: {} | Phone: {} | Op: {}",
                request.getHotspotId(), request.getPhone(), request.getOperator());

        // Montant fictif (à récupérer depuis le plan réel)
        BigDecimal amount = new BigDecimal("500.00");

        Payment payment = Payment.builder()
                .hotspotId(request.getHotspotId())
                .planId(request.getPlanId())
                .clientPhone(request.getPhone())
                .clientMac(request.getMac())
                .operator(request.getOperator())
                .amount(amount)
                .description("Paiement WiFi - " + request.getPlanId())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        paymentRepository.save(payment);
        log.info("✅ Payment created | Ref: {} | PaymentId: {}",
                payment.getReference(), payment.getPaymentId());

        return toResponse(payment);
    }

    @Override
    public PaymentStatusResponse getStatus(String reference) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> AppException.notFound("Payment not found: " + reference));
        return toStatusResponse(payment);
    }

    @Override
    @Transactional
    public void confirmFromWebhook(String reference, String gatewayTxId,
                                   String webhookEventId, String operator, boolean success) {
        if (success) {
            paymentWorkflowService.confirmPaymentFromWebhook(reference, gatewayTxId, webhookEventId, operator);
        } else {
            paymentWorkflowService.rejectPayment(reference, "Webhook reported failure from " + operator);
        }
    }

    @Override
    public Page<PaymentResponse> findByHotspot(String userId, String hotspotId, Pageable pageable) {
        return paymentRepository
                .findAllByHotspotIdOrderByCreatedAtDesc(hotspotId, pageable)
                .map(this::toResponse);
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .reference(p.getReference())
                .hotspotId(p.getHotspotId())
                .planId(p.getPlanId())
                .clientPhone(p.getClientPhone())
                .clientMac(p.getClientMac())
                .operator(p.getOperator())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus())
                .description(p.getDescription())
                .expiresAt(p.getExpiresAt())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private PaymentStatusResponse toStatusResponse(Payment p) {
        return PaymentStatusResponse.builder()
                .reference(p.getReference())
                .status(p.getStatus())
                .gatewayTxId(p.getGatewayTxId())
                .failureReason(p.getFailureReason())
                .paidAt(p.getPaidAt())
                .expiresAt(p.getExpiresAt())
                .build();
    }
}