package com.hotspotpay.publicapi.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicSettingsResponse {
    private String logoUrl;
    private String primaryColor;
    private String faviconUrl;
    private String appName;
    private String supportEmail;
    private Boolean maintenanceMode;
    private Boolean registrationEnabled;
    private Boolean aboutEnabled;
    private String aboutTitle;
    private String aboutSubtitle;
    private String aboutDescription;
    private List<String> aboutPhotos;
    private LocalDateTime updatedAt;
}
