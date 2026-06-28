package com.hotspotpay.realtime.service;

import com.hotspotpay.realtime.dto.PaymentStatusEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service SSE (Server-Sent Events) pour le push de statut paiement vers le navigateur.
 * Utilisé par le portail captif pour éviter le polling REST côté client.
 */
@Slf4j
@Service
public class SseService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

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
}
