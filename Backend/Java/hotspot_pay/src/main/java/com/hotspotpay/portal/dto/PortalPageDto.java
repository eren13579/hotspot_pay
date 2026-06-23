package com.hotspotpay.portal.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hotspotpay.plan.dto.PlanResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PortalPageDto {

    private String           hotspotId;
    private String           hotspotName;
    private String           location;

    /** Forfaits WiFi disponibles (paiement Mobile Money) */
    private List<PlanResponse> plans;

    /** true s'il existe des tickets AVAILABLE → afficher l'onglet "J'ai un ticket" */
    private boolean          hasTickets;

    /** Nombre de tickets disponibles */
    private long             availableTicketsCount;

    private String           clientMac;
    private String           redirectUrl;
}
