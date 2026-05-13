package hotspotpay.com.mvp.payment.service.impl;

import hotspotpay.com.mvp.common.exception.AppException;
import hotspotpay.com.mvp.hotspot.mikrotik.MikroTikClient;
import hotspotpay.com.mvp.hotspot.mikrotik.Utils.MikroTikCredentialUtil;
import hotspotpay.com.mvp.hotspot.model.Hotspot;
import hotspotpay.com.mvp.hotspot.repository.HotspotRepository;
import hotspotpay.com.mvp.payment.dto.InitiatePaymentRequest;
import hotspotpay.com.mvp.payment.dto.PaymentResponse;
import hotspotpay.com.mvp.payment.dto.PaymentStatusResponse;
import hotspotpay.com.mvp.payment.gateway.MoMoGateway;
import hotspotpay.com.mvp.payment.gateway.MtnMoMoGateway;
import hotspotpay.com.mvp.payment.gateway.OrangeMoneyGateway;
import hotspotpay.com.mvp.payment.model.Payment;
import hotspotpay.com.mvp.payment.enumeration.PaymentOperator;
import hotspotpay.com.mvp.payment.enumeration.PaymentStatus;
import hotspotpay.com.mvp.payment.repository.PaymentRepository;
import hotspotpay.com.mvp.payment.service.PaymentService;
import hotspotpay.com.mvp.plan.model.Plan;
import hotspotpay.com.mvp.plan.repository.PlanRepository;
import hotspotpay.com.mvp.session.model.Session;
import hotspotpay.com.mvp.session.enumeration.SessionStatus;
import hotspotpay.com.mvp.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository     paymentRepository;
    private final SessionRepository     sessionRepository;
    private final HotspotRepository     hotspotRepository;
    private final PlanRepository        planRepository;
    private final MtnMoMoGateway        mtnGateway;
    private final OrangeMoneyGateway    orangeGateway;
    private final MikroTikClient        mikrotikClient;
    private final MikroTikCredentialUtil credentialUtil;

    // Timeout paiement : 3 minutes
    private static final int PAYMENT_TIMEOUT_MINUTES = 3;

    @Override
    @Transactional
    public PaymentResponse initiate(InitiatePaymentRequest request) {
        // 1. Vérifie que le hotspot existe
        Hotspot hotspot = hotspotRepository.findByHotspotId(request.getHotspotId())
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable"));

        // 2. Vérifie que le forfait appartient à ce hotspot et est actif
        Plan plan = planRepository.findByPlanIdAndHotspotId(
                        request.getPlanId(), request.getHotspotId())
                .orElseThrow(() -> AppException.notFound("Forfait introuvable"));

        if (!plan.getIsActive()) {
            throw AppException.badRequest("Ce forfait n'est plus disponible");
        }

        // 3. Génère une référence unique (idempotency key)
        String reference = UUID.randomUUID().toString();

        // 4. Crée le paiement en DB (statut PENDING)
        Payment payment = Payment.builder()
                .paymentId(UUID.randomUUID().toString())
                .reference(reference)
                .hotspotId(hotspot.getHotspotId())
                .planId(plan.getPlanId())
                .clientPhone(request.getPhone())
                .clientMac(request.getMac().toUpperCase())
                .operator(request.getOperator())
                .amount(plan.getPrice())
                .currency(plan.getCurrency())
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(PAYMENT_TIMEOUT_MINUTES))
                .build();

        paymentRepository.save(payment);

        // 5. Appelle l'opérateur MoMo
        try {
            MoMoGateway gateway = resolveGateway(request.getOperator());
            String gatewayTxId = gateway.requestToPay(
                    request.getPhone(),
                    plan.getPrice(),
                    plan.getCurrency(),
                    reference,
                    "WiFi " + hotspot.getName() + " - " + plan.getName()
            );
            payment.setGatewayTxId(gatewayTxId);
            paymentRepository.save(payment);

            log.info("Payment initiated: ref={}, phone={}, amount={}, operator={}",
                    reference, request.getPhone(), plan.getPrice(), request.getOperator());

        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(e.getMessage());
            paymentRepository.save(payment);
            throw AppException.badRequest("Erreur lors de l'initiation du paiement : " + e.getMessage());
        }

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse getStatus(String reference) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> AppException.notFound("Paiement introuvable"));

        PaymentStatusResponse.PaymentStatusResponseBuilder builder = PaymentStatusResponse.builder()
                .reference(payment.getReference())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .expiresAt(payment.getExpiresAt())
                .message(statusMessage(payment.getStatus()));

        // Si PAID, on ajoute les infos de session
        if (payment.getStatus() == PaymentStatus.PAID) {
            sessionRepository.findByPaymentId(payment.getPaymentId())
                    .ifPresent(session -> {
                        Plan plan = planRepository.findByPlanId(session.getPlanId()).orElse(null);
                        builder.session(PaymentStatusResponse.SessionInfo.builder()
                                .sessionId(session.getSessionId())
                                .activatedAt(session.getActivatedAt())
                                .expiresAt(session.getExpiresAt())
                                .durationLabel(plan != null
                                        ? formatDuration(plan.getDurationMinutes()) : "")
                                .build());
                    });
        }

        return builder.build();
    }

    @Override
    @Transactional
    public void confirmFromWebhook(String reference, String gatewayTxId, boolean success) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> AppException.notFound("Paiement introuvable: " + reference));

        // Idempotence — ignore si déjà traité
        if (payment.getStatus() != PaymentStatus.PENDING) {
            log.warn("Payment already processed: ref={}, status={}", reference, payment.getStatus());
            return;
        }

        if (!success) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Refusé par l'opérateur");
            paymentRepository.save(payment);
            log.warn("Payment failed: ref={}", reference);
            return;
        }

        // ── Paiement confirmé — activation MikroTik ────────────────────────
        payment.setStatus(PaymentStatus.PAID);
        payment.setGatewayTxId(gatewayTxId);
        payment.setWebhookReceivedAt(LocalDateTime.now());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        activateSession(payment);
        log.info("Payment confirmed and session activated: ref={}", reference);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> findByHotspot(String userId, String hotspotId, Pageable pageable) {
        // Vérifie que le hotspot appartient à cet utilisateur
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));
        return paymentRepository
                .findAllByHotspotIdOrderByCreatedAtDesc(hotspotId, pageable)
                .map(this::toResponse);
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private void activateSession(Payment payment) {
        Plan plan = planRepository.findByPlanId(payment.getPlanId())
                .orElseThrow(() -> AppException.notFound("Forfait introuvable"));

        Hotspot hotspot = hotspotRepository.findByHotspotId(payment.getHotspotId())
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable"));

        // Génère les credentials MikroTik
        String mikrotikUsername = "hp_" + RandomStringUtils.randomAlphanumeric(8).toLowerCase();
        String mikrotikPassword = RandomStringUtils.randomAlphanumeric(12);

        // Crée la session en DB
        LocalDateTime now      = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(plan.getDurationMinutes());

        Session session = Session.builder()
                .sessionId(UUID.randomUUID().toString())
                .paymentId(payment.getPaymentId())
                .hotspotId(payment.getHotspotId())
                .planId(payment.getPlanId())
                .clientPhone(payment.getClientPhone())
                .clientMac(payment.getClientMac())
                .mikrotikUsername(mikrotikUsername)
                .mikrotikPassword(mikrotikPassword)
                .status(SessionStatus.ACTIVE)
                .activatedAt(now)
                .expiresAt(expiresAt)
                .build();

        sessionRepository.save(session);

        // Active l'accès sur MikroTik
        String plainPassword = credentialUtil.decrypt(hotspot.getMikrotikPasswordEnc());
        mikrotikClient.createHotspotUser(
                hotspot,
                plainPassword,
                mikrotikUsername,
                mikrotikPassword,
                payment.getClientMac(),
                plan.getDurationMinutes()
        );

        log.info("Session activated: sessionId={}, mac={}, expiresAt={}",
                session.getSessionId(), payment.getClientMac(), expiresAt);
    }

    private MoMoGateway resolveGateway(PaymentOperator operator) {
        return switch (operator) {
            case MTN_MOMO      -> mtnGateway;
            case ORANGE_MONEY  -> orangeGateway;
        };
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .reference(p.getReference())
                .hotspotId(p.getHotspotId())
                .planId(p.getPlanId())
                .clientPhone(p.getClientPhone())
                .clientMac(p.getClientMac())
                .operator(p.getOperator())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getStatus())
                .gatewayTxId(p.getGatewayTxId())
                .paidAt(p.getPaidAt())
                .expiresAt(p.getExpiresAt())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private String statusMessage(PaymentStatus status) {
        return switch (status) {
            case PENDING  -> "En attente de confirmation du paiement";
            case PAID     -> "Paiement confirmé — connexion WiFi active";
            case FAILED   -> "Paiement échoué — veuillez réessayer";
            case EXPIRED  -> "Délai expiré — veuillez recommencer";
            case REFUNDED -> "Paiement remboursé";
        };
    }

    private String formatDuration(int minutes) {
        if (minutes < 60)    return minutes + " min";
        if (minutes < 1440)  return (minutes / 60) + "h";
        return (minutes / 1440) + " jour(s)";
    }
}