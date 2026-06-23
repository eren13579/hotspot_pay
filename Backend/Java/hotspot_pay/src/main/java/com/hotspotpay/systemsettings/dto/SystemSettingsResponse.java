package com.hotspotpay.systemsettings.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettingsResponse {

    private LocalDateTime updatedAt;
    private List<SectionResponse> sections;
}
