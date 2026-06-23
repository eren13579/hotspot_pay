package com.hotspotpay.contact.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateStatusRequest {
    @NotBlank(message = "Le statut est requis")
    private String status;
}
