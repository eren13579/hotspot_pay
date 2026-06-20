package com.hotspotpay.ticket.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Requête d'import de tickets depuis MikroTik.
 * Le frontend envoie la liste des users copiés depuis /ip hotspot user print.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TicketImportRequest {

    @NotEmpty(message = "La liste de tickets ne peut pas être vide")
    @Size(max = 500, message = "Maximum 500 tickets par import")
    @Valid
    private List<TicketItem> tickets;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TicketItem {

        @NotBlank(message = "Le username est obligatoire")
        private String username;

        @NotBlank(message = "Le password est obligatoire")
        private String password;

        /** Profil MikroTik (ex: "1mois-3000") */
        private String profile;

        /** Commentaire libre MikroTik */
        private String comment;

        /** Limite de durée MikroTik (ex: "4w2d" = 4 semaines 2 jours) */
        private String timeLimit;

        /** Limite de données en octets (ex: 6291456 = 6MB) */
        private Long dataLimit;
    }
}
