package com.hotspotpay.payment.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Idempotence des webhooks de paiement — Redis primaire + mémoire en fallback.
 *
 * Clé Redis : "idp:{eventId}" → TTL 24h
 * Opération : SET NX EX (atomique)
 *
 * Usage :
 *   if (!idempotencyUtil.isNewEvent(eventId)) return; // doublon ignoré
 *   // traiter normalement...
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IdempotencyUtil {

    private final StringRedisTemplate redis;

    private static final String   PREFIX = "idp:";
    private static final Duration TTL    = Duration.ofHours(24);

    /** Cache mémoire LRU — fallback si Redis indisponible */
    private final Map<String, Boolean> memCache = Collections.synchronizedMap(
            new LinkedHashMap<>(1000, 0.75f, false) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
                    return size() > 10_000;
                }
            });

    /**
     * Vérifie si l'événement est nouveau ET le marque comme traité (opération atomique).
     *
     * @param eventId identifiant unique de l'événement webhook
     * @return true → nouveau événement (à traiter) | false → doublon (ignorer)
     */
    public boolean isNewEvent(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            log.warn("Webhook eventId null/vide — considéré comme nouveau");
            return true;
        }

        // Redis — SET NX EX atomique
        try {
            Boolean isNew = redis.opsForValue().setIfAbsent(PREFIX + eventId, "1", TTL);
            boolean result = Boolean.TRUE.equals(isNew);
            if (!result) log.warn("Webhook doublon (Redis): eventId={}", eventId);
            return result;
        } catch (Exception e) {
            log.warn("Redis indisponible pour idempotency — fallback mémoire: {}", e.getMessage());
        }

        // Fallback mémoire
        boolean isNew = memCache.putIfAbsent(eventId, Boolean.TRUE) == null;
        if (!isNew) log.warn("Webhook doublon (mémoire): eventId={}", eventId);
        return isNew;
    }
}
