package com.hotspotpay.payment.gateway;

import com.hotspotpay.payment.enumeration.PaymentOperator;

import java.math.BigDecimal;

public interface MoMoGateway {

    /**
     * Initie une demande de paiement vers le client.
     * @return l'ID de transaction retourné par l'opérateur
     */
    String requestToPay(String phone, BigDecimal amount,
                        String currency, String reference,
                        String description);

    /**
     * Vérifie le statut d'une transaction auprès de l'opérateur.
     */
    TransactionStatus getTransactionStatus(String transactionId);

    enum TransactionStatus {
        PENDING,
        SUCCESSFUL,
        FAILED
    }

    public PaymentOperator getOperator();
}