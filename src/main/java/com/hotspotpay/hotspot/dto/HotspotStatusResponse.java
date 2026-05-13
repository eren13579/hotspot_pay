package com.hotspotpay.hotspot.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HotspotStatusResponse {
    private String hotspotId;
    private String name;
    private Boolean isOnline;
    private LocalDateTime lastPingAt;
    private String message;
}