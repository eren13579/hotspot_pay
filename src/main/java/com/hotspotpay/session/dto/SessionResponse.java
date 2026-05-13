package com.hotspotpay.session.dto;

import com.hotspotpay.session.enumeration.SessionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SessionResponse {
    private String sessionId;
    private String paymentId;
    private String hotspotId;
    private String planId;
    private String planName;
    private String clientPhone;
    private String clientMac;
    private SessionStatus status;
    private LocalDateTime activatedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime expiredAt;
    private String durationLabel;
    private String remainingLabel;
    private Long bytesIn;
    private Long bytesOut;
    private LocalDateTime createdAt;
}