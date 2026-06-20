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