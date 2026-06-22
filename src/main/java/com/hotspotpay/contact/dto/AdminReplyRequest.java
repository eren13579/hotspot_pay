package com.hotspotpay.contact.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminReplyRequest {
    @NotBlank(message = "La réponse est requise")
    @Size(max = 5000, message = "La réponse ne peut pas dépasser 5000 caractères")
    private String adminReply;
}
