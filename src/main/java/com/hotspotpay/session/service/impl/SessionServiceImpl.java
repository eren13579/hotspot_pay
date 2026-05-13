package com.hotspotpay.session.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.hotspot.mikrotik.MikroTikClient;
import com.hotspotpay.hotspot.mikrotik.utils.MikroTikCredentialUtil;
import com.hotspotpay.hotspot.model.Hotspot;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.plan.model.Plan;
import com.hotspotpay.plan.repository.PlanRepository;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository     sessionRepository;
    private final HotspotRepository     hotspotRepository;
    private final PlanRepository        planRepository;
    private final MikroTikClient        mikrotikClient;
    private final MikroTikCredentialUtil credentialUtil;

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

        // Vérifie que le hotspot appartient à cet utilisateur
        hotspotRepository.findByHotspotIdAndUserId(session.getHotspotId(), userId)
                .orElseThrow(() -> AppException.forbidden("Accès refusé"));

        return toResponse(session);
    }

    @Override
    @Transactional
    public void revoke(String userId, String sessionId) {
        Session session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> AppException.notFound("Session introuvable"));

        Hotspot hotspot = hotspotRepository
                .findByHotspotIdAndUserId(session.getHotspotId(), userId)
                .orElseThrow(() -> AppException.forbidden("Accès refusé"));

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw AppException.badRequest("Session déjà expirée ou révoquée");
        }

        // Révoque sur MikroTik
        String plainPassword = credentialUtil.decrypt(hotspot.getMikrotikPasswordEnc());
        mikrotikClient.kickActiveSession(hotspot, plainPassword, session.getMikrotikUsername());
        mikrotikClient.removeHotspotUser(hotspot, plainPassword, session.getMikrotikUsername());

        // Met à jour en DB
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.updateStatus(sessionId, SessionStatus.REVOKED, now, now);

        log.info("Session revoked manually: sessionId={}, by userId={}", sessionId, userId);
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
        if (session.getStatus() != SessionStatus.ACTIVE) {
            return "Expirée";
        }
        long minutesLeft = ChronoUnit.MINUTES.between(
                LocalDateTime.now(), session.getExpiresAt());
        if (minutesLeft <= 0)   return "Expiration imminente";
        if (minutesLeft < 60)   return minutesLeft + " min restante(s)";
        return (minutesLeft / 60) + "h " + (minutesLeft % 60) + "min restante(s)";
    }

    private String formatDuration(int minutes) {
        if (minutes < 60)    return minutes + " min";
        if (minutes < 1440)  return (minutes / 60) + "h";
        if (minutes < 10080) return (minutes / 1440) + " jour(s)";
        return (minutes / 10080) + " semaine(s)";
    }
}