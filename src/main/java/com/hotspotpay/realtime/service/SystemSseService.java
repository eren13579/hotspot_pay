package com.hotspotpay.realtime.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service SSE système — broadcast des événements à tous les clients connectés.
 * Utilisé pour notifier les pages admin des changements de settings, FAQ,
 * messages de contact, etc. en temps réel.
 */
@Slf4j
@Service
public class SystemSseService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** Abonne un nouveau client au flux SSE système */
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // pas de timeout
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(()    -> { emitters.remove(emitter); });
        emitter.onError(e ->      { emitters.remove(emitter); });

        // Envoie un événement de connexion immédiat pour flusher les headers HTTP
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected", "clientCount", emitters.size())));
        } catch (IOException e) {
            log.warn("System SSE: nouveau client déjà déconnecté");
            emitters.remove(emitter);
        }

        log.debug("System SSE subscribed — total clients: {}", emitters.size());
        return emitter;
    }

    /** Broadcast un événement nommé à tous les clients connectés */
    public void broadcast(String eventName, Object data) {
        if (emitters.isEmpty()) return;

        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
        if (!dead.isEmpty()) {
            log.debug("System SSE: {} emitter(s) removed (disconnected)", dead.size());
        }
    }

    public int activeSubscriptions() { return emitters.size(); }
}
