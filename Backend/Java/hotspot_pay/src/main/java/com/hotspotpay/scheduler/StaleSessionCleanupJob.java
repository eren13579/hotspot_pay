package com.hotspotpay.scheduler;

import com.hotspotpay.router.dto.RouterActionPayload;
import com.hotspotpay.router.enumeration.RouterActionType;
import com.hotspotpay.router.service.RouterActionService;
import com.hotspotpay.session.enumeration.SessionStatus;
import com.hotspotpay.session.model.Session;
import com.hotspotpay.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Nettoie les sessions bloquées en PENDING_MIKROTIK depuis trop longtemps.
 *
 * Une session PENDING_MIKROTIK devrait passer en ACTIVE dans les 2-3 minutes
 * (Long Polling timeout 20s + latence réseau). Si elle reste bloquée plus de
 * 10 minutes, c'est que le routeur est offline ou FastAPI est down.
 *
 * Ces sessions sont marquées EXPIRED et des actions KICK_SESSION + REMOVE_USER
 * sont envoyées au routeur pour nettoyer les users orphelins sur MikroTik.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StaleSessionCleanupJob {

    private final SessionRepository   sessionRepository;
    private final RouterActionService routerActionService;

    private static final int STALE_THRESHOLD_MINUTES = 10;

    /** Vérifie les sessions PENDING_MIKROTIK bloquées toutes les 5 minutes */
    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void cleanupStalePendingSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(STALE_THRESHOLD_MINUTES);
        List<Session> stale = sessionRepository.findStalePendingMikrotik(cutoff);

        if (stale.isEmpty()) return;

        log.warn("Nettoyage de {} session(s) PENDING_MIKROTIK bloquée(s) depuis > {} min",
                stale.size(), STALE_THRESHOLD_MINUTES);

        LocalDateTime now = LocalDateTime.now();
        for (Session session : stale) {
            sessionRepository.updateStatus(
                    session.getSessionId(),
                    SessionStatus.EXPIRED,
                    now,
                    now
            );

            // Envoyer KICK_SESSION + REMOVE_USER pour nettoyer le user sur le routeur
            // même si le routeur n'a jamais exécuté le CREATE_USER, ces actions
            // ne feront pas de mal (MikroTik ignore les users inexistents)
            RouterActionPayload payload = RouterActionPayload.builder()
                    .username(session.getMikrotikUsername())
                    .sessionId(session.getSessionId())
                    .build();

            routerActionService.createAction(
                    session.getHotspotId(),
                    RouterActionType.KICK_SESSION,
                    payload,
                    session.getSessionId()
            );

            routerActionService.createAction(
                    session.getHotspotId(),
                    RouterActionType.REMOVE_USER,
                    payload,
                    session.getSessionId()
            );

            log.warn("Session bloquée expirée + KICK/REMOVE envoyés: sessionId={} user={} hotspot={} activatedAt={}",
                    session.getSessionId(),
                    session.getMikrotikUsername(),
                    session.getHotspotId(),
                    session.getActivatedAt());
        }
    }
}
