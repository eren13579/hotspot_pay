package com.hotspotpay.integration.campay;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration Campay — injectée depuis application.properties / variables d'env.
 *
 * Propriétés :
 *   campay.username         → nom d'utilisateur API Campay
 *   campay.password         → mot de passe API Campay
 *   campay.base-url         → https://demo.campay.net (sandbox) ou https://www.campay.net (prod)
 *   campay.callback-url     → URL publique appelée par Campay en cas de succès/échec
 *   campay.redirect-url     → URL de redirection après paiement (portail captif)
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "campay")
public class CampayProperties {

    private String username = "";
    private String password = "";
    private String baseUrl  = "https://demo.campay.net";
    private String callbackUrl  = "http://localhost:8080/api/V1/payments/campay/webhook";
    private String redirectUrl  = "http://localhost:8080/api/V1/portal/status";

    /** Timeout (ms) pour les appels WebClient */
    private int timeoutMs = 15_000;
}