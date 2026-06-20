package com.hotspotpay.router.enumeration;

/**
 * Types d'actions envoyées au routeur MikroTik via FastAPI.
 */
public enum RouterActionType {
    /** Crée un utilisateur HotSpot sur le routeur */
    CREATE_USER,

    /** Supprime un utilisateur HotSpot du routeur */
    REMOVE_USER,

    /** Déconnecte la session active d'un utilisateur */
    KICK_SESSION
}
