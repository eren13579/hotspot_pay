// ==== FICHIER 8: ErrorMessageConstants.java ====
package com.hotspotpay.common.constants;

public class ErrorMessageConstants {

    // Authentication
    public static final String EMAIL_ALREADY_EXISTS = "Cet email est déjà utilisé";
    public static final String PHONE_ALREADY_EXISTS = "Ce numéro est déjà utilisé";
    public static final String INVALID_CREDENTIALS = "Email ou mot de passe incorrect";
    public static final String ACCOUNT_DISABLED = "Compte désactivé — contactez le support";

    // Payment
    public static final String PAYMENT_NOT_FOUND = "Paiement introuvable";
    public static final String HOTSPOT_OFFLINE = "Le routeur WiFi est hors ligne";
    public static final String PLAN_NOT_AVAILABLE = "Ce forfait n'est plus disponible";
    public static final String WITHDRAWAL_LIMIT_EXCEEDED = "Dépassement des limites de retrait";
    public static final String MINIMUM_WITHDRAWAL_AMOUNT = "Montant minimum requis: 100";

    // Subscription
    public static final String NO_ACTIVE_SUBSCRIPTION = "Aucun abonnement actif";
    public static final String SUBSCRIPTION_EXPIRED = "Abonnement expiré";

    // Session
    public static final String SESSION_EXPIRED = "Session WiFi expirée";
    public static final String SESSION_NOT_FOUND = "Session introuvable";

    // Gateway
    public static final String GATEWAY_ERROR = "Erreur du gateway de paiement";
    public static final String GATEWAY_TIMEOUT = "Timeout du gateway de paiement";
    public static final String GATEWAY_UNAVAILABLE = "Gateway de paiement indisponible";
}