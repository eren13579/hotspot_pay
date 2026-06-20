package com.hotspotpay.integration.moneroo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration Moneroo injectée depuis application.properties / variables d'env.
 *
 * moneroo.api-key    → clé secrète Bearer (tableau de bord Moneroo → API Keys)
 * moneroo.base-url   → https://api.moneroo.io
 * moneroo.return-url → page de retour après paiement (portail captif)
 * moneroo.notify-url → URL webhook appelée par Moneroo après paiement
 * moneroo.secret     → secret de signature des webhooks (X-Moneroo-Signature)
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "moneroo")
public class MonerooProperties {

    private String apiKey    = "";
    private String baseUrl   = "https://api.moneroo.io";
    private String returnUrl = "http://localhost:8080/api/V1/portal/status";
    private String notifyUrl = "http://localhost:8080/api/V1/payments/webhook/moneroo";

    /**
     * Secret de signature configuré dans le dashboard Moneroo.
     * Utilisé pour vérifier l'en-tête X-Moneroo-Signature.
     */
    private String webhookSecret = "";

    /** Devise par défaut pour le Cameroun */
    private String currency = "XAF";

    /** Méthodes de paiement autorisées (codes Moneroo) */
    private java.util.List<String> methods = java.util.List.of("mtn_cm", "orange_cm");

    /** Timeout HTTP (ms) */
    private int timeoutMs = 15_000;
}
