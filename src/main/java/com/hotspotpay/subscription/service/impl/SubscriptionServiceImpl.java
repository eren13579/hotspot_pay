package com.hotspotpay.subscription.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.service.PaymentService;
import com.hotspotpay.router.service.FastApiSubscriptionClient;
import com.hotspotpay.subscription.dto.*;
import com.hotspotpay.subscription.enumeration.SubscriptionStatus;
import com.hotspotpay.subscription.model.Subscription;
import com.hotspotpay.subscription.model.SubscriptionPlan;
import com.hotspotpay.subscription.repository.SubscriptionPlanRepository;
import com.hotspotpay.subscription.repository.SubscriptionRepository;
import com.hotspotpay.subscription.service.SubscriptionService;
import com.hotspotpay.users.model.User;
import com.hotspotpay.notification.service.EmailService;
import com.hotspotpay.users.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository     subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository             userRepository;
    private final EmailService               emailService;
    private final PaymentService             paymentService;
    private final FastApiSubscriptionClient  fastApiSubscriptionClient;

    // ── Seed default plans if DB empty ─────────────────────────────────

    @PostConstruct
    public void seedDefaultPlans() {
        if (planRepository.count() > 0) return;

        log.info("Seed des plans d'abonnement par défaut...");
        planRepository.saveAll(List.of(
                SubscriptionPlan.builder()
                        .planName("BASIC")
                        .monthlyPrice(new BigDecimal("0"))
                        .yearlyPrice(new BigDecimal("0"))
                        .maxHotspots(1)
                        .description("Pour démarrer")
                        .isPopular(false)
                        .advantages(Map.of(
                                "maxHotspots", 1,
                                "plansPerHotspot", 5,
                                "monthlyTickets", 100,
                                "exportCsv", false,
                                "apiAccess", "none",
                                "advancedStats", false,
                                "prioritySupport", false,
                                "unlimitedHotspots", false,
                                "unlimitedTickets", false,
                                "unlimitedPlans", false
                        ))
                        .build(),
                SubscriptionPlan.builder()
                        .planName("PRO")
                        .monthlyPrice(new BigDecimal("15000"))
                        .yearlyPrice(new BigDecimal("144000"))
                        .maxHotspots(10)
                        .description("Pour les professionnels")
                        .isPopular(true)
                        .advantages(Map.of(
                                "maxHotspots", 10,
                                "plansPerHotspot", 999,
                                "monthlyTickets", 10000,
                                "exportCsv", true,
                                "apiAccess", "read",
                                "advancedStats", true,
                                "prioritySupport", false,
                                "unlimitedHotspots", false,
                                "unlimitedTickets", false,
                                "unlimitedPlans", true
                        ))
                        .build(),
                SubscriptionPlan.builder()
                        .planName("PREMIUM")
                        .monthlyPrice(new BigDecimal("50000"))
                        .yearlyPrice(new BigDecimal("480000"))
                        .maxHotspots(99)
                        .description("Solution entreprise")
                        .isPopular(false)
                        .advantages(Map.of(
                                "maxHotspots", 999,
                                "plansPerHotspot", 999,
                                "monthlyTickets", 999999,
                                "exportCsv", true,
                                "apiAccess", "full",
                                "advancedStats", true,
                                "prioritySupport", true,
                                "unlimitedHotspots", true,
                                "unlimitedTickets", true,
                                "unlimitedPlans", true
                        ))
                        .build()
        ));
        log.info("Plans d'abonnement par défaut créés.");
    }

    // ── Subscription lifecycle ─────────────────────────────────────────

    @Override
    @Transactional
    public SubscriptionResponse create(String userId, CreateSubscriptionRequest request) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        String normalizedPlan = request.getPlanName().toUpperCase();
        BigDecimal amount = resolveAmount(normalizedPlan, request.getDurationMonths());

        String subscriptionId = "SUB_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Subscription subscription = Subscription.builder()
                .subscriptionId(subscriptionId)
                .user(user)
                .planName(normalizedPlan)
                .amount(amount)
                .durationMonths(request.getDurationMonths())
                .startsAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMonths(request.getDurationMonths()))
                .status(SubscriptionStatus.PENDING)
                .build();

        subscriptionRepository.save(subscription);

        // Initier le paiement — le webhook le confirmera et activera l'abonnement
        InitiatePaymentRequest paymentReq = new InitiatePaymentRequest();
        paymentReq.setHotspotId("SUBSCRIPTION");
        paymentReq.setPlanId(subscriptionId);
        paymentReq.setPlanName(normalizedPlan);
        paymentReq.setPhone(request.getPhone());
        paymentReq.setMac("00:00:00:00:00:00");
        paymentReq.setOperator(request.getOperator());

        var paymentResponse = paymentService.initiate(paymentReq);

        // Lier la référence de paiement à l'abonnement
        subscription.setPaymentReference(paymentResponse.getReference());
        subscriptionRepository.save(subscription);

        log.info("Abonnement créé userId={}, plan={}, subscriptionId={}", userId, normalizedPlan, subscriptionId);
        return toResponse(subscription);
    }

    @Override
    @Transactional
    public void activateAfterPayment(String paymentReference) {
        Subscription sub = subscriptionRepository.findByPaymentReference(paymentReference)
                .orElseThrow(() -> AppException.notFound("Abonnement introuvable pour ref=" + paymentReference));

        if (sub.getStatus() == SubscriptionStatus.ACTIVE) {
            log.warn("Abonnement déjà actif: {}", sub.getSubscriptionId());
            return;
        }

        // Annuler l'éventuel abonnement actif précédent
        subscriptionRepository.findByUserUserIdAndStatus(sub.getUser().getUserId(), SubscriptionStatus.ACTIVE)
                .ifPresent(prev -> {
                    prev.setStatus(SubscriptionStatus.CANCELLED);
                    prev.setCancelledAt(LocalDateTime.now());
                    subscriptionRepository.save(prev);
                    log.info("Ancien abonnement annulé: {}", prev.getSubscriptionId());
                });

        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartsAt(LocalDateTime.now());
        sub.setExpiresAt(LocalDateTime.now().plusMonths(sub.getDurationMonths()));
        subscriptionRepository.save(sub);

        // ── Mettre à jour le planType de l'utilisateur ──────────────────
        User user = sub.getUser();
        user.setPlanType(sub.getPlanName());
        userRepository.save(user);

        // Email notification activation
        try {
            emailService.sendSubscriptionActivated(
                user.getEmail(), sub.getPlanName(),
                sub.getExpiresAt().toString());
        } catch (Exception e) {
            log.warn("Email abonnement activé failed: {}", e.getMessage());
        }

        log.info("Abonnement activé: subscriptionId={}, user={}, planType={}",
                sub.getSubscriptionId(), user.getUserId(), sub.getPlanName());
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionResponse getCurrent(String userId) {
        return toResponse(
                subscriptionRepository.findByUserUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                        .orElseThrow(() -> AppException.notFound("Aucun abonnement actif trouvé"))
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionResponse> findAllByUser(String userId) {
        return subscriptionRepository.findAllByUserUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    // ── Plans (public) ─────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> getAvailablePlans() {
        List<SubscriptionPlanDto> fromDb = planRepository.findAll().stream()
                .filter(SubscriptionPlan::isActive)
                .map(this::toPlanDto)
                .toList();
        if (!fromDb.isEmpty()) return fromDb;

        // Fallback: FastAPI ou hardcodé
        List<SubscriptionPlanDto> result = new java.util.ArrayList<>();
        try {
            JsonNode resp = fastApiSubscriptionClient.listPlans();
            if (resp != null && resp.has("data")) {
                for (JsonNode p : resp.get("data")) {
                    result.add(SubscriptionPlanDto.builder()
                            .planName(p.path("plan_id").asText().toUpperCase())
                            .monthlyPrice(new BigDecimal(p.path("price").asInt(0)))
                            .maxHotspots(p.path("advantages").path("max_hotspots").asInt(0))
                            .description(p.path("description").asText(null))
                            .build()
                    );
                }
            }
        } catch (Exception e) {
            log.error("Erreur lecture plans depuis FastAPI: {}", e.getMessage());
        }
        if (result.isEmpty()) {
            result.add(SubscriptionPlanDto.builder().planName("BASIC").monthlyPrice(BigDecimal.ZERO).maxHotspots(1).build());
            result.add(SubscriptionPlanDto.builder().planName("PRO").monthlyPrice(new BigDecimal("15000")).maxHotspots(10).isPopular(true).build());
            result.add(SubscriptionPlanDto.builder().planName("PREMIUM").monthlyPrice(new BigDecimal("50000")).maxHotspots(99).build());
        }
        return result;
    }

    // ── Admin CRUD ─────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlanDto> adminGetAllPlans() {
        return planRepository.findAll().stream()
                .map(this::toPlanDto)
                .toList();
    }

    @Override
    @Transactional
    public SubscriptionPlanDto adminCreatePlan(CreateSubscriptionPlanRequest request) {
        if (planRepository.existsByPlanName(request.getPlanName().toUpperCase())) {
            throw AppException.conflict("Un plan avec ce nom existe déjà");
        }

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planName(request.getPlanName().toUpperCase())
                .monthlyPrice(request.getMonthlyPrice())
                .yearlyPrice(request.getYearlyPrice())
                .maxHotspots(request.getMaxHotspots())
                .description(request.getDescription())
                .isPopular(request.isPopular())
                .isActive(true)
                .advantages(request.getAdvantages())
                .build();

        planRepository.save(plan);
        log.info("Plan d'abonnement créé: {}", plan.getPlanName());
        return toPlanDto(plan);
    }

    @Override
    @Transactional
    public SubscriptionPlanDto adminUpdatePlan(String planName, CreateSubscriptionPlanRequest request) {
        SubscriptionPlan plan = planRepository.findByPlanName(planName.toUpperCase())
                .orElseThrow(() -> AppException.notFound("Plan introuvable: " + planName));

        plan.setPlanName(request.getPlanName().toUpperCase());
        plan.setMonthlyPrice(request.getMonthlyPrice());
        plan.setYearlyPrice(request.getYearlyPrice());
        plan.setMaxHotspots(request.getMaxHotspots());
        plan.setDescription(request.getDescription());
        plan.setPopular(request.isPopular());
        plan.setAdvantages(request.getAdvantages());

        planRepository.save(plan);
        log.info("Plan d'abonnement modifié: {}", plan.getPlanName());
        return toPlanDto(plan);
    }

    @Override
    @Transactional
    public void adminDeletePlan(String planName) {
        SubscriptionPlan plan = planRepository.findByPlanName(planName.toUpperCase())
                .orElseThrow(() -> AppException.notFound("Plan introuvable: " + planName));
        planRepository.delete(plan);
        log.info("Plan d'abonnement supprimé: {}", planName);
    }

    @Override
    @Transactional
    public SubscriptionPlanDto adminTogglePopular(String planName) {
        SubscriptionPlan plan = planRepository.findByPlanName(planName.toUpperCase())
                .orElseThrow(() -> AppException.notFound("Plan introuvable: " + planName));
        plan.setPopular(!plan.isPopular());
        planRepository.save(plan);
        log.info("Plan {} popular = {}", plan.getPlanName(), plan.isPopular());
        return toPlanDto(plan);
    }

    // ── Scheduled tasks ────────────────────────────────────────────────

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void checkAndExpireSubscriptions() {
        List<Subscription> expired = subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());
        for (Subscription sub : expired) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);

            User user = sub.getUser();
            user.setPlanType("BASIC");
            userRepository.save(user);

            log.info("Abonnement expiré: subscriptionId={}, user={} → BASIC",
                    sub.getSubscriptionId(), user.getUserId());
        }
        log.info("{} abonnement(s) expiré(s) traité(s)", expired.size());
    }

    // ── Privé ──────────────────────────────────────────────────────────

    private BigDecimal resolveAmount(String planName, int durationMonths) {
        if (planRepository.existsByPlanName(planName)) {
            return switch (planName) {
                case "PRO"     -> durationMonths == 12 ? new BigDecimal("144000") : new BigDecimal("15000");
                case "PREMIUM" -> durationMonths == 12 ? new BigDecimal("480000") : new BigDecimal("50000");
                default        -> BigDecimal.ZERO;
            };
        }
        // Fallback FastAPI
        JsonNode resp = fastApiSubscriptionClient.getPlanByPlanName(planName.toLowerCase());
        JsonNode planData = resp != null ? resp.path("data") : null;
        if (planData != null && !planData.isMissingNode() && planData.has("price")) {
            int monthly = planData.get("price").asInt(0);
            return durationMonths == 12
                    ? BigDecimal.valueOf(monthly * 10L)
                    : BigDecimal.valueOf(monthly);
        }
        log.warn("Fallback hardcode pour {}", planName);
        return switch (planName) {
            case "PRO"        -> durationMonths == 12 ? new BigDecimal("12000") : new BigDecimal("1500");
            case "PREMIUM"    -> durationMonths == 12 ? new BigDecimal("45000") : new BigDecimal("5000");
            default           -> BigDecimal.ZERO;
        };
    }

    private SubscriptionResponse toResponse(Subscription s) {
        int daysLeft = (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), s.getExpiresAt());
        return SubscriptionResponse.builder()
                .subscriptionId(s.getSubscriptionId())
                .planName(s.getPlanName())
                .amount(s.getAmount())
                .currency(s.getCurrency())
                .status(s.getStatus())
                .startsAt(s.getStartsAt())
                .expiresAt(s.getExpiresAt())
                .daysRemaining(Math.max(0, daysLeft))
                .build();
    }

    private SubscriptionPlanDto toPlanDto(SubscriptionPlan p) {
        return SubscriptionPlanDto.builder()
                .planName(p.getPlanName())
                .monthlyPrice(p.getMonthlyPrice())
                .yearlyPrice(p.getYearlyPrice())
                .maxHotspots(p.getMaxHotspots())
                .description(p.getDescription())
                .isPopular(p.isPopular())
                .advantages(p.getAdvantages())
                .build();
    }
}
