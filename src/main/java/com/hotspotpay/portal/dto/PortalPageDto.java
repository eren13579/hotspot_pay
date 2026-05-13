package com.hotspotpay.portal.dto;

import com.hotspotpay.plan.dto.PlanResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PortalPageDto {
    private String hotspotId;
    private String hotspotName;
    private String location;
    private List<PlanResponse> plans;
    private String clientMac;       // MAC détectée depuis l'URL MikroTik
    private String redirectUrl;     // URL de retour après paiement
}