package com.hotspotpay.notification.service;

import com.hotspotpay.payment.model.Payment;

public interface NotificationService {
    void sendPaymentSuccessNotification(Payment payment);
    void sendPaymentFailureNotification(Payment payment, String reason);
    void sendPaymentSuccessNotification(String userId, String paymentRef, String amount);
    void sendPaymentFailedNotification(String userId, String paymentRef, String reason);
    void sendSessionExpiredNotification(String userId, String sessionId);
    void sendQuotaWarningNotification(String userId, String quotaType, String remaining);
}
