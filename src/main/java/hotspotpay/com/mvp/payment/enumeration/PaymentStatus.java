package hotspotpay.com.mvp.payment.enumeration;

public enum PaymentStatus {
    PENDING,    // En attente de confirmation
    PAID,       // Confirmé — accès WiFi activé
    FAILED,     // Échec paiement
    EXPIRED,    // Timeout dépassé sans confirmation
    REFUNDED    // Remboursé (post-MVP)
}