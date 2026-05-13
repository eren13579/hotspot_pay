package com.hotspotpay.hotspot.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpdateHotspotRequest {

    @Size(max = 100)
    private String name;

    @Size(max = 255)
    private String location;

    @Pattern(
            regexp = "^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$",
            message = "Format IP invalide"
    )
    private String mikrotikIp;

    @Min(1) @Max(65535)
    private Integer mikrotikPort;

    private String mikrotikUser;
    private String mikrotikPassword;
    private String hotspotProfile;
}