package com.hotspotpay.users.role;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

/**
 * Limites et fonctionnalités associées à chaque type de plan SaaS.
 * BASIC   → plan gratuit / démarrage
 * PRO     → plan intermédiaire (le plus populaire)
 * ENTERPRISE → plan illimité
 */
@Getter
@RequiredArgsConstructor
public enum PlanLimits {

    BASIC(
            1,                          // maxHotspots
            10,                          // maxPlansPerHotspot
            new BigDecimal("50000"),     // maxWithdrawalAmountXAF
            new BigDecimal("0"),         // minWithdrawalAmountXAF (pas de retrait BASIC)
            false,                       // canWithdraw
            false,                       // advancedAnalytics
            false,                       // prioritySupport
            1                            // dataRetentionDays (en mois)
    ),

    PRO(
            10,
            20,
            new BigDecimal("500000"),
            new BigDecimal("5000"),
            true,
            true,
            false,
            6
    ),

    ENTERPRISE(
            Integer.MAX_VALUE,
            Integer.MAX_VALUE,
            new BigDecimal("5000000"),
            new BigDecimal("5000"),
            true,
            true,
            true,
            24
    );

    /** Nombre maximum de hotspots autorisés */
    private final int maxHotspots;

    /** Nombre maximum de forfaits (plans WiFi) par hotspot */
    private final int maxPlansPerHotspot;

    /** Montant maximum par demande de retrait (XAF) */
    private final BigDecimal maxWithdrawalAmountXAF;

    /** Montant minimum pour déclencher un retrait (XAF) */
    private final BigDecimal minWithdrawalAmountXAF;

    /** L'utilisateur peut-il effectuer des retraits ? */
    private final boolean canWithdraw;

    /** Accès aux statistiques avancées du dashboard */
    private final boolean advancedAnalytics;

    /** Support prioritaire */
    private final boolean prioritySupport;

    /** Conservation des données (en mois) */
    private final int dataRetentionMonths;

    /**
     * Résout les limites à partir d'un planType String (insensible à la casse).
     * Renvoie BASIC si la valeur est inconnue.
     */
    public static PlanLimits of(String planType) {
        if (planType == null) return BASIC;
        try {
            return valueOf(planType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return BASIC;
        }
    }
}