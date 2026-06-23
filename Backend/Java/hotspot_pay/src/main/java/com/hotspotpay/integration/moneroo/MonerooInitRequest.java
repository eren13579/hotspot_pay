package com.hotspotpay.integration.moneroo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * Corps de la requête POST /v1/payments/initialize de Moneroo.
 *
 * Doc : https://docs.moneroo.io/fr/payments/initialiser-un-paiement
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MonerooInitRequest {

    /** Montant en centimes entiers (XAF = valeur entière) */
    @JsonProperty("amount")
    private Long amount;

    /** Code devise ISO : "XAF", "XOF", "USD"… */
    @JsonProperty("currency")
    private String currency;

    /** Description affichée sur la page de paiement */
    @JsonProperty("description")
    private String description;

    /** URL de retour après paiement (page portail captif) */
    @JsonProperty("return_url")
    private String returnUrl;

    /** Informations client */
    @JsonProperty("customer")
    private Customer customer;

    /**
     * Métadonnées libres — on y stocke notre référence interne
     * pour la retrouver depuis le webhook Moneroo.
     */
    @JsonProperty("metadata")
    private Map<String, String> metadata;

    /**
     * Méthodes de paiement autorisées (codes Moneroo).
     * Ex : ["mtn_cm", "orange_cm"]
     * Si null → Moneroo affiche toutes les méthodes disponibles.
     */
    @JsonProperty("methods")
    private List<String> methods;

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Customer {

        @JsonProperty("email")
        private String email;

        @JsonProperty("first_name")
        private String firstName;

        @JsonProperty("last_name")
        private String lastName;

        @JsonProperty("phone")
        private String phone;
    }
}
