package com.hotspotpay.ticket.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Requête du portail captif quand le client choisit de se connecter
 * avec un ticket (username/password) au lieu de payer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PortalTicketRequest {

    @NotBlank(message = "Le username est obligatoire")
    private String username;

    @NotBlank(message = "Le password est obligatoire")
    private String password;

    /** Adresse MAC du client (récupérée automatiquement par le portail captif) */
    private String mac;

    /** Numéro de téléphone optionnel (pour notification de session) */
    private String phone;
}
