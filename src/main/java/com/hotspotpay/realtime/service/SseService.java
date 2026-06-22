package com.hotspotpay.realtime.service;

import com.hotspotpay.realtime.dto.PaymentStatusEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service SSE (Server-Sent Events).
 * <ul>
 *   <li>Paiement : push de statut vers un client abonné à une référence</li>
 *   <li>Système : broadcast global à TOUS les clients connectés (settings, FAQ, etc.)</li>
 * </ul>
 */
@Slf4j
@Service
public class SseService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final Map<String, SseEmitter> systemEmitters = new ConcurrentHashMap<>();
    private final AtomicLong systemIdCounter = new AtomicLong(0);

    // ── Paiement (existant) ─────────────────────────────────────────────

    /** Crée un émetteur SSE pour une référence de paiement */
    public SseEmitter subscribe(String reference) {
        SseEmitter emitter = new SseEmitter(5 * 60 * 1000L); // timeout 5 min
        emitters.put(reference, emitter);

        emitter.onCompletion(() -> emitters.remove(reference));
        emitter.onTimeout(()    -> { emitters.remove(reference); emitter.complete(); });
        emitter.onError(e ->      { emitters.remove(reference); });

        log.debug("SSE subscribed for payment ref={}", reference);
        return emitter;
    }

    /** Envoie un événement au client abonné à cette référence */
    public void push(String reference, PaymentStatusEvent event) {
        SseEmitter emitter = emitters.get(reference);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event()
                    .name("payment-status")
                    .data(event));
            if (event.isWifiActivated() || event.getStatus().name().equals("FAILED")
                    || event.getStatus().name().equals("EXPIRED")) {
                emitter.complete();
                emitters.remove(reference);
            }
        } catch (IOException e) {
            log.warn("SSE send error for ref={}: {}", reference, e.getMessage());
            emitters.remove(reference);
            emitter.completeWithError(e);
        }
    }

    public int activeSubscriptions() { return emitters.size(); }

    // ── Système (broadcast global) ───────────────────────────────────────

    /**
     * Abonne un client aux événements système globaux.
     * Le client reçoit tous les broadcasts (settings_updated, faq_updated, etc.)
     */
    public SseEmitter subscribeSystem() {
        String id = "sys-" + systemIdCounter.incrementAndGet();
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // pas de timeout
        systemEmitters.put(id, emitter);

        emitter.onCompletion(() -> systemEmitters.remove(id));
        emitter.onTimeout(()    -> { systemEmitters.remove(id); });
        emitter.onError(e ->      { systemEmitters.remove(id); });

        // Envoyer un événement de connexion initial
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"message\":\"connecté\"}"));
        } catch (IOException e) {
            systemEmitters.remove(id);
        }

        log.debug("SSE system subscribed (total: {})", systemEmitters.size());
        return emitter;
    }

    /**
     * Broadcast un événement à TOUS les clients abonnés au système.
     *
     * @param eventType nom de l'événement (settings_updated, faq_updated, etc.)
     * @param data      données JSON ou objet sérialisable
     */
    public void broadcast(String eventType, Object data) {
        if (systemEmitters.isEmpty()) return;

        Iterator<Map.Entry<String, SseEmitter>> it = systemEmitters.entrySet().iterator();
        int sent = 0;
        while (it.hasNext()) {
            SseEmitter emitter = it.next().getValue();
            try {
                emitter.send(SseEmitter.event()
                        .name(eventType)
                        .data(data));
                sent++;
            } catch (IOException e) {
                it.remove();
            }
        }
        if (sent > 0) {
            log.debug("SSE broadcast '{}' sent to {} clients", eventType, sent);
        }
    }

    public int activeSystemSubscriptions() { return systemEmitters.size(); }
}
