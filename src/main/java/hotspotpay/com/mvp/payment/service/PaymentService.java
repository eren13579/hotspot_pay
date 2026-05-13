package hotspotpay.com.mvp.payment.service;

import hotspotpay.com.mvp.payment.dto.InitiatePaymentRequest;
import hotspotpay.com.mvp.payment.dto.PaymentResponse;
import hotspotpay.com.mvp.payment.dto.PaymentStatusResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {
    PaymentResponse initiate(InitiatePaymentRequest request);
    PaymentStatusResponse getStatus(String reference);
    void confirmFromWebhook(String reference, String gatewayTxId, boolean success);
    Page<PaymentResponse> findByHotspot(String userId, String hotspotId, Pageable pageable);
}