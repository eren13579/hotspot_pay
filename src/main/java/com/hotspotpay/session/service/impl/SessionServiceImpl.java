package com.hotspotpay.session.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.common.util.DurationUtils;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.realtime.service.SystemSseService;
import com.hotspotpay.plan.model.Plan;
import com.hotspotpay.plan.repository.PlanRepository;
import com.hotspotpay.router.dto.RouterActionPayload;
import com.hotspotpay.router.enumeration.RouterActionType;
import com.hotspotpay.router.service.RouterActionService;
import com.hotspotpay.session.dto.SessionResponse;
import com.hotspotpay.session.enumeration.SessionStatus;
import com.hotspotpay.session.model.Session;
import com.hotspotpay.session.repository.SessionRepository;
import com.hotspotpay.session.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Service de gestion des sessions WiFi — Architecture Pull.
 *
 * La révocation ne contacte plus MikroTik directement.
 * Elle crée des RouterAction KICK_SESSION + REMOVE_USER que le routeur
 * exécutera au prochain poll (dans max 10s).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository   sessionRepository;
    private final HotspotRepository   hotspotRepository;
    private final PlanRepository      planRepository;
    private final RouterActionService routerActionService;
    private final SystemSseService    systemSseService;

    @Override
    @Transactional(readOnly = true)
    public Page<SessionResponse> findByHotspot(String userId, String hotspotId, Pageable pageable) {
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));
        return sessionRepository
                .findAllByHotspotIdOrderByActivatedAtDesc(hotspotId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SessionResponse findById(String userId, String sessionId) {
        Session session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AppException.notFound("Session introuvable"));

        hotspotRepository.findByHotspotIdAndUserId(session.getHotspotId(), userId)
                .orElseThrow(() -> AppException.forbidden("Accès refusé"));

        return toResponse(session);
    }

    /**
     * Révocation manuelle d'une session par le propriétaire du hotspot.
     *
     * Architecture Pull :
     *   1. Marquer la session REVOKED en DB immédiatement
     *   2. Créer RouterAction KICK_SESSION → le routeur déconnecte le client
     *   3. Créer RouterAction REMOVE_USER → le routeur supprime le compte HotSpot
     *
     * Le client perd sa connexion dans les 10 secondes (prochain poll routeur).
     */
    @Override
    @Transactional
    public void revoke(String userId, String sessionId) {
        Session session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AppException.notFound("Session introuvable"));

        hotspotRepository.findByHotspotIdAndUserId(session.getHotspotId(), userId)
                .orElseThrow(() -> AppException.forbidden("Accès refusé"));

        if (session.getStatus() == SessionStatus.REVOKED) {
            throw AppException.badRequest("Session déjà révoquée");
        }
        if (session.getStatus() == SessionStatus.EXPIRED) {
            throw AppException.badRequest("Session déjà expirée — impossible de révoquer");
        }

        // 1. Mettre à jour le statut en DB immédiatement
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.updateStatus(sessionId, SessionStatus.REVOKED, now, now);

        // 2. RouterAction KICK_SESSION — déconnecte la session WiFi active
        RouterActionPayload kickPayload = RouterActionPayload.builder()
                .username(session.getMikrotikUsername())
                .sessionId(session.getSessionId())
                .build();

        routerActionService.createAction(
                session.getHotspotId(),
                RouterActionType.KICK_SESSION,
                kickPayload,
                session.getSessionId()
        );

        // 3. RouterAction REMOVE_USER — supprime le compte du hotspot MikroTik
        RouterActionPayload removePayload = RouterActionPayload.builder()
                .username(session.getMikrotikUsername())
                .sessionId(session.getSessionId())
                .build();

        routerActionService.createAction(
                session.getHotspotId(),
                RouterActionType.REMOVE_USER,
                removePayload,
                session.getSessionId()
        );

        systemSseService.broadcast("session_updated", "revoked:" + sessionId);

        log.info("Session révoquée: sessionId={} userId={} — actions KICK+REMOVE créées (exécution dans ≤10s)",
                sessionId, userId);
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private SessionResponse toResponse(Session s) {
        Plan plan = planRepository.findByPlanId(s.getPlanId()).orElse(null);

        return SessionResponse.builder()
                .sessionId(s.getSessionId())
                .paymentId(s.getPaymentId())
                .hotspotId(s.getHotspotId())
                .planId(s.getPlanId())
                .planName(plan != null ? plan.getName() : "-")
                .clientPhone(s.getClientPhone())
                .clientMac(s.getClientMac())
                .status(s.getStatus())
                .activatedAt(s.getActivatedAt())
                .expiresAt(s.getExpiresAt())
                .expiredAt(s.getExpiredAt())
                .durationLabel(plan != null ? formatDuration(plan.getDurationMinutes()) : "-")
                .remainingLabel(buildRemainingLabel(s))
                .bytesIn(s.getBytesIn())
                .bytesOut(s.getBytesOut())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private String buildRemainingLabel(Session session) {
        if (session.getStatus() == SessionStatus.PENDING_MIKROTIK) {
            return "En cours d'activation...";
        }
        if (session.getStatus() != SessionStatus.ACTIVE) {
            return "Expirée";
        }
        long minutesLeft = ChronoUnit.MINUTES.between(
                LocalDateTime.now(), session.getExpiresAt());
        if (minutesLeft <= 0)  return "Expiration imminente";
        if (minutesLeft < 60)  return minutesLeft + " min restante(s)";
        return (minutesLeft / 60) + "h " + (minutesLeft % 60) + "min restante(s)";
    }

    private String formatDuration(int minutes) {
        return DurationUtils.formatHumanReadable(minutes);
    }
}
