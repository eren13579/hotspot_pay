package com.hotspotpay.common.orchestration;

import com.hotspotpay.common.events.PaymentConfirmedEvent;
import com.hotspotpay.common.events.PaymentFailedEvent;
import com.hotspotpay.notification.service.NotificationService;
import com.hotspotpay.session.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentOrchestrationListener {

    private final SessionService sessionService;
    private final NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPaymentConfirmed(PaymentConfirmedEvent event) {
        var payment = event.getPayment();
        log.info("PaymentConfirmed event received for payment {}", payment.getReference());

        try {
            // Activer la session WiFi
            sessionService.activateSession(payment);
            log.info("Session activated for payment {}", payment.getReference());

            // Envoyer notification succès
            notificationService.sendPaymentSuccessNotification(payment);
        } catch (Exception e) {
            log.error("Failed to process PaymentConfirmedEvent for {}", payment.getReference(), e);
        }
    }

    @Async
    @EventListener
    public void onPaymentFailed(PaymentFailedEvent event) {
        var payment = event.getPayment();
        log.info("PaymentFailed event received for payment {}", payment.getReference());

        try {
            notificationService.sendPaymentFailureNotification(payment, event.getReason());
        } catch (Exception e) {
            log.error("Failed to send failure notification for {}", payment.getReference(), e);
        }
    }
}