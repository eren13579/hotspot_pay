package com.hotspotpay.ratelimit.service;

/**
 * Service de limitation de débit par IP, basé sur Redis.
 */
public interface RateLimitService {

    /** Vérifie si la prochaine requête est autorisée (sans incrémenter) */
    boolean isAllowed(String key, int maxRequests, int windowSeconds);

    /** Enregistre une requête (incrémente le compteur) */
    void recordRequest(String key);

    /**
     * Vérifie ET enregistre en une seule opération atomique Redis.
     * Retourne true si autorisé, false si limite dépassée.
     * Préférer cette méthode pour éviter les race conditions.
     */
    boolean checkAndRecord(String key, int maxRequests, int windowSeconds);

    /** Retourne le compteur actuel (pour X-RateLimit-Remaining) */
    long getCount(String key);

    /** Retourne le TTL restant en secondes (pour X-RateLimit-Reset) */
    long getTtlSeconds(String key);
}
