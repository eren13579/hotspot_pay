package com.hotspotpay.notification.service;

public interface SmsService {

    public void sendSessionExpiryWarning(String phone, String hotspotName);
    public void sendPaymentConfirmation(String phone, String reference, String amount);
}