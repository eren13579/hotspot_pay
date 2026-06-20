package com.hotspotpay.dashboard.dto;

import com.hotspotpay.session.enumeration.SessionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SessionStatsDto {
    private String sessionId;
    private String hotspotId;
    private String hotspotName;
    private String planName;
    private String clientPhone;
    private String clientMac;
    private SessionStatus status;
    private LocalDateTime activatedAt;
    private LocalDateTime expiresAt;
    private String durationLabel;
    private String remainingLabel;   // "45 min restantes" ou "Expirée"
}