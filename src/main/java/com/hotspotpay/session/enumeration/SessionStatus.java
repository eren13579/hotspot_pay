package com.hotspotpay.session.enumeration;

public enum SessionStatus {
    ACTIVE,   // Session en cours — accès WiFi actif
    EXPIRED,  // Expiré naturellement (durée forfait écoulée)
    REVOKED   // Révoqué manuellement par le propriétaire
}