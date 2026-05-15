package com.hotspotpay.payment.gateway;

import com.hotspotpay.integration.campay.*;
import com.hotspotpay.payment.enumeration.PaymentOperator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Passerelle Campay (MTN MoMo & Orange Money Cameroun).
 * Doc : https://documenter.getpostman.com/view/2779593/T1LV8PVA
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CampayGateway implements MoMoGateway {

    private final WebClient        webClient;
    private final CampayProperties props;

    /** Cache du token Bearer (reset si expiré) */
    private final AtomicReference<String> cachedToken = new AtomicReference<>();

    // ── MoMoGateway ──────────────────────────────────────────────────────

    @Override
    public String requestToPay(String phone, BigDecimal amount, String currency,
                               String reference, String description) {

        log.info("[Campay] Initiation collecte — phone={}, amount={} {}", phone, amount, currency);
        String token = getToken();

        Map<String, Object> body = Map.of(
                "amount",             amount.toBigInteger().toString(),
                "currency",           currency,
                "from",               sanitizePhone(phone),
                "description",        description,
                "external_reference", reference,
                "redirect_url",       props.getRedirectUrl(),
                "callback_url",       props.getCallbackUrl()
        );

        try {
            CampayCollectResponse resp = webClient.post()
                    .uri(props.getBaseUrl() + "/api/collect/")
                    .header("Authorization", "Token " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(CampayCollectResponse.class)
                    .block();

            if (resp == null || resp.getReference() == null)
                throw new RuntimeException("Campay: réponse vide ou référence manquante");

            log.info("[Campay] Collecte initiée ref={}", resp.getReference());
            return resp.getReference();

        } catch (WebClientResponseException e) {
            log.error("[Campay] HTTP {} : {}", e.getStatusCode(), e.getResponseBodyAsString());
            // Invalider le cache token en cas de 401
            if (e.getStatusCode().value() == 401) cachedToken.set(null);
            throw new RuntimeException("Campay: " + e.getResponseBodyAsString());
        }
    }

    @Override
    public TransactionStatus getTransactionStatus(String transactionId) {
        log.debug("[Campay] Statut ref={}", transactionId);
        try {
            CampayTransactionResponse tx = webClient.get()
                    .uri(props.getBaseUrl() + "/api/transaction/" + transactionId + "/")
                    .header("Authorization", "Token " + getToken())
                    .retrieve()
                    .bodyToMono(CampayTransactionResponse.class)
                    .block();

            if (tx == null) return TransactionStatus.PENDING;
            return switch (tx.getStatus().toUpperCase()) {
                case "SUCCESSFUL" -> TransactionStatus.SUCCESSFUL;
                case "FAILED"     -> TransactionStatus.FAILED;
                default           -> TransactionStatus.PENDING;
            };
        } catch (WebClientResponseException e) {
            log.error("[Campay] Statut HTTP {} : {}", e.getStatusCode(), e.getResponseBodyAsString());
            return TransactionStatus.PENDING;
        }
    }

    @Override
    public PaymentOperator getOperator() { return PaymentOperator.CAMPAY; }

    // ── Privé ─────────────────────────────────────────────────────────────

    private String getToken() {
        String tok = cachedToken.get();
        if (tok != null) return tok;

        try {
            CampayTokenResponse resp = webClient.post()
                    .uri(props.getBaseUrl() + "/api/token/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("username", props.getUsername(), "password", props.getPassword()))
                    .retrieve()
                    .bodyToMono(CampayTokenResponse.class)
                    .block();

            if (resp == null || resp.getToken() == null)
                throw new RuntimeException("Campay: token null");

            cachedToken.set(resp.getToken());
            return resp.getToken();

        } catch (WebClientResponseException e) {
            throw new RuntimeException("Campay auth: " + e.getResponseBodyAsString());
        }
    }

    /** Normalise vers le format 237XXXXXXXXX attendu par Campay */
    private String sanitizePhone(String phone) {
        if (phone == null) return "";
        String d = phone.replaceAll("[^0-9]", "");
        if (d.startsWith("00237")) return d.substring(2);
        if (d.startsWith("237"))   return d;
        if (d.length() == 9)       return "237" + d;
        return d;
    }
}