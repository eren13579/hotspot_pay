package com.hotspotpay.ticket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Réponse du portail captif après connexion par ticket.
 * Ces données sont stockées dans le localStorage du navigateur
 * pour affichage ultérieur des infos de connexion.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PortalTicketResponse {

    private boolean       success;
    private String        message;

    /** Credentials actifs — stockés dans localStorage par le frontend */
    private String        username;
    private String        password;
    private String        profile;
    private String        uptimeLimit;

    /** Infos de session */
    private String        sessionId;
    private LocalDateTime activatedAt;
    private LocalDateTime expiresAt;
    private String        durationLabel;

    /** true si la session est déjà expirée (pour affichage conditionnel) */
    private boolean       expired;

    /** Statut du ticket */
    private String        ticketStatus;
}
