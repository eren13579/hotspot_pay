package com.hotspotpay.users.role;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

/**
 * Limites et fonctionnalités associées à chaque type de plan SaaS.
 * Ces valeurs sont la copie locale des plans stockés dans FastAPI.
 *
 * TODO: Migrer vers une lecture dynamique depuis FastAPI pour que
 *       les modifications admin soient appliquées sans redéploiement Java.
 *
 * STANDARD → 1 hotspot MikroTik, gratuit
 * PRO      → 4 hotspots, marques variées
 * PREMIUM  → 10 hotspots, toutes marques
 */
@Getter
@RequiredArgsConstructor
public enum PlanLimits {

    STANDARD(
            1,                          // maxHotspots
            7,                          // maxPlansPerHotspot
            new BigDecimal("50000"),     // maxWithdrawalAmountXAF
            new BigDecimal("0"),         // minWithdrawalAmountXAF
            false,                       // canWithdraw
            false,                       // advancedAnalytics
            false,                       // prioritySupport
            1                            // dataRetentionMonths
    ),

    PRO(
            4,
            20,
            new BigDecimal("500000"),
            new BigDecimal("5000"),
            true,
            true,
            false,
            6
    ),

    PREMIUM(
            10,
            999,
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
     * Gère les anciens noms BASIC→STANDARD, ENTERPRISE→PREMIUM pour la rétrocompat.
     */
    public static PlanLimits of(String planType) {
        if (planType == null) return STANDARD;
        return switch (planType.toUpperCase()) {
            case "STANDARD", "BASIC" -> STANDARD;
            case "PRO" -> PRO;
            case "PREMIUM", "ENTERPRISE" -> PREMIUM;
            default -> STANDARD;
        };
    }
}
