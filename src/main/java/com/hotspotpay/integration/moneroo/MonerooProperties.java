package com.hotspotpay.integration.moneroo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration Moneroo — injectée depuis application.properties / variables d'env.
 *
 * Propriétés :
 *   moneroo.api-key         → clé API privée Moneroo (Bearer token)
 *   moneroo.base-url        → https://api.moneroo.io
 *   moneroo.return-url      → URL de retour après paiement
 *   moneroo.notify-url      → Webhook URL appelée par Moneroo (succès/échec)
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "moneroo")
public class MonerooProperties {

    private String apiKey    = "";
    private String baseUrl   = "https://api.moneroo.io";
    private String returnUrl = "http://localhost:8080/api/V1/portal/status";
    private String notifyUrl = "http://localhost:8080/api/V1/payments/moneroo/webhook";

    /** Devise par défaut */
    private String currency = "XAF";

    /** Timeout (ms) */
    private int timeoutMs = 15_000;
}