package com.hotspotpay.payment.gateway;

import com.hotspotpay.payment.enumeration.PaymentOperator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrangeMoneyGateway implements MoMoGateway {

    private final WebClient webClient;

    @Value("${orange-money.base-url:https://api.orange.com/orange-money-webpay/cm/v1}")
    private String baseUrl;

    @Value("${orange-money.merchant-key:sandbox-key}")
    private String merchantKey;

    @Value("${orange-money.callback-url:http://localhost:8080/api/V1/payments/orange/webhook}")
    private String callbackUrl;

    @Override
    public String requestToPay(String phone, BigDecimal amount,
                               String currency, String reference,
                               String description) {
        Map<String, Object> body = Map.of(
                "merchant_key",  merchantKey,
                "currency",      currency,
                "order_id",      reference,
                "amount",        amount.toPlainString(),
                "return_url",    callbackUrl,
                "cancel_url",    callbackUrl,
                "notif_url",     callbackUrl,
                "lang",          "fr",
                "reference",     reference
        );

        try {
            Map<?, ?> response = webClient.post()
                    .uri(baseUrl + "/webpayment")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            String payToken = response != null
                    ? (String) response.get("pay_token")
                    : reference;

            log.info("Orange Money payment initiated: phone={}, amount={}, token={}",
                    phone, amount, payToken);
            return payToken;

        } catch (Exception e) {
            log.error("Orange Money payment failed: {}", e.getMessage());
            throw new RuntimeException("Erreur Orange Money : " + e.getMessage());
        }
    }

    @Override
    public TransactionStatus getTransactionStatus(String transactionId) {
        try {
            Map<?, ?> response = webClient.get()
                    .uri(baseUrl + "/paymentstatus/" + transactionId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) return TransactionStatus.PENDING;

            String status = (String) response.get("status");
            return switch (status) {
                case "SUCCESS"  -> TransactionStatus.SUCCESSFUL;
                case "FAILED"   -> TransactionStatus.FAILED;
                default         -> TransactionStatus.PENDING;
            };
        } catch (Exception e) {
            log.warn("Orange Money status check failed: {}", e.getMessage());
            return TransactionStatus.PENDING;
        }
    }

    @Override
    public PaymentOperator getOperator() { return PaymentOperator.ORANGE_MONEY; }
}