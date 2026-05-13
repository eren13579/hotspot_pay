package com.hotspotpay.notification.service;

public interface SmsService {

    void send(String phone, String message);
}