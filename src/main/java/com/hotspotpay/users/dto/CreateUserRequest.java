package com.hotspotpay.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateUserRequest {

    @NotBlank(message = "Le nom est requis")
    @Size(max = 100, message = "Nom trop long")
    private String fullName;

    @NotBlank(message = "L'email est requis")
    @Email(message = "Email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 8, message = "Au moins 8 caractères")
    private String password;

    @Size(max = 5, message = "Code pays invalide")
    private String country;

    @Pattern(
            regexp = "^\\+?[1-9]\\d{7,14}$",
            message = "Format téléphone invalide"
    )
    private String phone;

    private String role;

    private String planType;
}
