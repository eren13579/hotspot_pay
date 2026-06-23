package com.hotspotpay.ticket.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.hotspotpay.ticket.enumeration.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class TicketResponse {
    private String        ticketId;
    private String        hotspotId;
    private String        username;
    private String        password;
    private String        profile;
    private String        comment;
    private String        uptimeLimit;
    private String        dataLimit;
    private TicketStatus  status;
    private String        clientMac;
    private LocalDateTime usedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
