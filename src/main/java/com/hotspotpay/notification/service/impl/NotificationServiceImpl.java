package com.hotspotpay.notification.service.impl;

import com.hotspotpay.notification.service.NotificationService;
import com.hotspotpay.payment.model.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    @Override
    public void sendPaymentSuccessNotification(String userId, String paymentRef, String amount) {
        // TODO: Implémenter envoi d'email/SMS
        log.info("NOTIFICATION: Payment success for user {} - Ref: {} Amount: {}", userId, paymentRef, amount);
    }

    @Override
    public void sendPaymentFailedNotification(String userId, String paymentRef, String reason) {
        // TODO: Implémenter envoi d'email/SMS
        log.warn("NOTIFICATION: Payment failed for user {} - Ref: {} Reason: {}", userId, paymentRef, reason);
    }

    @Override
    public void sendSessionExpiredNotification(String userId, String sessionId) {
        // TODO: Implémenter envoi d'email/SMS
        log.info("NOTIFICATION: Session expired for user {} - Session: {}", userId, sessionId);
    }

    @Override
    public void sendQuotaWarningNotification(String userId, String quotaType, String remaining) {
        // TODO: Implémenter envoi d'email/SMS
        log.warn("NOTIFICATION: Quota warning for user {} - Type: {} Remaining: {}", userId, quotaType, remaining);
    }

    @Override
    public void sendPaymentSuccessNotification(Payment payment) {
        log.info("NOTIFICATION: Payment success — ref={}, phone={}, amount={} {}",
                payment.getReference(), payment.getClientPhone(),
                payment.getAmount(), payment.getCurrency());
        // TODO: SMS via SmsService ou email
    }

    @Override
    public void sendPaymentFailureNotification(Payment payment, String reason) {
        log.warn("NOTIFICATION: Payment failed — ref={}, phone={}, reason={}",
                payment.getReference(), payment.getClientPhone(), reason);
        // TODO: SMS via SmsService ou email
    }
}