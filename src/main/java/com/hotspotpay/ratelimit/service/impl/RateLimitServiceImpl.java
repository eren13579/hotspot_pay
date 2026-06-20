package com.hotspotpay.ratelimit.service.impl;

import com.hotspotpay.ratelimit.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Redis — Fixed Window Counter via Lua atomique.
 * Fallback mémoire si Redis indisponible.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitServiceImpl implements RateLimitService {

    private final StringRedisTemplate redis;
    private static final String PREFIX = "rl:";

    /**
     * Script Lua atomique : INCR + EXPIRE en une seule opération.
     * Retourne le nouveau compteur.
     */
    private static final DefaultRedisScript<Long> INCR_SCRIPT = new DefaultRedisScript<>(
            "local count = redis.call('INCR', KEYS[1]) " +
            "if count == 1 then " +
            "  redis.call('EXPIRE', KEYS[1], ARGV[1]) " +
            "end " +
            "return count",
            Long.class
    );

    /** Fallback mémoire : [count, windowStartMillis] */
    private final Map<String, long[]> memFallback = new ConcurrentHashMap<>();

    // ── Interface RateLimitService ────────────────────────────────────────

    @Override
    public boolean isAllowed(String key, int maxRequests, int windowSeconds) {
        try {
            String val = redis.opsForValue().get(PREFIX + key);
            long count = val != null ? Long.parseLong(val) : 0L;
            return count < maxRequests;
        } catch (Exception e) {
            log.warn("Redis indisponible pour isAllowed — fallback: {}", e.getMessage());
            return fallbackIsAllowed(key, maxRequests, windowSeconds);
        }
    }

    @Override
    public void recordRequest(String key) {
        try {
            redis.execute(INCR_SCRIPT, List.of(PREFIX + key), String.valueOf(60));
        } catch (Exception e) {
            log.warn("Redis indisponible pour recordRequest — fallback: {}", e.getMessage());
            fallbackIncr(key);
        }
    }

    @Override
    public boolean checkAndRecord(String key, int maxRequests, int windowSeconds) {
        try {
            Long newCount = redis.execute(
                    INCR_SCRIPT, List.of(PREFIX + key), String.valueOf(windowSeconds));
            boolean allowed = newCount != null && newCount <= maxRequests;
            if (!allowed) log.debug("Rate limit dépassé key={} count={}", key, newCount);
            return allowed;
        } catch (Exception e) {
            log.warn("Redis indisponible pour checkAndRecord — fallback: {}", e.getMessage());
            return fallbackCheckAndRecord(key, maxRequests, windowSeconds);
        }
    }

    @Override
    public long getCount(String key) {
        try {
            String val = redis.opsForValue().get(PREFIX + key);
            return val != null ? Long.parseLong(val) : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    @Override
    public long getTtlSeconds(String key) {
        try {
            Long seconds = redis.getExpire(PREFIX + key, java.util.concurrent.TimeUnit.SECONDS);
            // Redis retourne -1 (no TTL) ou -2 (key inexistante) — on retourne 0 dans ces cas
            return (seconds != null && seconds > 0) ? seconds : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    // ── Fallback mémoire ──────────────────────────────────────────────────

    private boolean fallbackIsAllowed(String key, int max, int windowSeconds) {
        long[] d = getFallback(key, windowSeconds);
        return d[0] < max;
    }

    private void fallbackIncr(String key) {
        long[] d = memFallback.computeIfAbsent(key, k -> new long[]{0L, System.currentTimeMillis()});
        d[0]++;
    }

    private boolean fallbackCheckAndRecord(String key, int max, int windowSeconds) {
        long[] d = getFallback(key, windowSeconds);
        d[0]++;
        return d[0] <= max;
    }

    private long[] getFallback(String key, int windowSeconds) {
        long now = System.currentTimeMillis();
        long[] d = memFallback.computeIfAbsent(key, k -> new long[]{0L, now});
        if (now - d[1] > windowSeconds * 1000L) {
            d[0] = 0L;
            d[1] = now;
        }
        return d;
    }
}
