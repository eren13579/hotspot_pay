package com.hotspotpay.subscription.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.service.PaymentService;
import com.hotspotpay.subscription.dto.*;
import com.hotspotpay.subscription.enumeration.SubscriptionStatus;
import com.hotspotpay.subscription.model.Subscription;
import com.hotspotpay.subscription.repository.SubscriptionRepository;
import com.hotspotpay.subscription.service.SubscriptionService;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;

    @Override
    @Transactional
    public SubscriptionResponse create(String userId, CreateSubscriptionRequest request) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        BigDecimal amount = getPlanAmount(request.getPlanName(), request.getDurationMonths());

        String subscriptionId = "SUB_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Subscription subscription = Subscription.builder()
                .subscriptionId(subscriptionId)
                .user(user)
                .planName(request.getPlanName().toUpperCase())
                .amount(amount)
                .durationMonths(request.getDurationMonths())
                .startsAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMonths(request.getDurationMonths()))
                .status(SubscriptionStatus.PENDING)
                .build();

        subscriptionRepository.save(subscription);

        // Initier le paiement
        InitiatePaymentRequest paymentRequest = new InitiatePaymentRequest();
        paymentRequest.setHotspotId("SUBSCRIPTION");
        paymentRequest.setPlanId(subscriptionId);
        paymentRequest.setPhone(request.getPhone());
        paymentRequest.setMac("00:00:00:00:00:00");
        paymentRequest.setOperator(request.getOperator());

        paymentService.initiate(paymentRequest);

        log.info("Souscription créée pour user {} - Plan: {}", userId, request.getPlanName());

        return toResponse(subscription);
    }

    private BigDecimal getPlanAmount(String planName, Integer months) {
        boolean yearly = months == 12;
        return switch (planName.toUpperCase()) {
            case "PRO" -> yearly ? new BigDecimal("12000") : new BigDecimal("1500");
            case "ENTERPRISE" -> yearly ? new BigDecimal("45000") : new BigDecimal("5000");
            default -> yearly ? new BigDecimal("8000") : new BigDecimal("800"); // BASIC
        };
    }

    @Override
    public SubscriptionResponse getCurrent(String userId) {
        Subscription sub = subscriptionRepository.findByUserUserIdAndStatus(userId, SubscriptionStatus.ACTIVE)
                .orElseThrow(() -> AppException.notFound("Aucun abonnement actif"));

        return toResponse(sub);
    }

    @Override
    public List<SubscriptionResponse> findAllByUser(String userId) {
        return subscriptionRepository.findAllByUserUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<SubscriptionPlanDto> getAvailablePlans() {
        return List.of(
                SubscriptionPlanDto.builder().planName("BASIC").monthlyPrice(new BigDecimal("800")).maxHotspots(3).build(),
                SubscriptionPlanDto.builder().planName("PRO").monthlyPrice(new BigDecimal("1500")).maxHotspots(10).isPopular(true).build(),
                SubscriptionPlanDto.builder().planName("ENTERPRISE").monthlyPrice(new BigDecimal("5000")).maxHotspots(999).build()
        );
    }

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void checkAndExpireSubscriptions() {
        List<Subscription> expired = subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());
        expired.forEach(sub -> sub.setStatus(SubscriptionStatus.EXPIRED));
        subscriptionRepository.saveAll(expired);
        log.info("{} abonnements expirés", expired.size());
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
}