package com.hotspotpay.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String tokenType;
    private String userId;
    private String role;
    private String planType;
    private boolean requiresTwoFactor;
    private String tempToken;
}
