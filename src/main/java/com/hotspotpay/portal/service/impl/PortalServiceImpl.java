package com.hotspotpay.portal.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.hotspot.model.Hotspot;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.dto.PaymentResponse;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.service.PaymentService;
import com.hotspotpay.plan.dto.PlanResponse;
import com.hotspotpay.plan.model.Plan;
import com.hotspotpay.plan.repository.PlanRepository;
import com.hotspotpay.plan.service.PlanService;
import com.hotspotpay.portal.dto.PortalPageDto;
import com.hotspotpay.portal.dto.PortalPaymentRequest;
import com.hotspotpay.portal.dto.PortalPaymentResponse;
import com.hotspotpay.portal.dto.PortalStatusResponse;
import com.hotspotpay.portal.dto.*;
import com.hotspotpay.portal.service.PortalService;
import com.hotspotpay.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortalServiceImpl implements PortalService {

    private final HotspotRepository  hotspotRepository;
    private final PlanService         planService;
    private final PlanRepository      planRepository;
    private final PaymentService      paymentService;
    private final PaymentRepository   paymentRepository;
    private final SessionRepository   sessionRepository;

    private static final int POLLING_INTERVAL_MS = 5000; // 5 secondes

    @Override
    @Transactional(readOnly = true)
    public PortalPageDto loadPage(String hotspotId, String mac) {
        // Vérifie que le hotspot existe et est enregistré dans le SaaS
        Hotspot hotspot = hotspotRepository.findByHotspotId(hotspotId)
                .orElseThrow(() -> AppException.notFound(
                        "Hotspot non reconnu — vérifiez la configuration MikroTik"
                ));

        // Charge uniquement les forfaits actifs de CE routeur
        List<PlanResponse> plans = planService.findActive(hotspotId);

        if (plans.isEmpty()) {
            log.warn("No active plans found for hotspotId={}", hotspotId);
        }

        log.info("Portal page loaded: hotspotId={}, mac={}, plans={}",
                hotspotId, mac, plans.size());

        return PortalPageDto.builder()
                .hotspotId(hotspot.getHotspotId())
                .hotspotName(hotspot.getName())
                .location(hotspot.getLocation())
                .plans(plans)
                .clientMac(mac != null ? mac.toUpperCase() : null)
                .build();
    }

    @Override
    @Transactional
    public PortalPaymentResponse pay(PortalPaymentRequest request) {
        // Vérifie que le hotspot est bien online avant d'initier le paiement
        Hotspot hotspot = hotspotRepository.findByHotspotId(request.getHotspotId())
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable"));

        if (!hotspot.getIsOnline()) {
            throw AppException.badRequest(
                    "Le routeur WiFi est hors ligne — veuillez réessayer dans quelques instants"
            );
        }

        // Délègue au PaymentService
        InitiatePaymentRequest paymentRequest = new InitiatePaymentRequest();
        paymentRequest.setHotspotId(request.getHotspotId());
        paymentRequest.setPlanId(request.getPlanId());
        paymentRequest.setPhone(request.getPhone());
        paymentRequest.setMac(request.getMac());
        paymentRequest.setOperator(request.getOperator());

        PaymentResponse payment = paymentService.initiate(paymentRequest);

        // Récupère le forfait pour afficher le prix
        Plan plan = planRepository.findByPlanId(request.getPlanId()).orElse(null);
        String priceLabel = plan != null
                ? plan.getPrice().toPlainString() + " " + plan.getCurrency()
                : "";

        log.info("Portal payment initiated: ref={}, mac={}, phone={}",
                payment.getReference(), request.getMac(), request.getPhone());

        return PortalPaymentResponse.builder()
                .reference(payment.getReference())
                .status(PaymentStatus.PENDING)
                .message("Demande de paiement envoyée — confirmez sur votre téléphone " + request.getPhone())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .priceLabel(priceLabel)
                .operator(payment.getOperator())
                .clientPhone(payment.getClientPhone())
                .clientMac(payment.getClientMac())
                .pollingIntervalMs(POLLING_INTERVAL_MS)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PortalStatusResponse checkStatus(String reference) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> AppException.notFound("Référence de paiement introuvable"));

        boolean wifiActivated = payment.getStatus() == PaymentStatus.PAID;

        PortalStatusResponse.PortalStatusResponseBuilder builder = PortalStatusResponse.builder()
                .reference(reference)
                .status(payment.getStatus())
                .message(statusMessage(payment.getStatus()))
                .wifiActivated(wifiActivated);

        // Si paiement confirmé → charge les infos de session
        if (wifiActivated) {
            sessionRepository.findByPaymentId(payment.getPaymentId())
                    .ifPresent(session -> {
                        Plan plan = planRepository
                                .findByPlanId(session.getPlanId())
                                .orElse(null);

                        builder.session(PortalStatusResponse.SessionInfo.builder()
                                .sessionId(session.getSessionId())
                                .activatedAt(session.getActivatedAt())
                                .expiresAt(session.getExpiresAt())
                                .durationLabel(plan != null
                                        ? formatDuration(plan.getDurationMinutes()) : "")
                                .planName(plan != null ? plan.getName() : "")
                                .build());
                    });

            log.info("Portal status checked — WiFi activated: ref={}", reference);
        }

        return builder.build();
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private String statusMessage(PaymentStatus status) {
        return switch (status) {
            case PENDING   -> "En attente de confirmation — veuillez valider sur votre téléphone";
            case PAID      -> "✅ Paiement confirmé ! Votre connexion WiFi est maintenant active.";
            case FAILED    -> "❌ Paiement refusé — veuillez réessayer ou choisir un autre opérateur";
            case EXPIRED   -> "⏱ Délai dépassé — veuillez recommencer depuis le début";
            case REFUNDED  -> "Paiement remboursé";
            case CANCELLED -> "Paiement annulé";
        };
    }

    private String formatDuration(int minutes) {
        if (minutes < 60)    return minutes + " min";
        if (minutes < 1440)  return (minutes / 60) + "h";
        if (minutes < 10080) return (minutes / 1440) + " jour(s)";
        return (minutes / 10080) + " semaine(s)";
    }
}