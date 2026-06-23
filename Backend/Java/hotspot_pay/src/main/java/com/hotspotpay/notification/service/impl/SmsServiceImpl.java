package com.hotspotpay.notification.service.impl;

import com.hotspotpay.notification.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    @Override
    public void sendPaymentConfirmation(String phone, String reference, String amount) {
        log.info("📱 SMS envoyé à {} : Paiement {} confirmé ({})", phone, reference, amount);
        // TODO: Intégrer Termii, AfricasTalking ou Orange SMS API
    }

    @Override
    public void sendSessionExpiryWarning(String phone, String hotspotName) {
        log.info("📱 SMS envoyé à {} : Votre session sur {} expire bientôt", phone, hotspotName);
    }
}