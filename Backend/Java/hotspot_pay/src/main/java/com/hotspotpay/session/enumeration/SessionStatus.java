package com.hotspotpay.session.enumeration;

/**
 * Cycle de vie d'une session WiFi HotspotPay.
 *
 * PENDING_MIKROTIK → Paiement confirmé. En attente d'exécution par le routeur MikroTik.
 *                    La session est créée en DB mais l'accès WiFi n'est pas encore actif.
 *                    Passe en ACTIVE quand le routeur confirme via POST .../done.
 *
 * ACTIVE           → Session WiFi active — le client a accès internet.
 *
 * EXPIRED          → Expirée naturellement (durée du forfait écoulée).
 *                    RouterAction REMOVE_USER créée par SessionExpiryJob.
 *
 * REVOKED          → Révoquée manuellement par le propriétaire du hotspot.
 *                    RouterAction KICK_SESSION + REMOVE_USER créées par SessionService.
 */
public enum SessionStatus {
    PENDING_MIKROTIK,
    ACTIVE,
    EXPIRED,
    REVOKED
}
