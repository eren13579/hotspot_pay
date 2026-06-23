package com.hotspotpay.payment.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.common.util.DurationUtils;
import com.hotspotpay.hotspot.model.Hotspot;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.payment.dto.InitiatePaymentRequest;
import com.hotspotpay.payment.dto.PaymentResponse;
import com.hotspotpay.payment.dto.PaymentStatusResponse;
import com.hotspotpay.payment.enumeration.PaymentOperator;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.payment.gateway.*;
import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.service.PaymentService;
import com.hotspotpay.plan.model.Plan;
import com.hotspotpay.plan.repository.PlanRepository;
import com.hotspotpay.realtime.dto.PaymentStatusEvent;
import com.hotspotpay.realtime.service.SseService;
import com.hotspotpay.router.service.FastApiPaymentClient;
import com.hotspotpay.router.service.FastApiTicketClient;
import com.hotspotpay.ticket.enumeration.TicketStatus;
import com.hotspotpay.ticket.model.Ticket;
import com.hotspotpay.ticket.repository.TicketRepository;
import com.hotspotpay.session.enumeration.SessionStatus;
import com.hotspotpay.session.model.Session;
import com.hotspotpay.session.repository.SessionRepository;
import com.hotspotpay.notification.service.EmailService;
import com.hotspotpay.subscription.service.SubscriptionService;
import com.hotspotpay.systemsettings.repository.SystemSettingRepository;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.redis.core.StringRedisTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service de paiement — architecture Pull MikroTik.
 *
 * Changement clé : activateSession() ne contacte PLUS le routeur MikroTik directement.
 * À la place, elle crée une RouterAction (CREATE_USER) en DB avec status PENDING.
 * La session est créée avec status PENDING_MIKROTIK.
 * Quand le routeur confirme l'action via POST .../done → session passe en ACTIVE.
 */
