package com.hotspotpay.faq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FaqRequest {

    @NotBlank(message = "La question est obligatoire")
    private String question;

    @NotBlank(message = "La réponse est obligatoire")
    private String answer;

    @NotBlank(message = "La catégorie est obligatoire")
    private String category;

    private int sortOrder;

    @Builder.Default
    private boolean isActive = true;
}
