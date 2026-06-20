package com.hotspotpay.users.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserProfileResponse {
    private UserResponse user;
    private JsonNode subscription;
}
