package com.hotspotpay.payment.gateway;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.payment.enumeration.PaymentOperator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MonerooGateway implements MoMoGateway {

    private final WebClient webClient;

    @Value("${moneroo.api-key}")
    private String apiKey;

    @Value("${moneroo.base-url:https://api.moneroo.io/v1}")
    private String baseUrl;

    @Override
    public String requestToPay(String phone, BigDecimal amount, String currency, String reference, String description) {
        try {
            Map<String, Object> body = Map.of(
                    "amount", amount.intValue(),
                    "currency", currency,
                    "phone", phone.startsWith("+") ? phone : "+" + phone,
                    "reference", reference,
                    "description", description,
                    "callback_url", "https://yourdomain.com/api/V1/payments/moneroo/webhook"
            );

            String response = webClient.post()
                    .uri(baseUrl + "/payments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Moneroo payment initiated successfully - Reference: {}", reference);
            return reference;

        } catch (Exception e) {
            log.error("Moneroo requestToPay failed for ref {}: {}", reference, e.getMessage());
            throw AppException.badRequest("Échec Moneroo : " + e.getMessage());
        }
    }

    @Override
    public TransactionStatus getTransactionStatus(String transactionId) {
        // À implémenter selon tes besoins (polling)
        return TransactionStatus.PENDING;
    }

    @Override
    public PaymentOperator getOperator() { return PaymentOperator.MONEROO; }
}