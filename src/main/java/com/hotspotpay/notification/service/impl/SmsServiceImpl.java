package com.hotspotpay.notification.service.impl;

import com.hotspotpay.notification.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    @Override
    public void send(String phone, String message) {

        log.info("Sending SMS to {} : {}", phone, message);
    }
}