package com.hotspotpay.payment.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
public class IdempotencyUtil {

    // Cache en mémoire limité à 10 000 entrées (à remplacer par Redis en prod)
    private final Map<String, Boolean> processedEvents = Collections.synchronizedMap(
            new LinkedHashMap<>(1000, 0.75f, false) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
                    return size() > 10_000;
                }
            }
    );

    /**
     * @return true si l'événement est NOUVEAU (pas encore traité)
     *         false si l'événement a déjà été traité (doublon)
     */
    public boolean isNewEvent(String eventId) {
        if (eventId == null || eventId.isBlank()) {
            log.warn("Received null/blank eventId, treating as new");
            return true;
        }
        boolean isNew = processedEvents.putIfAbsent(eventId, Boolean.TRUE) == null;
        if (!isNew) {
            log.warn("Duplicate webhook event detected, skipping: {}", eventId);
        }
        return isNew;
    }
}