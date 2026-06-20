package com.hotspotpay.systemsettings.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionResponse {

    private String key;
    private String label;
    private List<SettingItemResponse> items;
}
