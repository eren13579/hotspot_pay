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
 * Scheduler d'expiration des sessions WiFi — Architecture Pull.
 *
 * Changement clé : au lieu d'appeler MikroTikClient directement (inaccessible
 * depuis le serveur), on crée des RouterAction REMOVE_USER + KICK_SESSION.
 * Le routeur MikroTik les récupère au prochain poll (dans max 10s) et les exécute
 * localement, sans que le serveur ait besoin de joindre le routeur.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiryJob {

    private final SessionRepository   sessionRepository;
    private final RouterActionService routerActionService;

    /** Vérifie les sessions expirées toutes les 60 secondes */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireActiveSessions() {
        List<Session> expired = sessionRepository.findExpiredActive(LocalDateTime.now());
        if (expired.isEmpty()) return;

        log.info("Expiration de {} session(s)...", expired.size());

        for (Session session : expired) {
            try {
                expireSession(session);
            } catch (Exception e) {
                log.error("Erreur expiration session {}: {}", session.getSessionId(), e.getMessage());
            }
        }
    }

    private void expireSession(Session session) {
        // 1. Mettre à jour le statut en DB immédiatement
        LocalDateTime now = LocalDateTime.now();
        sessionRepository.updateStatus(
                session.getSessionId(),
                SessionStatus.EXPIRED,
                now, now
        );

        // 2. Créer RouterAction KICK_SESSION — déconnecte la session active sur le routeur
        RouterActionPayload kickPayload = RouterActionPayload.builder()
                .username(session.getMikrotikUsername())
                .sessionId(session.getSessionId())
                .build();

        createActionWithRetry(session.getHotspotId(), RouterActionType.KICK_SESSION, kickPayload, session.getSessionId());

        // 3. Créer RouterAction REMOVE_USER — supprime le compte HotSpot sur le routeur
        RouterActionPayload removePayload = RouterActionPayload.builder()
                .username(session.getMikrotikUsername())
                .sessionId(session.getSessionId())
                .build();

        createActionWithRetry(session.getHotspotId(), RouterActionType.REMOVE_USER, removePayload, session.getSessionId());

        log.info("Session expirée: sessionId={}, mac={}, username={} — actions KICK+REMOVE créées",
                session.getSessionId(), session.getClientMac(), session.getMikrotikUsername());
    }

    private void createActionWithRetry(String hotspotId, RouterActionType type, RouterActionPayload payload, String sessionId) {
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                routerActionService.createAction(hotspotId, type, payload, sessionId);
                return;
            } catch (Exception e) {
                log.warn("Échec création action {} (tentative {}/{}): {}", type, attempt, maxRetries, e.getMessage());
                if (attempt == maxRetries) {
                    log.error("Échec définitif création action {} après {} tentatives", type, maxRetries);
                }
            }
        }
    }
}
