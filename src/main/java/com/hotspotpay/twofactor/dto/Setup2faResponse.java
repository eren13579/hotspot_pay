package com.hotspotpay.twofactor.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Setup2faResponse {
    private String secret;
    private String qrUri;
}
