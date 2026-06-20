package com.hotspotpay.payment.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Utilitaire de validation des webhooks opérateurs.
 *
 * Seuil de securite :
 * 1. Validation par IP whitelist (configurable)
 * 2. Validation par signature HMAC (optionnel, selon l'operateur)
 *
 * En production, configurer webhook.allowed-ips avec les IPs reelles
 * des operateurs. Laisser "*" uniquement en developpement.
 */
@Slf4j
@Component
public class WebhookValidationUtil {

    @Value("${webhook.allowed-ips:*}")
    private String allowedIpsConfig;

    /**
     * Verifie que la requente provient d'une IP autorisee.
     *
     * @param request La requete HTTP entrante
     * @return true si l'IP est autorisee ou si la configuration est desactivee ("*")
     */
    public boolean isIpAllowed(HttpServletRequest request) {
        // Mode dev : tout autoriser
        if ("*".equals(allowedIpsConfig.trim())) {
            return true;
        }

        String clientIp = extractClientIp(request);
        String[] allowedIps = allowedIpsConfig.split(",");

        for (String allowed : allowedIps) {
            if (allowed.trim().equals(clientIp)) {
                return true;
            }
        }

        log.warn("Webhook IP non autorisee: ip={} path={}", clientIp, request.getRequestURI());
        return false;
    }

    /**
     * Verifie la signature HMAC d'un payload webhook.
     *
     * @param signature La signature fournie dans le header
     * @param payload   Le body brut de la requete
     * @param secret    Le secret partage pour HMAC
     * @return true si la signature est valide
     */
    public boolean verifyHmacSignature(String signature, String payload, String secret) {
        if (signature == null || signature.isBlank()) {
            return false;
        }
        if (secret == null || secret.isBlank()) {
            log.warn("Webhook HMAC: secret non configure — verification ignoree");
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = Base64.getEncoder().encodeToString(hash);
            // Supporte aussi le format hex
            String expectedHex = bytesToHex(hash);

            return signature.equals(expected) || signature.equals(expectedHex);
        } catch (Exception e) {
            log.error("Erreur verification HMAC: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extrait l'IP reelle du client, en tenant compte des proxies (X-Forwarded-For).
     */
    public String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
