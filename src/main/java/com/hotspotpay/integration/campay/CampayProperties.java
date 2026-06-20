package com.hotspotpay.integration.campay;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration Campay — injectée depuis application.properties / variables d'env.
 *
 * Deux méthodes d'auth (selon la doc officielle Campay) :
 *
 *   Method 1 — Token permanent (RECOMMANDÉ) :
 *     campay.permanent-token=TOKEN_DEPUIS_APP_KEYS_DASHBOARD
 *     → Pas d'expiration, pas de refresh. Trouvé dans dashboard → APP KEYS.
 *
 *   Method 2 — Token temporaire :
 *     campay.username=VOTRE_USERNAME
 *     campay.password=VOTRE_PASSWORD
 *     → Token obtenu via POST /api/token/ — expire après ~1h.
 *
 * Priorité : permanent-token est utilisé si défini, sinon username/password.
 *
 * Sandbox    : campay.base-url=https://demo.campay.net
 * Production : campay.base-url=https://www.campay.net
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "campay")
public class CampayProperties {

    // ── Method 1 : Token permanent (APP KEYS du dashboard) ─────────────────
    private String permanentToken = "";

    // ── Method 2 : Token temporaire ────────────────────────────────────────
    private String username = "";
    private String password = "";

    // ── URLs ───────────────────────────────────────────────────────────────
    private String baseUrl            = "https://demo.campay.net";
    private String callbackUrl        = "http://localhost:8080/api/V1/payments/campay/webhook";
    private String redirectUrl        = "http://localhost:8080/api/V1/portal/status";
    private String failureRedirectUrl = "http://localhost:8080/api/V1/portal/status?status=failed";

    /** Timeout WebClient en ms */
    private int timeoutMs = 15_000;

    /**
     * Durée de vie du token temporaire en ms.
     * Campay ne retourne pas toujours expires_in → valeur conservative (55 min).
     */
    private long tokenTtlMs = 55 * 60 * 1000L;

    // ── Helpers ────────────────────────────────────────────────────────────
    public boolean hasPermanentToken() {
        return permanentToken != null && !permanentToken.isBlank();
    }

    public boolean hasCredentials() {
        return username != null && !username.isBlank()
                && password != null && !password.isBlank();
    }
}
