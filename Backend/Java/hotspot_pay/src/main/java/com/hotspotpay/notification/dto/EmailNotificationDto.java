package com.hotspotpay.notification.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmailNotificationDto {
    private String to;
    private String subject;
    private String body;
    private boolean isHtml;
}
