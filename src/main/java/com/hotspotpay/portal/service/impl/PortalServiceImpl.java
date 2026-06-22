package com.hotspotpay.portal.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.common.util.DurationUtils;
import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.dto.PaymentResponse;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.service.PaymentService;
import com.hotspotpay.plan.dto.PlanResponse;
import com.hotspotpay.plan.model.Plan;
import com.hotspotpay.plan.repository.PlanRepository;
import com.hotspotpay.router.service.FastApiClient;
import com.hotspotpay.portal.dto.*;
import com.hotspotpay.portal.service.PortalService;
import com.hotspotpay.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortalServiceImpl implements PortalService {

    private final FastApiClient       fastApiClient;
    private final PaymentService      paymentService;
    private final PaymentRepository   paymentRepository;
    private final PlanRepository      planRepository;
    private final SessionRepository   sessionRepository;

    private static final int POLLING_INTERVAL_MS = 5000;

    @Override
    @Transactional(readOnly = true)
    public PortalPageDto loadPage(String hotspotId, String mac) {
        // Vérifie que le hotspot existe via FastAPI (source de vérité)
        JsonNode hotspotJson = fastApiClient.getPublicHotspot(hotspotId);
        if (hotspotJson == null) {
            throw AppException.notFound(
                    "Hotspot non reconnu — vérifiez la configuration MikroTik"
            );
        }

        String name = hotspotJson.path("name").asText("Hotspot");
        String location = hotspotJson.path("location").asText(null);

        // Charge les forfaits actifs via FastAPI (source de vérité)
        JsonNode plansResponse = fastApiClient.getPublicActivePlans(hotspotId);
        List<PlanResponse> plans = new ArrayList<>();
        if (plansResponse != null && plansResponse.path("success").asBoolean()) {
            JsonNode data = plansResponse.path("data");
            if (data.isArray()) {
                for (JsonNode p : data) {
                    Integer dataLimitMb = p.has("data_limit_mb") && !p.path("data_limit_mb").isNull()
                            ? p.path("data_limit_mb").asInt() : null;
                    Integer downloadKbps = p.has("download_speed_kbps") && !p.path("download_speed_kbps").isNull()
                            ? p.path("download_speed_kbps").asInt() : null;
                    Integer uploadKbps = p.has("upload_speed_kbps") && !p.path("upload_speed_kbps").isNull()
                            ? p.path("upload_speed_kbps").asInt() : null;

                    plans.add(PlanResponse.builder()
                            .planId(p.path("plan_id").asText())
                            .hotspotId(p.path("hotspot_id").asText())
                            .name(p.path("name").asText())
                            .description(p.path("description").asText(null))
                            .durationMinutes(p.path("duration_minutes").asInt())
                            .durationLabel(DurationUtils.formatHumanReadable(p.path("duration_minutes").asInt()))
                            .price(new BigDecimal(p.path("price").asText("0")))
                            .currency(p.path("currency").asText("XAF"))
                            .priceLabel(p.path("price").asText("0") + " " + p.path("currency").asText("XAF"))
                            .downloadSpeedKbps(downloadKbps)
                            .uploadSpeedKbps(uploadKbps)
                            .dataLimitMb(dataLimitMb)
                            .dataLimitLabel(dataLimitMb != null ? formatDataLimit(dataLimitMb) : "Illimité")
                            .displayOrder(p.path("display_order").asInt(0))
                            .isActive(p.path("is_active").asBoolean(true))
                            .build());
                }
            }
        }

        if (plans.isEmpty()) {
            log.warn("No active plans found for hotspotId={}", hotspotId);
        }

        log.info("Portal page loaded: hotspotId={}, mac={}, plans={}",
                hotspotId, mac, plans.size());

        return PortalPageDto.builder()
                .hotspotId(hotspotId)
                .hotspotName(name)
                .location(location)
                .plans(plans)
                .clientMac(mac != null ? mac.toUpperCase() : null)
                .build();
    }

    @Override
    @Transactional
    public PortalPaymentResponse pay(PortalPaymentRequest request) {
        // Délègue au PaymentService (valide hotspot/plan via FastAPI dans initiate())
        InitiatePaymentRequest paymentRequest = new InitiatePaymentRequest();
        paymentRequest.setHotspotId(request.getHotspotId());
        paymentRequest.setPlanId(request.getPlanId());
        paymentRequest.setPhone(request.getPhone());
        paymentRequest.setMac(request.getMac());
        paymentRequest.setOperator(request.getOperator());

        PaymentResponse payment = paymentService.initiate(paymentRequest);

        String priceLabel = payment.getAmount() != null
                ? payment.getAmount().toPlainString() + " " + (payment.getCurrency() != null ? payment.getCurrency() : "XAF")
                : "";

        log.info("Portal payment initiated: ref={}, mac={}, phone={}",
                payment.getReference(), request.getMac(), request.getPhone());

        String checkoutUrl = payment.getCheckoutUrl();
        String message = checkoutUrl != null
                ? "Cliquez sur le lien pour finaliser votre paiement Moneroo"
                : "Demande envoyée — confirmez sur votre téléphone " + request.getPhone();

        return PortalPaymentResponse.builder()
                .reference(payment.getReference())
                .status(PaymentStatus.PENDING)
                .message(message)
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .priceLabel(priceLabel)
                .operator(payment.getOperator())
                .clientPhone(payment.getClientPhone())
                .clientMac(payment.getClientMac())
                .checkoutUrl(checkoutUrl)
                .pollingIntervalMs(POLLING_INTERVAL_MS)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PortalStatusResponse checkStatus(String reference) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> AppException.notFound("Référence de paiement introuvable"));

        boolean wifiActivated = payment.getStatus() == PaymentStatus.PAID;

        boolean activationPending = false;
        if (wifiActivated) {
            activationPending = sessionRepository.findByPaymentId(payment.getPaymentId())
                    .map(s -> s.getStatus() == com.hotspotpay.session.enumeration.SessionStatus.PENDING_MIKROTIK)
                    .orElse(false);
        }

        // Vérifier si des credentials sont disponibles pour connexion manuelle
        boolean credentialsAvailable = payment.getStatus() == PaymentStatus.PAID
                && Boolean.TRUE.equals(payment.getManualConnect())
                && payment.getManualUsername() != null;

        String message;
        if (credentialsAvailable) {
            message = "✅ Paiement confirmé ! Utilisez les identifiants ci-dessous pour vous connecter au WiFi.";
        } else if (activationPending) {
            message = "✅ Paiement confirmé ! Activation WiFi en cours (quelques secondes)...";
        } else {
            message = statusMessage(payment.getStatus());
        }

        PortalStatusResponse.PortalStatusResponseBuilder builder = PortalStatusResponse.builder()
                .reference(reference)
                .status(payment.getStatus())
                .message(message)
                .wifiActivated(wifiActivated && !activationPending && !credentialsAvailable)
                .activationPending(activationPending)
                .credentialsAvailable(credentialsAvailable);

        // Ajouter les credentials si connexion manuelle
        if (credentialsAvailable) {
            builder.manualUsername(payment.getManualUsername());
            builder.manualPassword(payment.getManualPassword());
        }

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

    @Override
    @Transactional
    public PortalStatusResponse connectManually(String reference, String mac) {
        // Délègue au PaymentService qui gère toute la logique
        paymentService.connectManually(reference, mac);

        // Retourner le statut mis à jour (wifiActivated pas encore vrai, activationPending)
        return checkStatus(reference);
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private String statusMessage(PaymentStatus status) {
        return switch (status) {
            case PENDING  -> "En attente de confirmation — veuillez valider sur votre téléphone";
            case PAID     -> "✅ Paiement confirmé ! Activation WiFi en cours (quelques secondes)...";
            case FAILED   -> "❌ Paiement refusé — veuillez réessayer ou choisir un autre opérateur";
            case EXPIRED  -> "⏱ Délai dépassé — veuillez recommencer depuis le début";
            case REFUNDED -> "Paiement remboursé";
        };
    }

    private String formatDuration(int minutes) {
        return DurationUtils.formatHumanReadable(minutes);
    }

    private String formatDataLimit(int mb) {
        if (mb < 1024) return mb + " MB";
        return (mb / 1024) + " GB";
    }
}
