package com.hotspotpay.notification.service.impl;

import com.hotspotpay.notification.service.NotificationService;
import com.hotspotpay.notification.service.SmsService;
import com.hotspotpay.payment.model.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final SmsService smsService;

    @Async
    @Override
    public void sendPaymentSuccessNotification(Payment payment) {
        log.info("Notification succès paiement ref={} phone={}",
                payment.getReference(), payment.getClientPhone());
        try {
            // Utilisation de la méthode spécifique définie dans votre interface
            smsService.sendPaymentConfirmation(
                    payment.getClientPhone(),
                    payment.getReference(),
                    payment.getAmount().toPlainString() + " " + payment.getCurrency()
            );
        } catch (Exception e) {
            log.warn("Erreur notification SMS succès: {}", e.getMessage());
        }
    }

    @Async
    @Override
    public void sendPaymentFailureNotification(Payment payment, String reason) {
        log.warn("Notification échec paiement ref={} phone={} reason={}",
                payment.getReference(), payment.getClientPhone(), reason);
        try {
            // Note : SmsService n'a pas encore de méthode pour l'échec.
            // Si vous n'ajoutez pas de méthode générique 'send', il faudra ajouter ceci à votre interface SmsService :
            // void sendPaymentFailure(String phone, String reason);

            log.info("SMS échec non envoyé - En attente d'une méthode adaptée dans SmsService");
        } catch (Exception e) {
            log.warn("Erreur notification SMS échec: {}", e.getMessage());
        }
    }

    @Async @Override
    public void sendPaymentSuccessNotification(String userId, String paymentRef, String amount) {
        log.info("Notification succès userId={} ref={}", userId, paymentRef);
    }

    @Async @Override
    public void sendPaymentFailedNotification(String userId, String paymentRef, String reason) {
        log.warn("Notification échec userId={} ref={} reason={}", userId, paymentRef, reason);
    }

    @Async @Override
    public void sendSessionExpiredNotification(String userId, String sessionId) {
        log.info("Notification session expirée userId={} sessionId={}", userId, sessionId);
    }

    @Async @Override
    public void sendQuotaWarningNotification(String userId, String quotaType, String remaining) {
        log.warn("Notification quota userId={} type={} remaining={}", userId, quotaType, remaining);
    }
}
