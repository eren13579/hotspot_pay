package com.hotspotpay.scheduler;

import com.hotspotpay.payment.gateway.*;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentPollingJob {

    private final PaymentRepository  paymentRepository;
    private final PaymentService     paymentService;
    private final MtnMoMoGateway     mtnGateway;
    private final OrangeMoneyGateway orangeGateway;
    private final MonerooGateway     monerooGateway;
    private final CampayGateway      campayGateway;

    @Scheduled(fixedDelay = 10_000)
    @Transactional
    public void pollPendingPayments() {
        List<Payment> pending = paymentRepository.findPendingNotExpired(LocalDateTime.now());
        if (pending.isEmpty()) return;

        log.debug("Polling {} pending payment(s)...", pending.size());

        for (Payment payment : pending) {
            if (payment.getGatewayTxId() == null) continue;
            try {
                // ✅ Tous les opérateurs ont leur gateway
                MoMoGateway gateway = switch (payment.getOperator()) {
                    case MTN_MOMO     -> mtnGateway;
                    case ORANGE_MONEY -> orangeGateway;
                    case MONEROO      -> monerooGateway;
                    case CAMPAY       -> campayGateway;
                };

                MoMoGateway.TransactionStatus txStatus =
                        gateway.getTransactionStatus(payment.getGatewayTxId());

                String eventId = payment.getGatewayTxId() + "_poll_" + System.currentTimeMillis();
                switch (txStatus) {
                    case SUCCESSFUL -> paymentService.confirmFromWebhook(
                            payment.getReference(), payment.getGatewayTxId(),
                            eventId, payment.getOperator().name(), true);
                    case FAILED     -> paymentService.confirmFromWebhook(
                            payment.getReference(), payment.getGatewayTxId(),
                            eventId, payment.getOperator().name(), false);
                    case PENDING    -> log.debug("Still pending: ref={}", payment.getReference());
                }
            } catch (Exception e) {
                log.warn("Polling error for ref={}: {}", payment.getReference(), e.getMessage());
            }
        }

        // Expire les paiements dépassés
        List<Payment> expired = paymentRepository.findExpiredPending(LocalDateTime.now());
        for (Payment p : expired) {
            paymentRepository.updateStatus(p.getReference(), PaymentStatus.EXPIRED, LocalDateTime.now());
            log.info("Payment expired: ref={}", p.getReference());
        }
    }
}