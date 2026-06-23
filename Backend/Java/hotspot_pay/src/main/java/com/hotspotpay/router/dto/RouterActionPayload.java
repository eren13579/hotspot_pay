package com.hotspotpay.router.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload pour une action routeur MikroTik.
 * Utilisé par RouterActionService pour envoyer les commandes à FastAPI.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouterActionPayload {

    /** Username MikroTik (identifiant de l'utilisateur HotSpot) */
    private String username;

    /** Password MikroTik */
    private String password;

    /** Profil HotSpot MikroTik (ex: "1mois-3000", "default") */
    private String hotspotProfile;

    /** Adresse MAC du client (optionnel) */
    private String macAddress;

    /** Durée en minutes (pour info, le format MikroTik est dans timeLimit) */
    private Integer durationMinutes;

    /** Limite de durée au format MikroTik (ex: "4w2d", "1h", "30m") */
    private String timeLimit;

    /** Limite de données — peut être String (Java) ou int (FastAPI).
     *  FastAPI gère la conversion. Envoyer tel quel. */
    private String dataLimit;

    /** Commentaire (contient le sessionId pour traçabilité) */
    private String comment;

    /** ID de session Java (pour callback après ACK) */
    private String sessionId;
}