@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository   paymentRepository;
    private final SessionRepository   sessionRepository;
    private final HotspotRepository   hotspotRepository;
    private final PlanRepository      planRepository;
    private final MtnMoMoGateway      mtnGateway;
    private final OrangeMoneyGateway  orangeGateway;
    private final MonerooGateway      monerooGateway;
    private final CampayGateway       campayGateway;
    private final FastApiPaymentClient fastApiPaymentClient;
    private final FastApiTicketClient  fastApiTicketClient;
    private final TicketRepository     ticketRepository;
    private final SubscriptionService  subscriptionService;
    private final SseService          sseService;
    private final EmailService        emailService;
    private final StringRedisTemplate stringRedisTemplate;
    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;

    private static final int PAYMENT_TIMEOUT_MINUTES = 10;
    private static final String LOCK_PREFIX = "pay:lock:";
    private static final int LOCK_TTL_SECONDS = 30;

    // TODO: Migrer vers des montants stockés en DB (table subscription_plans)
    // Ces valeurs hardcodées sont pour le MVP uniquement

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            SessionRepository sessionRepository,
            HotspotRepository hotspotRepository,
            PlanRepository planRepository,
            MtnMoMoGateway mtnGateway,
            OrangeMoneyGateway orangeGateway,
            MonerooGateway monerooGateway,
            CampayGateway campayGateway,
            FastApiPaymentClient fastApiPaymentClient,
            FastApiTicketClient fastApiTicketClient,
            TicketRepository ticketRepository,
            @Lazy SubscriptionService subscriptionService,
            SseService sseService,
            EmailService emailService,
            StringRedisTemplate stringRedisTemplate,
            SystemSettingRepository systemSettingRepository,
            UserRepository userRepository) {
        this.paymentRepository    = paymentRepository;
        this.sessionRepository    = sessionRepository;
        this.hotspotRepository    = hotspotRepository;
        this.planRepository       = planRepository;
        this.mtnGateway           = mtnGateway;
        this.orangeGateway        = orangeGateway;
        this.monerooGateway       = monerooGateway;
        this.campayGateway        = campayGateway;
        this.fastApiPaymentClient = fastApiPaymentClient;
        this.fastApiTicketClient  = fastApiTicketClient;
        this.userRepository       = userRepository;
        this.ticketRepository     = ticketRepository;
        this.subscriptionService  = subscriptionService;
        this.sseService           = sseService;
        this.emailService         = emailService;
        this.stringRedisTemplate  = stringRedisTemplate;
        this.systemSettingRepository = systemSettingRepository;
    }

    // ── Initiation ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponse initiate(InitiatePaymentRequest request) {
        String reference = UUID.randomUUID().toString();

        Payment payment = Payment.builder()
                .paymentId(UUID.randomUUID().toString())
                .reference(reference)
                .hotspotId(request.getHotspotId())
                .planId(request.getPlanId())
                .clientPhone(request.getPhone())
                .clientMac(request.getMac() != null ? request.getMac().toUpperCase() : null)
                .operator(request.getOperator())
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(PAYMENT_TIMEOUT_MINUTES))
                .build();

        if ("SUBSCRIPTION".equals(request.getHotspotId())) {
            payment.setDescription("Abonnement SaaS — " + request.getPlanId());
            payment.setAmount(determineSubscriptionAmount(request.getPlanId(), request.getPlanName()));
        } else {
            // Valider hotspot + plan via FastAPI (source de vérité)
            JsonNode validation = fastApiPaymentClient.validateHotspotPlan(
                    request.getHotspotId(), request.getPlanId());
            if (validation == null || !validation.path("success").asBoolean()) {
                throw AppException.notFound("Hotspot ou forfait introuvable");
            }
            JsonNode data = validation.path("data");
            String price = data.path("price").asText("0");
            String hotspotName = data.path("hotspot_name").asText("Hotspot");
            String planName = data.path("plan_name").asText("Forfait");

            payment.setAmount(new java.math.BigDecimal(price));
            payment.setDescription(planName + " — " + hotspotName);
        }

        paymentRepository.save(payment);

        try {
            MoMoGateway gateway = resolveGateway(request.getOperator());
            String rawResult    = gateway.requestToPay(
                    request.getPhone(), payment.getAmount(),
                    payment.getCurrency(), reference, payment.getDescription());

            // Moneroo → "monerooId|checkoutUrl" | Campay → "campayRef|ussdCode"
            if (rawResult != null && rawResult.contains("|")) {
                String[] parts = rawResult.split("\\|", 2);
                payment.setGatewayTxId(parts[0]);
                if (request.getOperator() == PaymentOperator.MONEROO && parts.length > 1) {
                    payment.setCheckoutUrl(parts[1].isBlank() ? null : parts[1]);
                }
            } else {
                payment.setGatewayTxId(rawResult);
            }

            paymentRepository.save(payment);
            log.info("Paiement initié ref={} op={} amount={}", reference,
                    request.getOperator(), payment.getAmount());
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(e.getMessage());
            paymentRepository.save(payment);
            log.error("Échec initiation paiement ref={}: {}", reference, e.getMessage());
            // Message générique pour le client — ne pas exposer les détails techniques
            String userMessage = "Un problème est survenu. Veuillez réessayer plus tard.";
            if (e.getMessage() != null && e.getMessage().contains("401")) {
                userMessage = "Le service de paiement est momentanément indisponible. Réessayez dans quelques instants.";
            }
            throw AppException.badRequest("Impossible d'initier le paiement : " + userMessage);
        }

        return toResponse(payment);
    }

    // ── Statut ────────────────────────────────────────────────────────────

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
                .message(getStatusMessage(payment.getStatus()));

        if (payment.getStatus() == PaymentStatus.PAID) {
            sessionRepository.findByPaymentId(payment.getPaymentId()).ifPresent(session -> {
                Plan plan = planRepository.findByPlanId(session.getPlanId()).orElse(null);
                builder.session(PaymentStatusResponse.SessionInfo.builder()
                        .sessionId(session.getSessionId())
                        .activatedAt(session.getActivatedAt())
                        .expiresAt(session.getExpiresAt())
                        .durationLabel(plan != null ? formatDuration(plan.getDurationMinutes()) : "")
                        .build());
            });
        }
        return builder.build();
    }

    // ── Confirmation webhook ──────────────────────────────────────────────

    @Override
    @Transactional
    public void confirmFromWebhook(String reference, String gatewayTxId, boolean success) {
        // Verrou distribué pour empêcher le double-processing (webhooks concurrents)
        String lockKey = LOCK_PREFIX + reference;
        Boolean acquired = stringRedisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", LOCK_TTL_SECONDS, TimeUnit.SECONDS);

        if (acquired != null && !acquired) {
            log.warn("Paiement déjà en cours de traitement (verrou actif) ref={}", reference);
            return; // Un autre thread/processeur traite déjà ce webhook
        }

        try {
            doConfirmPayment(reference, gatewayTxId, success);
        } finally {
            stringRedisTemplate.delete(lockKey);
        }
    }

    private void doConfirmPayment(String reference, String gatewayTxId, boolean success) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> AppException.notFound("Paiement introuvable ref=" + reference));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            log.warn("Paiement déjà traité ref={} statut={}", reference, payment.getStatus());
            return;
        }

        if (!success) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Refusé par l'opérateur");
            paymentRepository.save(payment);
            pushSse(reference, PaymentStatus.FAILED, false);
            log.warn("Paiement échoué ref={}", reference);
            return;
        }

        // ── Phase 1 : Confirmer le paiement IMMÉDIATEMENT (transaction courte) ──
        payment.setStatus(PaymentStatus.PAID);
        payment.setGatewayTxId(gatewayTxId != null ? gatewayTxId : payment.getGatewayTxId());
        payment.setWebhookReceivedAt(LocalDateTime.now());
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // ── Phase 2 : Activation IMMÉDIATE — pas de retry dans la transaction ──
        boolean isSubscription = "SUBSCRIPTION".equals(payment.getHotspotId());
        if (isSubscription) {
            activateSubscription(payment);
        } else {
            // Créer la session PENDING + appeler FastAPI en une fois
            activateSession(payment);
        }

        // ── Phase 3 : Notifier le client IMMÉDIATEMENT via SSE ──
        boolean wifiActivated = !isSubscription && !Boolean.TRUE.equals(payment.getManualConnect());
        pushSse(reference, PaymentStatus.PAID, wifiActivated);

        log.info("Paiement confirmé ref={} type={} mac={}",
                reference, isSubscription ? "Abonnement" : "Forfait WiFi",
                payment.getClientMac());
    }

    // ── Historique ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> findByHotspot(String userId, String hotspotId, Pageable pageable) {
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));
        return paymentRepository
                .findAllByHotspotIdOrderByCreatedAtDesc(hotspotId, pageable)
                .map(this::toResponse);
    }

    // ── Privé ─────────────────────────────────────────────────────────────

    /**
     * Active la session WiFi après paiement confirmé — Architecture FastAPI.
     * <p>
     * Vérifie d'abord le paramètre autoConnect du hotspot owner :
     * <ul>
     *   <li>Si autoConnect = true (ou indisponible) → crée la session + active le routeur immédiatement</li>
     *   <li>Si autoConnect = false → stocke les credentials sur le paiement pour connexion manuelle</li>
     * </ul>
     */
    private void activateSession(Payment payment) {
        Plan plan = planRepository.findByPlanId(payment.getPlanId())
                .orElseThrow(() -> AppException.notFound("Forfait introuvable"));
        Hotspot hotspot = hotspotRepository.findByHotspotId(payment.getHotspotId())
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable"));

        // ── Vérifier autoConnect du hotspot owner ──
        boolean shouldAutoConnect = true; // par défaut : auto-connect
        try {
            User owner = userRepository.findByUserId(hotspot.getUserId()).orElse(null);
            if (owner != null) {
                shouldAutoConnect = owner.isAutoConnect();
                log.debug("autoConnect du hotspot owner {} = {}", owner.getUserId(), shouldAutoConnect);
            }
        } catch (Exception e) {
            log.warn("Impossible de lire autoConnect pour hotspot {}: {} — fallback auto-connect",
                    payment.getHotspotId(), e.getMessage());
        }

        // ── Étape 1 : Ticket ou credentials ──
        Ticket availableTicket = ticketRepository
                .findFirstAvailableAndLock(payment.getHotspotId(), TicketStatus.AVAILABLE.name())
                .orElse(null);

        String username;
        String password;
        String profile;
        String timeLimit;
        String dataLimit;
        String ticketId;

        if (availableTicket != null) {
            username  = availableTicket.getUsername();
            password  = availableTicket.getPassword();
            profile   = availableTicket.getProfile();
            timeLimit = availableTicket.getUptimeLimit();
            dataLimit = availableTicket.getDataLimit() != null
                    ? availableTicket.getDataLimit().toString() : null;
            ticketId  = availableTicket.getTicketId();

            availableTicket.setStatus(TicketStatus.USED);
            availableTicket.setUsedAt(LocalDateTime.now());
            availableTicket.setClientMac(payment.getClientMac());
            availableTicket.setClientPhone(payment.getClientPhone());
            availableTicket.setSessionId(payment.getPaymentId());
            ticketRepository.save(availableTicket);

            log.info("Ticket utilisé: ticketId={} user={} hotspot={}",
                    ticketId, username, payment.getHotspotId());
        } else {
            username  = "hp_" + RandomStringUtils.randomAlphanumeric(8).toLowerCase();
            password  = RandomStringUtils.randomAlphanumeric(12);
            profile   = plan.getHotspotProfile() != null ? plan.getHotspotProfile() : "default";
            timeLimit = formatDurationForMikroTik(plan.getDurationMinutes());
            dataLimit = null;
            ticketId  = null;

            log.info("Credentials générés pour hotspot={}", payment.getHotspotId());
        }

        if (!shouldAutoConnect) {
            // ── Mode manuel : stocker les credentials sans créer de session ni appeler FastAPI ──
            payment.setManualConnect(true);
            payment.setManualUsername(username);
            payment.setManualPassword(password);
            paymentRepository.save(payment);

            log.info("autoConnect=OFF: credentials stockés ref={} user={} — le client devra se connecter manuellement",
                    payment.getReference(), username);
            return;
        }

        // ── Mode auto-connect : créer la session + activer sur le routeur (comportement actuel) ──

        // ── Étape 2 : Créer la session PENDING_MIKROTIK ──
        String sessionId = UUID.randomUUID().toString();
        Session session = Session.builder()
                .sessionId(sessionId)
                .paymentId(payment.getPaymentId())
                .hotspotId(payment.getHotspotId())
                .planId(payment.getPlanId())
                .clientPhone(payment.getClientPhone())
                .clientMac(payment.getClientMac())
                .mikrotikUsername(username)
                .mikrotikPassword(password)
                .status(SessionStatus.PENDING_MIKROTIK)
                .activatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(plan.getDurationMinutes()))
                .build();

        sessionRepository.save(session);

        // ── Étape 3 : Appeler FastAPI IMMÉDIATEMENT (1 seul appel, pas de retry bloquant) ──
        try {
            boolean activated = fastApiTicketClient.activateGeneratedCredentials(
                    payment.getHotspotId(),
                    username,
                    password,
                    profile,
                    timeLimit,
                    dataLimit,
                    payment.getClientMac(),
                    sessionId
            );
            if (activated) {
                log.info("✅ Action FastAPI créée: session={} user={} mac={}",
                        sessionId, username, payment.getClientMac());
            } else {
                log.warn("⚠️ FastAPI n'a pas confirmé activation: session={} — sera retrié par job", sessionId);
            }
        } catch (Exception e) {
            log.error("❌ Erreur appel FastAPI session={}: {} — sera retrié par job",
                    sessionId, e.getMessage());
        }
    }

    /**
     * Active manuellement la session WiFi après paiement avec auto-connect désactivé.
     * Appelé quand le client clique "Se connecter" sur le portail captif.
     * Crée la session + appelle FastAPI pour activer le compte sur le routeur.
     */
    @Override
    @Transactional
    public PaymentResponse connectManually(String reference, String mac) {
        Payment payment = paymentRepository.findByReference(reference)
                .orElseThrow(() -> AppException.notFound("Paiement introuvable"));

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw AppException.badRequest("Le paiement n'est pas confirmé");
        }
        if (!Boolean.TRUE.equals(payment.getManualConnect())) {
            throw AppException.badRequest("Ce paiement n'attend pas de connexion manuelle");
        }

        Hotspot hotspot = hotspotRepository.findByHotspotId(payment.getHotspotId())
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable"));
        Plan plan = planRepository.findByPlanId(payment.getPlanId())
                .orElseThrow(() -> AppException.notFound("Forfait introuvable"));

        String username  = payment.getManualUsername();
        String password  = payment.getManualPassword();
        String profile   = plan.getHotspotProfile() != null ? plan.getHotspotProfile() : "default";
        String timeLimit = formatDurationForMikroTik(plan.getDurationMinutes());

        // Mettre à jour le MAC avec celui du client qui se connecte
        if (mac != null && !mac.isBlank()) {
            payment.setClientMac(mac.toUpperCase());
            paymentRepository.save(payment);
        }

        // ── Créer la session PENDING_MIKROTIK ──
        String sessionId = UUID.randomUUID().toString();
        Session session = Session.builder()
                .sessionId(sessionId)
                .paymentId(payment.getPaymentId())
                .hotspotId(payment.getHotspotId())
                .planId(payment.getPlanId())
                .clientPhone(payment.getClientPhone())
                .clientMac(payment.getClientMac())
                .mikrotikUsername(username)
                .mikrotikPassword(password)
                .status(SessionStatus.PENDING_MIKROTIK)
                .activatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(plan.getDurationMinutes()))
                .build();

        sessionRepository.save(session);

        // ── Appeler FastAPI ──
        try {
            fastApiTicketClient.activateGeneratedCredentials(
                    payment.getHotspotId(),
                    username,
                    password,
                    profile,
                    timeLimit,
                    null,
                    payment.getClientMac(),
                    sessionId
            );
        } catch (Exception e) {
            log.error("❌ Erreur FastAPI connexion manuelle ref={}: {}", reference, e.getMessage());
            // On ne jette pas d'exception — la session est créée, le job de retry gérera
        }

        // Nettoyer les champs manuels (utilisés une seule fois)
        payment.setManualConnect(false);
        paymentRepository.save(payment);

        log.info("🔌 Connexion manuelle réussie: ref={} user={} session={}", reference, username, sessionId);

        // Pousser l'événement SSE pour que le frontend polling détecte wifiActivated
        pushSse(reference, PaymentStatus.PAID, true);

        return toResponse(payment);
    }

    private String formatDurationForMikroTik(int totalMinutes) {
        return DurationUtils.formatMikroTik(totalMinutes);
    }

    private void activateSubscription(Payment payment) {
        subscriptionService.activateAfterPayment(payment.getReference());
    }

    private void pushSse(String reference, PaymentStatus status, boolean wifiActivated) {
        try {
            sseService.push(reference, PaymentStatusEvent.builder()
                    .reference(reference)
                    .status(status)
                    .wifiActivated(wifiActivated)
                    .message(status == PaymentStatus.PAID
                            ? "✅ Paiement confirmé ! Connexion WiFi en cours d'activation..."
                            : "❌ Paiement refusé.")
                    .build());
        } catch (Exception e) {
            log.warn("SSE push error ref={}: {}", reference, e.getMessage());
        }
    }

    private MoMoGateway resolveGateway(PaymentOperator operator) {
        // MTN_MOMO et ORANGE_MONEY sont les opérateurs client (choix utilisateur)
        // → router via l'agrégateur actif (Moneroo ou Campay)
        //    qui détecte l'opérateur depuis le numéro de téléphone
        if (operator == PaymentOperator.MTN_MOMO || operator == PaymentOperator.ORANGE_MONEY) {
            // Priorité : Campay si activé, sinon Moneroo si activé
            // Fallback Campay par défaut (agrégateur par défaut dans les paramètres)
            if (isAggregatorEnabled("payments.campay.enabled")) {
                log.debug("Routage {} via Campay (agrégateur actif)", operator);
                return campayGateway;
            }
            if (isAggregatorEnabled("payments.moneroo.enabled")) {
                log.debug("Routage {} via Moneroo (agrégateur actif)", operator);
                return monerooGateway;
            }

            // Fallback : Campay par défaut (paramètres pas encore seedés en DB)
            log.warn("Aucun agrégateur explicite activé — fallback Campay pour {}", operator);
            return campayGateway;
        }

        return switch (operator) {
            case MONEROO -> monerooGateway;
            case CAMPAY  -> campayGateway;
            default -> throw new IllegalArgumentException(
                    "Opérateur non supporté : " + operator);
        };
    }

    /**
     * Vérifie si un agrégateur est activé dans les paramètres système.
     * La valeur est "true" ou "false" (stockée comme texte).
     */
    private boolean isAggregatorEnabled(String settingKey) {
        try {
            return systemSettingRepository.findBySettingKey(settingKey)
                    .map(s -> "true".equalsIgnoreCase(s.getValue()))
                    .orElse(false);
        } catch (Exception e) {
            log.warn("Impossible de lire le paramètre {}: {}", settingKey, e.getMessage());
            return false;
        }
    }

    private BigDecimal determineSubscriptionAmount(String planId, String planName) {
        // Essayer d'abord via FastAPI si le planName est disponible
        if (planName != null && !planName.isBlank()) {
            try {
                JsonNode resp = fastApiPaymentClient.getPlanPrice(planName.toLowerCase());
                JsonNode planData = resp != null ? resp.path("data") : null;
                if (planData != null && !planData.isMissingNode() && planData.has("price")) {
                    return new BigDecimal(planData.get("price").asInt(0));
                }
            } catch (Exception e) {
                log.warn("Impossible de récupérer le prix {} depuis FastAPI: {}", planName, e.getMessage());
            }
        }
        // Fallback hardcode
        return switch (planName != null ? planName.toUpperCase() : "") {
            case "PRO"     -> new BigDecimal("1500");
            case "PREMIUM" -> new BigDecimal("5000");
            default        -> BigDecimal.ZERO; // STANDARD = gratuit
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
                .checkoutUrl(p.getCheckoutUrl())
                .paidAt(p.getPaidAt())
                .expiresAt(p.getExpiresAt())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private String getStatusMessage(PaymentStatus status) {
        return switch (status) {
            case PENDING  -> "En attente de confirmation";
            case PAID     -> "Paiement confirmé — activation WiFi en cours";
            case FAILED   -> "Paiement échoué";
            case EXPIRED  -> "Paiement expiré";
            case REFUNDED -> "Paiement remboursé";
        };
    }

    private String formatDuration(int minutes) {
        return DurationUtils.formatHumanReadable(minutes);
    }
}
