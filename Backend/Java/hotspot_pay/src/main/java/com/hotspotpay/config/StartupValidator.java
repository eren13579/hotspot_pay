package com.hotspotpay.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Validation critique au démarrie — refuse de démarrer en prod
 * si les secrets ne sont pas configurés via variables d'environnement.
 */
@Slf4j
@Configuration
public class StartupValidator {

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${jasypt.encryptor.password:}")
    private String jasyptKey;

    @Value("${moneroo.api-key:}")
    private String monerooApiKey;

    @Value("${moneroo.webhook-secret:}")
    private String monerooWebhookSecret;

    @Value("${fastapi.api-key:}")
    private String fastApiKey;

    @Value("${fastapi.callback-secret:}")
    private String fastApiCallbackSecret;

    @Value("${webhook.allowed-ips:*}")
    private String webhookAllowedIps;

    @Value("${cors.allowed-origins:*}")
    private String corsAllowedOrigins;

    @PostConstruct
    public void validate() {
        String profiles = System.getProperty("spring.profiles.active", "");
        if (profiles == null || profiles.isBlank()) profiles = System.getenv("SPRING_PROFILES_ACTIVE");
        if (profiles == null || profiles.isBlank()) profiles = System.getProperty("spring-boot.run.profiles", "");
        boolean isDev = profiles != null && profiles.contains("dev");

        if (isDev) {
            log.warn("=== MODE DEVELOPPEMENT — validations de securite assouplies ===");
            // En dev, generer des valeurs par defaut pour les secrets optionnels
            return;
        }

        StringBuilder errors = new StringBuilder();

        if (isBlank(jwtSecret) || jwtSecret.length() < 32) {
            errors.append("\n  ❌ JWT_SECRET: manquant ou < 32 caractères (générer: openssl rand -base64 48)");
        }
        if (isBlank(dbPassword)) {
            errors.append("\n  ❌ DB_PASSWORD: manquant — définir la variable d'environnement");
        }
        if (isBlank(jasyptKey)) {
            errors.append("\n  ❌ JASYPT_KEY: manquant — définir la variable d'environnement");
        }
        if (!"*".equals(webhookAllowedIps.trim())) {
            log.info("✅ WEBHOOK_ALLOWED_IPS configuré: {}", webhookAllowedIps);
        } else {
            log.warn("⚠️  WEBHOOK_ALLOWED_IPS=* (toutes IPs autorisées) — dangereux en production !");
        }
        if ("*".equals(corsAllowedOrigins.trim())) {
            log.warn("⚠️  CORS autorisé pour toutes les origines — dangereux en production !");
        }
        if (isBlank(fastApiKey) || "change-me-to-a-strong-api-key".equals(fastApiKey)) {
            log.warn("⚠️  FASTAPI_API_KEY: valeur par défaut — changez-la en production !");
        }
        if (isBlank(fastApiCallbackSecret) || "change-me-callback-secret".equals(fastApiCallbackSecret)) {
            log.warn("⚠️  FASTAPI_CALLBACK_SECRET: valeur par défaut — changez-la en production !");
        }
        if (isBlank(monerooApiKey)) {
            log.warn("⚠️  MONEROO_API_KEY: manquant — les paiements Moneroo ne fonctionneront pas");
        }
        if (isBlank(monerooWebhookSecret)) {
            log.warn("⚠️  MONEROO_WEBHOOK_SECRET: manquant — les webhooks Moneroo ne seront pas vérifiés");
        }

        if (errors.length() > 0) {
            String msg = "╔══════════════════════════════════════════════════════╗\n" +
                         "║  CONFIGURATION CRITIQUE MANQUANTE — DÉMARRAGE BLOQUÉ ║\n" +
                         "╠══════════════════════════════════════════════════════╣" +
                         errors.toString() + "\n" +
                         "╚══════════════════════════════════════════════════════╝";
            log.error(msg);
            throw new IllegalStateException(msg);
        }

        log.info("✅ Validation de configuration réussie — prêt pour la production");
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
