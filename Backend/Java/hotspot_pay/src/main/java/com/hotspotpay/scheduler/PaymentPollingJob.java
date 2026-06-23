package com.hotspotpay.scheduler;

import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.gateway.*;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.service.PaymentService;
import com.hotspotpay.realtime.dto.PaymentStatusEvent;
import com.hotspotpay.realtime.service.SseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Polling des paiements PENDING — FALLBACK uniquement.
 *
 * Le webhook opérateur est le chemin principal (quasi-instantané).
 * Ce job est le backup : il poll l'opérateur toutes les 15s pour les
 * paiements qui n'ont pas encore reçu de webhook (latence opérateur, etc.)
 *
 * Optimisations ressources :
 *   - Toutes les 15s (pas 10s) — le webhook arrive en général en < 10s
 *   - Backoff : pas de re-poll dans les 30s suivant la création
 *   - Skip si aucun gatewayTxId (paiement pas encore initié côté opérateur)
 *   - Ignore les PENDING_MIKROTIK déjà confirmés (activés via webhook)
 *
 * Ressource-friendly : 1 query DB + N appels API opérateur (N = nb PENDING).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentPollingJob {

    private final PaymentRepository  paymentRepository;
    private final PaymentService     paymentService;
    private final SseService         sseService;
    private final MtnMoMoGateway     mtnGateway;
    private final OrangeMoneyGateway orangeGateway;
    private final CampayGateway      campayGateway;
    private final MonerooGateway     monerooGateway;

    /** Vérifie les paiements PENDING toutes les 15 secondes — fallback uniquement */
    @Scheduled(fixedDelay = 15_000)
    public void pollPendingPayments() {
        List<Payment> pending = paymentRepository.findPendingNotExpired(LocalDateTime.now());
        if (pending.isEmpty()) return;

        log.debug("Polling fallback {} paiement(s) PENDING...", pending.size());

        int polled = 0;
        for (Payment payment : pending) {
            if (payment.getGatewayTxId() == null) continue;

            // Wait 30s avant le premier poll — le webhook arrive en général en < 10s
            long secondsSinceCreation = java.time.Duration.between(
                    payment.getCreatedAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceCreation < 30) {
                continue; // Trop tôt — le webhook n'est peut-être pas encore arrivé
            }

            // Backoff : attendre N*10s entre tentatives
            int attemptEstimate = (int) (secondsSinceCreation / 15);
            if (attemptEstimate > 0 && secondsSinceCreation < (long) attemptEstimate * 10) {
                continue;
            }

            polled++;
            try {
                MoMoGateway gateway = switch (payment.getOperator()) {
                    case MTN_MOMO     -> mtnGateway;
                    case ORANGE_MONEY -> orangeGateway;
                    case CAMPAY       -> campayGateway;
                    case MONEROO      -> monerooGateway;
                };

                MoMoGateway.TransactionStatus txStatus =
                        gateway.getTransactionStatus(payment.getGatewayTxId());

                switch (txStatus) {
                    case SUCCESSFUL -> {
                        log.info("Paiement confirmé par polling (fallback): ref={}", payment.getReference());
                        paymentService.confirmFromWebhook(
                                payment.getReference(), payment.getGatewayTxId(), true);
                    }
                    case FAILED -> {
                        log.info("Paiement échoué par polling (fallback): ref={}", payment.getReference());
                        paymentService.confirmFromWebhook(
                                payment.getReference(), payment.getGatewayTxId(), false);
                    }
                    case PENDING -> log.debug("Toujours PENDING (polling): ref={}", payment.getReference());
                }
            } catch (Exception e) {
                log.warn("Erreur polling ref={}: {}", payment.getReference(), e.getMessage());
            }
        }

        if (polled > 0) {
            log.debug("Polling: {} paiement(s) vérifié(s) sur {}", polled, pending.size());
        }

        // Expirer les paiements dont le délai est dépassé
        List<Payment> expired = paymentRepository.findExpiredPending(LocalDateTime.now());
        for (Payment p : expired) {
            paymentRepository.updateStatus(p.getReference(), PaymentStatus.EXPIRED, LocalDateTime.now());
            sseService.push(p.getReference(), PaymentStatusEvent.builder()
                    .reference(p.getReference())
                    .status(PaymentStatus.EXPIRED)
                    .message("Paiement expiré — veuillez réessayer")
                    .wifiActivated(false)
                    .build());
            log.info("Paiement expiré: ref={}", p.getReference());
        }
    }
}
