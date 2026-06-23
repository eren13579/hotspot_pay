package com.hotspotpay.payment.service;

import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.dto.PaymentResponse;
import com.hotspotpay.payment.dto.PaymentStatusResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {
    PaymentResponse initiate(InitiatePaymentRequest request);
    PaymentStatusResponse getStatus(String reference);
    void confirmFromWebhook(String reference, String gatewayTxId, boolean success);
    Page<PaymentResponse> findByHotspot(String userId, String hotspotId, Pageable pageable);

    /**
     * Active manuellement la session WiFi après un paiement avec auto-connect désactivé.
     * Le client a reçu ses identifiants et clique "Se connecter" sur le portail.
     */
    PaymentResponse connectManually(String reference, String mac);
}