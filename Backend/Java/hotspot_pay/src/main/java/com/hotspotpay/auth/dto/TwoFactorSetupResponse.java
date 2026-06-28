package com.hotspotpay.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TwoFactorSetupResponse {
    private String secret;
    private String qrUri;
    private String method;
}
