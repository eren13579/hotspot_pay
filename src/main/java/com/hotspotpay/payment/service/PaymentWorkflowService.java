package com.hotspotpay.payment.service;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.common.events.PaymentConfirmedEvent;
import com.hotspotpay.common.events.PaymentFailedEvent;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.util.IdempotencyUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentWorkflowService {

    private final PaymentRepository paymentRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final IdempotencyUtil idempotencyUtil;
    private final AuditService auditService;

    @Transactional
    public void confirmPaymentFromWebhook(String reference, String gatewayTxId,
                                          String webhookEventId, String operator) {
        log.info("WORKFLOW: Confirming Payment | Ref: {} | Op: {}", reference, operator);

        try {
            // 1. Vérifier l'idempotence EN PREMIER via webhookEventId
            if (!idempotencyUtil.isNewEvent(webhookEventId)) {
                log.warn("Duplicate webhook event {}, skipping", webhookEventId);
                return;
            }

            // 2. Charger le paiement
            Payment payment = paymentRepository.findByReference(reference)
                    .orElseThrow(() -> AppException.notFound("Payment not found: " + reference));

            // 3. Vérifier le statut (double sécurité)
            if (payment.getStatus() == PaymentStatus.PAID) {
                log.warn("Payment {} already PAID, skipping", reference);
                return;
            }

            // 4. Mettre à jour le statut
            payment.setStatus(PaymentStatus.PAID);
            payment.setGatewayTxId(gatewayTxId);
            payment.setWebhookReceivedAt(LocalDateTime.now());
            payment.setPaidAt(LocalDateTime.now());

            // 5. Sauvegarder
            paymentRepository.save(payment);

            // 6. Publier l'event
            eventPublisher.publishEvent(new PaymentConfirmedEvent(this, payment));

            // 7. Audit
            auditService.log(
                    "SYSTEM",
                    "PAYMENT_CONFIRMED",
                    "Payment",
                    java.util.Map.of(
                            "reference", payment.getReference(),
                            "gatewayTxId", gatewayTxId,
                            "operator", operator,
                            "status", payment.getStatus().name(),
                            "amount", payment.getAmount()
                    ),
                    payment.getClientPhone()
            );

            log.info("WORKFLOW: Payment confirmed successfully | Ref: {}", reference);

        } catch (Exception e) {
            log.error("WORKFLOW: Payment confirmation failed | Ref: {}", reference, e);
            // On passe le payment déjà chargé si possible, sinon on cherche
            paymentRepository.findByReference(reference).ifPresent(p ->
                    eventPublisher.publishEvent(new PaymentFailedEvent(this, p, e.getMessage()))
            );
            throw e;
        }
    }

    @Transactional
    public void rejectPayment(String reference, String failureReason) {
        log.info("⚙️  WORKFLOW: Rejecting Payment | Ref: {} | Reason: {}", reference, failureReason);

        try {
            Payment payment = paymentRepository.findByReference(reference)
                    .orElseThrow(() -> AppException.notFound("Payment not found: " + reference));

            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(failureReason);

            paymentRepository.save(payment);

            // On réutilise l'objet en mémoire, pas de double query
            eventPublisher.publishEvent(new PaymentFailedEvent(this, payment, failureReason));

            auditService.log(
                    "SYSTEM",
                    "PAYMENT_REJECTED",
                    "Payment",
                    java.util.Map.of(
                            "reference", payment.getReference(),
                            "reason", failureReason,
                            "status", payment.getStatus().name()
                    ),
                    payment.getClientPhone()
            );

            log.info("WORKFLOW: Payment rejected | Ref: {}", reference);

        } catch (Exception e) {
            log.error("WORKFLOW: Payment rejection failed | Ref: {}", reference, e);
            throw e;
        }
    }
}