package com.hotspotpay.support.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactPublicRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 150, message = "Nom trop long")
    private String fullName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email invalide")
    @Size(max = 255)
    private String email;

    @Size(max = 20, message = "Numéro de téléphone trop long")
    private String phone;

    @NotBlank(message = "Le message est obligatoire")
    @Size(max = 5000, message = "Message trop long")
    private String message;
}
