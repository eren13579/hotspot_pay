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
}