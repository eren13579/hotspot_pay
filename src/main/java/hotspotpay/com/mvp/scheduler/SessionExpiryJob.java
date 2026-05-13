package hotspotpay.com.mvp.scheduler;

import hotspotpay.com.mvp.hotspot.mikrotik.MikroTikClient;
import hotspotpay.com.mvp.hotspot.mikrotik.Utils.MikroTikCredentialUtil;
import hotspotpay.com.mvp.hotspot.model.Hotspot;
import hotspotpay.com.mvp.hotspot.repository.HotspotRepository;
import hotspotpay.com.mvp.session.model.Session;
import hotspotpay.com.mvp.session.enumeration.SessionStatus;
import hotspotpay.com.mvp.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiryJob {

    private final SessionRepository     sessionRepository;
    private final HotspotRepository     hotspotRepository;
    private final MikroTikClient        mikrotikClient;
    private final MikroTikCredentialUtil credentialUtil;

    // Vérifie les sessions expirées toutes les 60 secondes
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void expireActiveSessions() {
        List<Session> expired = sessionRepository.findExpiredActive(LocalDateTime.now());
        if (expired.isEmpty()) return;

        log.info("Expiring {} session(s)...", expired.size());

        for (Session session : expired) {
            try {
                // Révoque l'accès sur MikroTik
                hotspotRepository.findByHotspotId(session.getHotspotId())
                        .ifPresent(hotspot -> revokeOnMikrotik(hotspot, session));

                // Met à jour le statut en DB
                LocalDateTime now = LocalDateTime.now();
                sessionRepository.updateStatus(
                        session.getSessionId(),
                        SessionStatus.EXPIRED,
                        now, now
                );
                log.info("Session expired: sessionId={}, mac={}",
                        session.getSessionId(), session.getClientMac());

            } catch (Exception e) {
                log.error("Error expiring session {}: {}",
                        session.getSessionId(), e.getMessage());
            }
        }
    }

    private void revokeOnMikrotik(Hotspot hotspot, Session session) {
        String plainPassword = credentialUtil.decrypt(hotspot.getMikrotikPasswordEnc());
        mikrotikClient.kickActiveSession(hotspot, plainPassword, session.getMikrotikUsername());
        mikrotikClient.removeHotspotUser(hotspot, plainPassword, session.getMikrotikUsername());
    }
}