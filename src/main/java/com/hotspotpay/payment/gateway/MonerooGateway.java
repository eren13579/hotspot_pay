package com.hotspotpay.payment.gateway;

import com.hotspotpay.integration.moneroo.*;
import com.hotspotpay.payment.enumeration.PaymentOperator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Passerelle Moneroo (multi-opérateurs : MTN CM, Orange CM, Wave, etc.)
 * Doc : https://docs.moneroo.io
 *
 * Flux de paiement :
 *   1. POST /v1/payments/initialize
 *      → corps = MonerooInitRequest
 *      → réponse = MonerooInitResponse { success, data: { id, checkout_url } }
 *      → stocker response.getData().getId() comme gatewayTxId
 *      → retourner checkout_url au client pour finaliser le paiement
 *
 *   2. GET /v1/payments/{id}/verify   ← VÉRIFICATION DE STATUT
 *      → réponse = MonerooVerifyResponse { data: { id, status, metadata } }
 *      → statuts : "pending", "success", "failed", "cancelled"
 *
 *   3. Webhook POST /v1/payments/webhook
 *      → corps = MonerooWebhookEvent { event, data: { id, status, metadata } }
 *      → événements : "payment.success", "payment.failed", "payment.cancelled"
 *      → extraire notre référence depuis data.metadata.reference
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MonerooGateway implements MoMoGateway {

    private final WebClient         webClient;
    private final MonerooProperties props;
    @Getter
    private volatile String lastCheckoutUrl;

    // ── MoMoGateway ──────────────────────────────────────────────────────

    @Override
    public String requestToPay(String phone, BigDecimal amount, String currency,
                               String reference, String description) {

        log.info("[Moneroo] Init paiement — phone={}, amount={} {}", phone, amount, currency);

        long amountLong = amount.longValue();

        MonerooInitRequest request = MonerooInitRequest.builder()
                .amount(amountLong)
                .currency(currency)
                .description(description)
                .returnUrl(props.getReturnUrl() + "?reference=" + reference)
                .metadata(Map.of("reference", reference))
                .customer(MonerooInitRequest.Customer.builder()
                        .phone(sanitizePhone(phone))
                        .firstName("Client")
                        .lastName("WiFi")
                        .email(phone.replaceAll("[^0-9]", "") + "@hotspotpay.cm")
                        .build())
                .methods(props.getMethods().isEmpty() ? null : props.getMethods())
                .build();

        try {
            MonerooInitResponse resp = webClient.post()
                    .uri(props.getBaseUrl() + "/v1/payments/initialize")
                    .header("Authorization", "Bearer " + props.getApiKey())
                    .header("Accept", "application/json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MonerooInitResponse.class)
                    .block();

            // ✅ On vérifie UNIQUEMENT que data.id est présent
            // Le champ "success" n'existe pas dans la réponse Moneroo
            if (resp == null || resp.getData() == null || resp.getData().getId() == null) {
                String msg = resp != null ? resp.getMessage() : "réponse null";
                throw new RuntimeException("[Moneroo] ID transaction manquant : " + msg);
            }

            String monerooId = resp.getData().getId();
            String checkoutUrl = resp.getData().getCheckoutUrl();

            this.lastCheckoutUrl = checkoutUrl;
            log.info("[Moneroo] Paiement initialisé — id={}, checkoutUrl={}", monerooId, checkoutUrl);

            // IMPORTANT : PaymentServiceImpl.initiate() parse "gatewayTxId|checkoutUrl"
            // pour stocker le checkout_url en DB et le renvoyer au client.
            return monerooId + "|" + (checkoutUrl != null ? checkoutUrl : "");

        } catch (WebClientResponseException e) {
            log.error("[Moneroo] HTTP {} : {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("[Moneroo] " + e.getResponseBodyAsString());
        }
    }

    @Override
    public TransactionStatus getTransactionStatus(String transactionId) {
        try {
            MonerooVerifyResponse resp = webClient.get()
                    .uri(props.getBaseUrl() + "/v1/payments/" + transactionId + "/verify")
                    .header("Authorization", "Bearer " + props.getApiKey())
                    .header("Accept", "application/json")
                    .retrieve()
                    .bodyToMono(MonerooVerifyResponse.class)  // ✅ Jackson désérialise proprement
                    .block();

            if (resp == null || resp.getData() == null) {
                log.warn("[Moneroo] Réponse vide pour id={}", transactionId);
                return TransactionStatus.PENDING;
            }

            String status = resp.getData().getStatus();
            log.debug("[Moneroo] Statut={} pour id={}", status, transactionId);

            return switch (status != null ? status.toLowerCase() : "") {
                case "success"             -> TransactionStatus.SUCCESSFUL;
                case "failed", "cancelled" -> TransactionStatus.FAILED;
                default                    -> TransactionStatus.PENDING;  // "initiated", "pending"
            };

        } catch (Exception e) {
            log.warn("[Moneroo] Erreur statut id={}: {}", transactionId, e.getMessage());
            return TransactionStatus.PENDING;
        }
    }

    @Override
    public PaymentOperator getOperator() {
        return PaymentOperator.MONEROO;
    }

    // ── Privé ─────────────────────────────────────────────────────────────

    /**
     * Normalise le numéro au format international avec +.
     * Moneroo accepte : +237XXXXXXXXX
     *
     * Exemples :
     *   237656721535  → +237656721535
     *   656721535     → +237656721535  (9 chiffres = Cameroun local)
     *   +237656721535 → +237656721535  (déjà correct)
     */
    private String sanitizePhone(String phone) {
        if (phone == null || phone.isBlank()) return "";
        String digits = phone.replaceAll("[^0-9]", "");

        if (digits.startsWith("00237")) return "+" + digits.substring(2);
        if (digits.startsWith("237"))   return "+" + digits;
        if (digits.length() == 9)       return "+237" + digits;
        return "+" + digits;
    }
}
