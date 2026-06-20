package com.hotspotpay.payment.enumeration;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentOperator {
    MTN_MOMO,
    ORANGE_MONEY,
    MONEROO,
    CAMPAY;

    /**
     * Deserialize depuis une chaîne JSON, avec support des alias courants :
     * "MTN" → MTN_MOMO, "ORANGE" → ORANGE_MONEY
     * Insensible à la casse.
     */
    @JsonCreator
    public static PaymentOperator fromString(String value) {
        if (value == null || value.isBlank()) return null;
        return switch (value.toUpperCase().trim()) {
            case "MTN", "MTN_MOMO" -> MTN_MOMO;
            case "ORANGE", "ORANGE_MONEY" -> ORANGE_MONEY;
            case "MONEROO" -> MONEROO;
            case "CAMPAY" -> CAMPAY;
            default -> throw new IllegalArgumentException(
                    "Opérateur inconnu : '" + value + "'. Valeurs acceptées : MTN, MTN_MOMO, ORANGE, ORANGE_MONEY, MONEROO, CAMPAY"
            );
        };
    }

    /**
     * Sérialisation JSON : renvoie le nom canonique de l'enum.
     */
    @JsonValue
    public String toValue() {
        return name();
    }
}