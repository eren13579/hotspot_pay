package com.hotspotpay.router.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from FastAPI microservice for router token generation.
 * Structure plate correspondant à la réponse FastAPI.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RouterTokenResponse {

    private boolean success;
    private String message;
    private String timestamp;

    @JsonProperty("hotspot_id")
    private String hotspotId;

    @JsonProperty("router_token")
    private String routerToken;

    @JsonProperty("polling_url")
    private String pollingUrl;

    @JsonProperty("portal_url")
    private String portalUrl;

    @JsonProperty("script_download_url")
    private String scriptDownloadUrl;

    @JsonProperty("mikrotik_script")
    private String mikrotikScript;

    @JsonProperty("generated_at")
    private String generatedAt;
}
