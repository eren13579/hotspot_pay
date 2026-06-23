package com.hotspotpay.users.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 100, message = "Nom trop long")
    private String fullName;

    @Size(max = 5, message = "Code pays invalide")
    private String country;

    @Pattern(
            regexp = "^\\+?[1-9]\\d{7,14}$",
            message = "Format téléphone invalide"
    )
    private String phone;

    private String planType;

    private Boolean isActive;

    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @Size(min = 8, message = "Veuillez confirmer votre mot de passe")
    private String confirmPassword;

    private Boolean autoConnect;
}