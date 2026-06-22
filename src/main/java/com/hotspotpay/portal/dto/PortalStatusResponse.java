package com.hotspotpay.portal.dto;

import com.hotspotpay.payment.enumeration.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PortalStatusResponse {
    private String reference;
    private PaymentStatus status;
    private String message;
    private boolean wifiActivated;
    /** true si paiement confirmé mais activation MikroTik encore en cours */
    private boolean activationPending;
    /** true si auto-connect désactivé et credentials disponibles pour connexion manuelle */
    private boolean credentialsAvailable;
    /** Nom d'utilisateur WiFi pour connexion manuelle */
    private String manualUsername;
    /** Mot de passe WiFi pour connexion manuelle */
    private String manualPassword;
    // Rempli quand wifiActivated = true
    private SessionInfo session;

    @Getter
    @Builder
    public static class SessionInfo {
        private String sessionId;
        private LocalDateTime activatedAt;
        private LocalDateTime expiresAt;
        private String durationLabel;
        private String planName;
    }
}