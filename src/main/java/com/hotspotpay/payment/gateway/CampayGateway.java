package com.hotspotpay.payment.gateway;

import com.hotspotpay.integration.campay.*;
import com.hotspotpay.payment.enumeration.PaymentOperator;
import com.hotspotpay.systemsettings.service.SettingsReader;
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
 * Doc : https://demo.campay.net
 *
 * Endpoints utilisés :
 *   POST /api/token/               → obtenir token temporaire (Method 2)
 *   POST /api/collect/             → initier un paiement (RequestToPay)
 *   GET  /api/transaction/{ref}/   → vérifier le statut
 *
 * Auth :
 *   Method 1 (priorité) : Token permanent depuis APP KEYS du dashboard
 *   Method 2 (fallback)  : POST /api/token/ avec username/password
 *
 * ⚠ Les paramètres (baseUrl, redirectUrl, tokens, etc.) sont lus depuis la BD
 *    (system_settings) avec fallback sur les propriétés Spring/.env.
 *    L'administrateur peut donc les modifier depuis l'UI sans redémarrer.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CampayGateway implements MoMoGateway {

    private final WebClient        webClient;
    private final CampayProperties props;
    private final SettingsReader   settings;

    // Cache du token temporaire (Method 2 uniquement)
    private final AtomicReference<String> cachedToken = new AtomicReference<>();
    // Timestamp d'expiration du token temporaire (ms)
    private volatile long tokenExpiresAt = 0;

    // ── MoMoGateway ──────────────────────────────────────────────────────

    @Override
    public String requestToPay(String phone, BigDecimal amount, String currency,
                               String reference, String description) {

        log.info("[Campay] Initiation collecte — phone={}, amount={} {}", phone, amount, currency);

        // !! Doc Campay : ER201 = "Decimal numbers are NOT allowed"
        // Amount doit être un entier ou string entier
        int amountInt = amount.intValue();
        if (amountInt <= 0) {
            throw new RuntimeException("[Campay] Montant invalide (doit être entier > 0) : " + amount);
        }

        // !! Doc Campay : ER101 = "Ensure phone starts with country code e.g 237xxxxxxxxx"
        String formattedPhone = sanitizePhone(phone);

        Map<String, Object> body = Map.of(
                "amount",             String.valueOf(amountInt),
                "currency",           currency,
                "from",               formattedPhone,
                "description",        description,
                "external_reference", reference,        // notre référence — retournée dans le webhook
                "redirect_url",       settings.get("payments.campay.redirectUrl", props::getRedirectUrl),
                "failure_redirect_url", settings.get("payments.campay.failureRedirectUrl", props::getFailureRedirectUrl)
        );

        try {
            CampayCollectResponse resp = webClient.post()
                    .uri(settings.get("payments.campay.baseUrl", props::getBaseUrl) + "/api/collect/")
                    .header("Authorization", "Token " + getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(CampayCollectResponse.class)
                    .block();

            if (resp == null || resp.getReference() == null) {
                throw new RuntimeException("[Campay] Réponse vide ou référence manquante");
            }

            log.info("[Campay] Collecte initiée — campayRef={}, operator={}",
                    resp.getReference(), resp.getOperator());
            return resp.getReference();

        } catch (WebClientResponseException e) {
            log.error("[Campay] HTTP {} : {}", e.getStatusCode(), e.getResponseBodyAsString());
            // Token expiré → invalider le cache pour forcer un refresh
            if (e.getStatusCode().value() == 401) {
                cachedToken.set(null);
                tokenExpiresAt = 0;
            }
            throw new RuntimeException("[Campay] " + e.getResponseBodyAsString());
        }
    }

    @Override
    public TransactionStatus getTransactionStatus(String transactionId) {
        log.debug("[Campay] Vérification statut ref={}", transactionId);
        try {
            CampayTransactionResponse tx = webClient.get()
                    .uri(settings.get("payments.campay.baseUrl", props::getBaseUrl) + "/api/transaction/" + transactionId + "/")
                    .header("Authorization", "Token " + getToken())
                    .retrieve()
                    .bodyToMono(CampayTransactionResponse.class)
                    .block();

            if (tx == null || tx.getStatus() == null) {
                log.warn("[Campay] Statut null pour ref={}", transactionId);
                return TransactionStatus.PENDING;
            }

            // Statuts Campay (doc officielle) : SUCCESSFUL, FAILED, PENDING
            return switch (tx.getStatus().toUpperCase()) {
                case "SUCCESSFUL" -> TransactionStatus.SUCCESSFUL;
                case "FAILED"     -> TransactionStatus.FAILED;
                default           -> TransactionStatus.PENDING;
            };

        } catch (WebClientResponseException e) {
            log.warn("[Campay] HTTP {} vérification statut ref={}: {}",
                    e.getStatusCode(), transactionId, e.getResponseBodyAsString());
            return TransactionStatus.PENDING;
        } catch (Exception e) {
            log.warn("[Campay] Erreur statut ref={}: {}", transactionId, e.getMessage());
            return TransactionStatus.PENDING;
        }
    }

    @Override
    public PaymentOperator getOperator() {
        return PaymentOperator.CAMPAY;
    }

    // ── Privé ─────────────────────────────────────────────────────────────

    /**
     * Retourne le token d'authentification à utiliser.
     *
     * Method 1 (priorité) : Token permanent depuis campay.permanent-token
     * Method 2 (fallback)  : Token temporaire via POST /api/token/
     *                        avec cache + vérification expiration
     */
    private String getToken() {
        // Method 1 : Token permanent → priorité BD, fallback Spring props
        String dbPermToken = settings.get("payments.campay.permanentToken", "");
        if (!dbPermToken.isBlank()) {
            return dbPermToken;
        }
        if (props.hasPermanentToken()) {
            return props.getPermanentToken();
        }

        // Method 2 : Token temporaire — vérifier credentials dans BD puis Spring props
        String dbUsername = settings.get("payments.campay.username", "");
        String dbPassword = settings.get("payments.campay.password", "");
        boolean hasDbCreds = !dbUsername.isBlank() && !dbPassword.isBlank();

        if (!hasDbCreds && !props.hasCredentials()) {
            throw new RuntimeException(
                    "[Campay] Aucune configuration d'auth trouvée. " +
                            "Définir campay.permanent-token OU campay.username + campay.password"
            );
        }

        // Cache du token temporaire
        String tok = cachedToken.get();
        if (tok != null && System.currentTimeMillis() < tokenExpiresAt) {
            return tok;
        }

        return fetchTemporaryToken();
    }

    /**
     * POST /api/token/ — obtenir un token temporaire.
     * Synchronisé pour éviter des appels parallèles.
     */
    private synchronized String fetchTemporaryToken() {
        // Double-check après lock
        String tok = cachedToken.get();
        if (tok != null && System.currentTimeMillis() < tokenExpiresAt) {
            return tok;
        }

        String baseUrl = settings.get("payments.campay.baseUrl", props::getBaseUrl);
        String username = settings.get("payments.campay.username", props::getUsername);
        String password = settings.get("payments.campay.password", props::getPassword);

        log.debug("[Campay] Obtention d'un token temporaire...");
        try {
            CampayTokenResponse resp = webClient.post()
                    .uri(baseUrl + "/api/token/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "username", username,
                            "password", password
                    ))
                    .retrieve()
                    .bodyToMono(CampayTokenResponse.class)
                    .block();

            if (resp == null || resp.getToken() == null) {
                throw new RuntimeException("[Campay] Token null dans la réponse");
            }

            String newToken = resp.getToken();
            cachedToken.set(newToken);

            // Durée de vie : expires_in retourné ou valeur par défaut (55 min)
            long ttl = resp.getExpiresIn() != null
                    ? resp.getExpiresIn() * 1000L
                    : props.getTokenTtlMs();
            tokenExpiresAt = System.currentTimeMillis() + ttl;

            log.info("[Campay] Token temporaire obtenu (ttl={}s)", ttl / 1000);
            return newToken;

        } catch (WebClientResponseException e) {
            log.error("[Campay] Échec auth HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("[Campay] Erreur authentification : " + e.getResponseBodyAsString());
        }
    }

    /**
     * Normalise le numéro au format CamPay attendu : 237XXXXXXXXX
     *
     * ER101 → "Ensure phone starts with country code e.g 237xxxxxxxxx"
     * ER102 → "Only MTN and Orange phone numbers are accepted"
     *
     * Exemples :
     *   +237656721535   → 237656721535
     *   00237656721535  → 237656721535
     *   656721535       → 237656721535  (9 chiffres = Cameroun local)
     *   237656721535    → 237656721535  (déjà correct)
     */
    private String sanitizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new RuntimeException("[Campay] Numéro de téléphone vide");
        }
        String digits = phone.replaceAll("[^0-9]", "");

        if (digits.startsWith("00237")) return digits.substring(2);   // 00237... → 237...
        if (digits.startsWith("237"))   return digits;                 // Déjà correct
        if (digits.length() == 9)       return "237" + digits;        // Local 9 chiffres

        log.warn("[Campay] Format téléphone inattendu: '{}' → '{}'", phone, digits);
        return digits;
    }
}
