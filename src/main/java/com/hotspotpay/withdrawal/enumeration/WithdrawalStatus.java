package com.hotspotpay.withdrawal.enumeration;

public enum WithdrawalStatus {
    PENDING,   // demande initiée
    PROCESSING,// en cours de traitement
    COMPLETED, // retrait effectué
    FAILED,    // échec
    CANCELLED  // annulé par l'utilisateur
}
