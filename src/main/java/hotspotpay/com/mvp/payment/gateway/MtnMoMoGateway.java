package hotspotpay.com.mvp.payment.gateway;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MtnMoMoGateway implements MoMoGateway {

    private final WebClient webClient;

    @Value("${mtn-momo.base-url:https://sandbox.momodeveloper.mtn.com}")
    private String baseUrl;

    @Value("${mtn-momo.subscription-key:sandbox-key}")
    private String subscriptionKey;

    @Value("${mtn-momo.api-user:sandbox-user}")
    private String apiUser;

    @Value("${mtn-momo.api-key:sandbox-api-key}")
    private String apiKey;

    @Value("${mtn-momo.target-environment:sandbox}")
    private String targetEnvironment;

    @Value("${mtn-momo.callback-url:http://localhost:8080/api/V1/payments/mtn/webhook}")
    private String callbackUrl;

    @Override
    public String requestToPay(String phone, BigDecimal amount,
                               String currency, String reference,
                               String description) {
        String transactionId = UUID.randomUUID().toString();

        Map<String, Object> body = Map.of(
                "amount",       amount.toPlainString(),
                "currency",     currency,
                "externalId",   reference,
                "payer",        Map.of("partyIdType", "MSISDN", "partyId", phone),
                "payerMessage", description,
                "payeeNote",    "HotspotPay WiFi"
        );

        try {
            webClient.post()
                    .uri(baseUrl + "/collection/v1_0/requesttopay")
                    .header("Authorization", "Basic " + basicAuth())
                    .header("X-Reference-Id", transactionId)
                    .header("X-Target-Environment", targetEnvironment)
                    .header("Ocp-Apim-Subscription-Key", subscriptionKey)
                    .header("X-Callback-Url", callbackUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("MTN MoMo RequestToPay sent: phone={}, amount={}, txId={}",
                    phone, amount, transactionId);
            return transactionId;

        } catch (Exception e) {
            log.error("MTN MoMo RequestToPay failed: {}", e.getMessage());
            throw new RuntimeException("Erreur MTN MoMo : " + e.getMessage());
        }
    }

    @Override
    public TransactionStatus getTransactionStatus(String transactionId) {
        try {
            Map<?, ?> response = webClient.get()
                    .uri(baseUrl + "/collection/v1_0/requesttopay/" + transactionId)
                    .header("Authorization", "Basic " + basicAuth())
                    .header("X-Target-Environment", targetEnvironment)
                    .header("Ocp-Apim-Subscription-Key", subscriptionKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) return TransactionStatus.PENDING;

            String status = (String) response.get("status");
            return switch (status) {
                case "SUCCESSFUL" -> TransactionStatus.SUCCESSFUL;
                case "FAILED"     -> TransactionStatus.FAILED;
                default           -> TransactionStatus.PENDING;
            };
        } catch (Exception e) {
            log.warn("MTN MoMo status check failed for txId={}: {}", transactionId, e.getMessage());
            return TransactionStatus.PENDING;
        }
    }

    private String basicAuth() {
        String credentials = apiUser + ":" + apiKey;
        return java.util.Base64.getEncoder()
                .encodeToString(credentials.getBytes());
    }
}