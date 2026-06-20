package com.hotspotpay.systemsettings.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettingItemResponse {

    private String key;
    private String sectionKey;
    private String sectionLabel;
    private String label;
    private String description;
    private String type;
    private String value;
    private Boolean secret;
    private Boolean editable;
}
