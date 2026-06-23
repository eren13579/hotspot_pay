package com.hotspotpay.router.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Callback de FastAPI vers Java pour notifier l'activation d'une session WiFi.
 * Envoyé par FastAPI après réception de l'ACK du routeur MikroTik.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionActivationCallback {

    /** ID de la session Java (pas l'action FastAPI) */
    private String sessionId;

    /** ID de l'action FastAPI (pour traçabilité) */
    private String actionId;

    /** Username MikroTik créé sur le routeur */
    private String username;

    /** true si le routeur a confirmé succès */
    private boolean success;

    /** Message d'erreur si échec */
    private String error;
}
