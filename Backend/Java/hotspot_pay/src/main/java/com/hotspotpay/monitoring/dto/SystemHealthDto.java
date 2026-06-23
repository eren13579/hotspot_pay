package com.hotspotpay.monitoring.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
public class SystemHealthDto {
    private String              status;
    private LocalDateTime       checkedAt;
    private Map<String, String> components;
    private long                pendingPayments;
    private long                activeSessions;
    private long                onlineHotspots;
    private String              appVersion;
}
