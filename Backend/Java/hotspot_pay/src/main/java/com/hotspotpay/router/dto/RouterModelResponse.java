package com.hotspotpay.router.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class RouterModelResponse {

    private UUID id;
    private UUID brandId;
    private String brandName;
    private String name;
    private String slug;
    private String connectionType;
    private Integer defaultPort;
    private Map<String, Object> configSchema;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
