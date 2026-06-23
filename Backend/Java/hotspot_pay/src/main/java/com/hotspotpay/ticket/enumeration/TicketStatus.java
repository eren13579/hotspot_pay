package com.hotspotpay.ticket.enumeration;

/**
 * Cycle de vie d'un ticket WiFi.
 *
 * AVAILABLE → Importé, non utilisé — disponible pour connexion
 * USED      → Client connecté avec ce ticket
 * EXPIRED   → Délai écoulé (uptime_limit atteint)
 * REVOKED   → Révoqué manuellement par le propriétaire
 */
public enum TicketStatus {
    AVAILABLE,
    USED,
    EXPIRED,
    REVOKED
}
