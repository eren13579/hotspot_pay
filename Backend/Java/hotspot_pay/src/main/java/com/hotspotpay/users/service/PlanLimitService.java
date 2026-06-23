package com.hotspotpay.users.service;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.plan.repository.PlanRepository;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.hotspotpay.users.role.PlanLimits;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Service centralisé de vérification des limites liées au planType de l'utilisateur.
 *
 * Usage :
 *   planLimitService.assertCanAddHotspot(userId);
 *   planLimitService.assertCanAddPlan(userId, hotspotId);
 *   planLimitService.assertCanWithdraw(userId, amount);
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlanLimitService {

    private final UserRepository    userRepository;
    private final HotspotRepository hotspotRepository;
    private final PlanRepository    planRepository;

    // ── Hotspot ───────────────────────────────────────────────────────────

    /**
     * Vérifie que l'utilisateur peut encore créer un hotspot selon son plan.
     * @throws AppException 403 si la limite est atteinte.
     */
    public void assertCanAddHotspot(String userId) {
        PlanLimits limits = resolveLimits(userId);
        long current = hotspotRepository.countByUserId(userId);
        if (current >= limits.getMaxHotspots()) {
            throw AppException.forbidden(String.format(
                    "Limite atteinte : votre plan %s autorise %d hotspot(s). " +
                    "Passez au plan supérieur pour en ajouter davantage.",
                    getPlanType(userId), limits.getMaxHotspots()));
        }
    }

    // ── Plans WiFi ────────────────────────────────────────────────────────

    /**
     * Vérifie que l'utilisateur peut encore créer un forfait WiFi sur ce hotspot.
     */
    public void assertCanAddPlan(String userId, String hotspotId) {
        PlanLimits limits = resolveLimits(userId);
        long current = planRepository.countByHotspotId(hotspotId);
        if (current >= limits.getMaxPlansPerHotspot()) {
            throw AppException.forbidden(String.format(
                    "Limite atteinte : votre plan %s autorise %d forfait(s) par hotspot.",
                    getPlanType(userId), limits.getMaxPlansPerHotspot()));
        }
    }

    // ── Retraits ──────────────────────────────────────────────────────────

    /**
     * Vérifie qu'un retrait est autorisé pour ce montant selon le plan.
     */
    public void assertCanWithdraw(String userId, BigDecimal amount) {
        PlanLimits limits = resolveLimits(userId);

        if (!limits.isCanWithdraw()) {
            throw AppException.forbidden(
                    "Les retraits ne sont pas disponibles sur le plan BASIC. " +
                    "Passez au plan PRO ou ENTERPRISE.");
        }

        if (amount.compareTo(limits.getMinWithdrawalAmountXAF()) < 0) {
            throw AppException.badRequest(String.format(
                    "Montant minimum de retrait : %s XAF pour le plan %s.",
                    limits.getMinWithdrawalAmountXAF().toPlainString(), getPlanType(userId)));
        }

        if (amount.compareTo(limits.getMaxWithdrawalAmountXAF()) > 0) {
            throw AppException.badRequest(String.format(
                    "Montant maximum de retrait : %s XAF pour le plan %s. " +
                    "Passez au plan ENTERPRISE pour des plafonds plus élevés.",
                    limits.getMaxWithdrawalAmountXAF().toPlainString(), getPlanType(userId)));
        }
    }

    // ── Analytics avancées ────────────────────────────────────────────────

    /**
     * Vérifie que l'utilisateur a accès aux statistiques avancées.
     */
    public void assertAdvancedAnalytics(String userId) {
        PlanLimits limits = resolveLimits(userId);
        if (!limits.isAdvancedAnalytics()) {
            throw AppException.forbidden(
                    "Les statistiques avancées sont réservées aux plans PRO et ENTERPRISE.");
        }
    }

    // ── Utilitaires publics ───────────────────────────────────────────────

    /** Retourne les limites du plan de l'utilisateur */
    public PlanLimits getLimits(String userId) {
        return resolveLimits(userId);
    }

    /** Retourne true si l'utilisateur peut encore créer un hotspot */
    public boolean canAddHotspot(String userId) {
        PlanLimits limits = resolveLimits(userId);
        long current = hotspotRepository.countByUserId(userId);
        return current < limits.getMaxHotspots();
    }

    // ── Privé ─────────────────────────────────────────────────────────────

    private PlanLimits resolveLimits(String userId) {
        String planType = getPlanType(userId);
        return PlanLimits.of(planType);
    }

    private String getPlanType(String userId) {
        return userRepository.findByUserId(userId)
                .map(User::getPlanType)
                .orElse("BASIC");
    }
}
