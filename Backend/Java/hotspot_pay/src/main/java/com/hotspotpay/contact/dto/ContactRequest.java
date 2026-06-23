package com.hotspotpay.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactRequest {

    @NotBlank(message = "Le nom est requis")
    @Size(max = 150)
    private String fullName;

    @NotBlank(message = "L'email est requis")
    @Email(message = "Email invalide")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Le téléphone est requis")
    @Size(max = 30)
    private String phone;

    @Size(max = 5000)
    private String message;
}
