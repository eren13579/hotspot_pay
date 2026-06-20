package com.hotspotpay.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Active le cache Spring (@Cacheable, @CacheEvict, @CachePut).
 * La configuration Redis du CacheManager est dans RedisConfig.cacheManager().
 * Les TTL spécifiques sont :
 *   plans          → 5 min  (forfaits actifs par hotspot)
 *   hotspot-status → 30s    (statut online/offline)
 *   plan-limits    → 10 min (limites BASIC/PRO/ENTERPRISE)
 *   portal-hotspot → 2 min  (infos portail captif)
 *   user-profile   → 5 min  (profil utilisateur)
 */
@EnableCaching
@Configuration
public class CacheConfig {

    // Constantes utilisées dans @Cacheable(value = CacheConfig.CACHE_PLANS, ...)
    public static final String CACHE_PLANS          = "plans";
    public static final String CACHE_HOTSPOT_STATUS = "hotspot-status";
    public static final String CACHE_PLAN_LIMITS    = "plan-limits";
    public static final String CACHE_PORTAL_HOTSPOT = "portal-hotspot";
    public static final String CACHE_USER_PROFILE   = "user-profile";
}
