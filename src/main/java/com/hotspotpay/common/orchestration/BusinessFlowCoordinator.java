// ==== FICHIER CLÉS 1: BusinessFlowCoordinator.java ====
package com.hotspotpay.common.orchestration;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.plan.service.PlanFeatureService;
import com.hotspotpay.session.model.Session;
import com.hotspotpay.session.repository.SessionRepository;
import com.hotspotpay.subscription.enumeration.SubscriptionStatus;
import com.hotspotpay.subscription.model.Subscription;
import com.hotspotpay.subscription.repository.SubscriptionRepository;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.hotspotpay.payment.service.WithdrawalQuotaService;

import java.time.LocalDateTime;

/**
 * Orchestrateur principal des flux métier
 * Responsable de coordonner les différents services
 * et d'assurer la cohérence des données
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BusinessFlowCoordinator {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SessionRepository sessionRepository;
    private final PlanFeatureService planFeatureService;
    private final AuditService auditService;
    private final WithdrawalQuotaService withdrawalQuotaService;
    /**
     * FLUX 1: Activating WiFi Session After Payment
     *
     * Étapes:
     * 1. Valider que le paiement est confirmé
     * 2. Créer la session
     * 3. Enregistrer dans l'audit
     * 4. Retourner les credentials
     */
    @Transactional
    public void onPaymentConfirmed(Payment payment, String username, String password) {
        log.info("🔄 FLUX: Payment Confirmed → Activating Session | Payment: {}", payment.getReference());

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalStateException("Payment must be PAID to activate session");
        }

        try {
            // Créer la session WiFi
            Session session = Session.builder()
                    .sessionId(java.util.UUID.randomUUID().toString())
                    .paymentId(payment.getPaymentId())
                    .hotspotId(payment.getHotspotId())
                    .planId(payment.getPlanId())
                    .clientPhone(payment.getClientPhone())
                    .clientMac(payment.getClientMac())
                    .mikrotikUsername(username)
                    .mikrotikPassword(password)
                    .status(com.hotspotpay.session.enumeration.SessionStatus.ACTIVE)
                    .activatedAt(LocalDateTime.now())
                    // TODO: Get duration from plan
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();

            sessionRepository.save(session);

            // Audit log
            auditService.log(
                    "SYSTEM",
                    "SESSION_ACTIVATED",
                    "Session",
                    java.util.Map.of(
                            "sessionId", session.getSessionId(),
                            "paymentId", payment.getPaymentId(),
                            "phone", payment.getClientPhone(),
                            "status", session.getStatus().name(),
                            "message", "WiFi session created after payment confirmation"
                    ),
                    payment.getClientPhone()
            );

            log.info("FLUX: Session activated | SessionId: {}", session.getSessionId());

        } catch (Exception e) {
            log.error("FLUX: Session activation failed", e);
            auditService.log(
                    "SYSTEM",
                    "SESSION_ACTIVATION_FAILED",
                    "Payment",
                    java.util.Map.of(
                            "paymentId", payment.getPaymentId(),
                            "reference", payment.getReference(),
                            "error", e.getMessage()
                    ),
                    payment.getClientPhone()
            );
            throw e;
        }
    }

    /**
     * FLUX 2: Activating SaaS Subscription After Payment
     *
     * Étapes:
     * 1. Valider que le paiement est confirmé
     * 2. Activer la souscription
     * 3. Mettre à jour le planType de l'utilisateur
     * 4. Mettre à jour les quotas
     * 5. Enregistrer dans l'audit
     */
    @Transactional
    public void onSubscriptionPaymentConfirmed(Payment payment, Subscription subscription, String planName) {
        log.info("🔄 FLUX: Subscription Payment Confirmed → Activating Plan | Plan: {}", planName);

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new IllegalStateException("Payment must be PAID to activate subscription");
        }

        try {
            // 1. Activer la souscription
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setStartsAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);

            // 2. Mettre à jour le planType de l'utilisateur
            User user = subscription.getUser();
            String oldPlan = user.getPlanType();
            user.setPlanType(planName);
            userRepository.save(user);

            // 3. Audit log
            auditService.log(
                    user.getUserId(),
                    "PLAN_UPGRADED",
                    "User",
                    java.util.Map.of(
                            "oldPlan", oldPlan,
                            "newPlan", planName,
                            "subscriptionId", subscription.getSubscriptionId()
                    ),
                    user.getPhone()
            );

            log.info("FLUX: Subscription activated | User: {} | Plan: {}", user.getUserId(), planName);

        } catch (Exception e) {
            log.error("FLUX: Subscription activation failed", e);
            throw e;
        }
    }

    /**
     * FLUX 3: Checking User Withdrawal Quota
     *
     * Étapes:
     * 1. Récupérer le planType de l'utilisateur
     * 2. Récupérer les limits du plan
     * 3. Calculer montant utilisé aujourd'hui
     * 4. Valider contre la limite quotidienne
     * 5. Valider contre la limite mensuelle
     * 6. Retourner la décision
     */
    @Transactional(readOnly = true)
    public boolean canUserWithdraw(User user, java.math.BigDecimal amount) {
        log.info("🔍 FLUX: Checking Withdrawal Quota | User: {} | Amount: {}", user.getUserId(), amount);

        String planType = user.getPlanType();

        // Récupérer les limites
        java.math.BigDecimal dailyLimit = planFeatureService.getFeatureLimit(planType, "daily_withdrawal_limit");
        java.math.BigDecimal monthlyLimit = planFeatureService.getFeatureLimit(planType, "monthly_withdrawal_limit");

        log.debug("Quota limits: daily={} | monthly={}", dailyLimit, monthlyLimit);

        // TODO: Implémenter la vérification réelle contre la base de données
        // - Sommer les retraits d'aujourd'hui
        // - Sommer les retraits du mois
        // - Comparer avec les limites

        boolean canWithdraw = true; // Placeholder
        log.info("{} FLUX: Withdrawal Decision | Can withdraw: {}", canWithdraw ? "✅" : "❌", canWithdraw);

        return canWithdraw;
    }

    /**
     * FLUX 4: Expiring User Session
     *
     * Étapes:
     * 1. Trouver la session
     * 2. Vérifier que expiresAt < NOW
     * 3. Marquer comme EXPIRED
     * 4. Enregistrer dans l'audit
     */
    @Transactional
    public void expireSession(Session session) {
        log.info("🔄 FLUX: Expiring Session | SessionId: {}", session.getSessionId());

        try {
            session.setStatus(com.hotspotpay.session.enumeration.SessionStatus.EXPIRED);
            sessionRepository.save(session);

            auditService.log(
                    "SYSTEM",
                    "SESSION_EXPIRED",
                    "Session",
                    java.util.Map.of(
                            "sessionId", session.getSessionId(),
                            "status", session.getStatus().name(),
                            "message", "WiFi session expired"
                    ),
                    session.getClientPhone()
            );

            log.info("FLUX: Session marked as expired | SessionId: {}", session.getSessionId());

        } catch (Exception e) {
            log.error("FLUX: Session expiration failed", e);
            throw e;
        }
    }

    /**
     * FLUX 5: Resetting User Daily Quota
     *
     * Étapes:
     * 1. Trouver tous les utilisateurs
     * 2. Réinitialiser monthly_withdrawal_total = 0 si nouveau mois
     * 3. Réinitialiser last_withdrawal_date
     * 4. Enregistrer dans l'audit
     */
    @Transactional
    public void resetMonthlyQuota() {
        log.info("FLUX: Resetting Monthly Quotas");

        try {
            // TODO: Implémenter la réinitialisation mensuelle
            // - Trouver tous les utilisateurs avec reset_date < NOW
            // - Réinitialiser les quotas
            // - Mettre à jour la date de reset

            log.info("FLUX: Monthly quotas reset completed");

        } catch (Exception e) {
            log.error("FLUX: Monthly quota reset failed", e);
            throw e;
        }
    }
}