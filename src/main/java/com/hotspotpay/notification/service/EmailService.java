package com.hotspotpay.notification.service;

public interface EmailService {

    /** Email de bienvenue après inscription */
    void sendWelcome(String to, String fullName);

    /** Confirmation de paiement réussi + infos session WiFi */
    void sendPaymentConfirmation(String to, String reference,
                                  String amount, String planName, String hotspotName);

    /** Notification d'échec de paiement */
    void sendPaymentFailed(String to, String reference, String reason);

    /** Session WiFi activée (pour les tickets) */
    void sendTicketActivated(String to, String username, String hotspotName,
                              String expiresAt);

    /** Avertissement d'expiration de session (envoyé X minutes avant) */
    void sendSessionExpiryWarning(String to, String hotspotName, int minutesLeft);

    /** Demande de retrait enregistrée */
    void sendWithdrawalConfirmation(String to, String withdrawalId, String amount);

    /** Abonnement activé */
    void sendSubscriptionActivated(String to, String planName, String expiresAt);

    /** Abonnement expiré → rétrogradé en BASIC */
    void sendSubscriptionExpired(String to, String planName);

    /** Lien de réinitialisation de mot de passe */
    void sendPasswordReset(String to, String fullName, String resetLink);

    /** Lien de vérification d'email */
    void sendEmailVerification(String to, String fullName, String verifyLink);
}
