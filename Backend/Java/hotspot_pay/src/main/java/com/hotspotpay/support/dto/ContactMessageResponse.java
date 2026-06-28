package com.hotspotpay.support.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Réponse API pour un message de contact.
 * Le champ adminReply n'est visible que par les admins.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContactMessageResponse {
    private String      id;
    private String      name;
    private String      email;
    private String      subject;
    private String      message;
    private String      adminReply;
    private String      status;
    private LocalDateTime createdAt;
}
