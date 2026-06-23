package com.hotspotpay.router.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RouterBrandResponse {

    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private Boolean isActive;
    private Long modelCount;
    private LocalDateTime createdAt;
}
