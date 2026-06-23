package com.hotspotpay.twofactor.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TwoFactorStatusResponse {
    private boolean enabled;
}
