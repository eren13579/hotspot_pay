package com.hotspotpay.router.controller;

import com.hotspotpay.router.dto.SessionActivationCallback;
import com.hotspotpay.session.enumeration.SessionStatus;
import com.hotspotpay.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.MessageDigest;
import java.time.LocalDateTime;

/**
 * Callback reçu de FastAPI quand le routeur MikroTik a confirmé l'exécution d'une action.
 *
 * Sécurité : chaque requête doit inclure le header X-Callback-Secret
 * contenant le secret partagé configuré dans fastapi.callback-secret.
 * Comparaison en temps constant pour éviter les timing attacks.
 * Rejette les requêtes non authentifiées avec 401.
 */
@Slf4j
@RestController
@RequestMapping("/internal/router-callback")
@RequiredArgsConstructor
public class RouterCallbackController {

    private final SessionRepository sessionRepository;

    @Value("${fastapi.callback-secret:change-me-callback-secret}")
    private String callbackSecret;

    @PostMapping("/session-activated")
    public ResponseEntity<Void> onSessionActivated(
            @RequestBody SessionActivationCallback callback,
            @RequestHeader("X-Callback-Secret") String providedSecret) {

        if (!MessageDigest.isEqual(callbackSecret.getBytes(), providedSecret.getBytes())) {
            log.warn("Callback FastAPI REJETÉ — secret invalide (sessionId={})",
                    callback.getSessionId());
            return ResponseEntity.status(401).build();
        }

        log.info("Callback FastAPI: Session activée sessionId={}, actionId={}, success={}",
                callback.getSessionId(), callback.getActionId(), callback.isSuccess());

        if (callback.isSuccess() && callback.getSessionId() != null) {
            sessionRepository.findBySessionId(callback.getSessionId()).ifPresent(session -> {
                if (session.getStatus() == SessionStatus.PENDING_MIKROTIK) {
                    sessionRepository.updateStatus(
                            callback.getSessionId(),
                            SessionStatus.ACTIVE,
                            null,
                            LocalDateTime.now()
                    );
                    log.info("Session passée en ACTIVE: sessionId={}", callback.getSessionId());
                }
            });
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping("/ticket-activated")
    public ResponseEntity<Void> onTicketActivated(
            @RequestParam String ticketId,
            @RequestParam String sessionId,
            @RequestHeader("X-Callback-Secret") String providedSecret) {

        if (!MessageDigest.isEqual(callbackSecret.getBytes(), providedSecret.getBytes())) {
            log.warn("Callback FastAPI REJETÉ — secret invalide (ticketId={})", ticketId);
            return ResponseEntity.status(401).build();
        }

        log.info("Callback FastAPI: Ticket activé ticketId={}, sessionId={}",
                ticketId, sessionId);

        return ResponseEntity.ok().build();
    }
}
