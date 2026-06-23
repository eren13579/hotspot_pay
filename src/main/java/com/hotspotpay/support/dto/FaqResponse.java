package com.hotspotpay.support.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Réponse API pour une question de FAQ.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FaqResponse {
    private String      id;
    private String      question;
    private String      answer;
    private String      category;
    private Integer     sortOrder;
    private Boolean     isActive;
    private LocalDateTime createdAt;
}
