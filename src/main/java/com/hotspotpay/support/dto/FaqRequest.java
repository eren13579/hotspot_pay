package com.hotspotpay.support.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Requête pour créer ou modifier une FAQ (admin).
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FaqRequest {
    @NotBlank(message = "La question est requise")
    private String  question;

    @NotBlank(message = "La réponse est requise")
    private String  answer;

    private String  category;
    private Integer sortOrder;
    private Boolean isActive;
}
