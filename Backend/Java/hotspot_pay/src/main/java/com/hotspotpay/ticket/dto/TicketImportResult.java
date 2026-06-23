package com.hotspotpay.ticket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketImportResult {
    private int          total;
    private int          imported;
    private int          skipped;        // doublons username déjà existants
    private List<String> skippedUsernames;
    private String       message;
}
