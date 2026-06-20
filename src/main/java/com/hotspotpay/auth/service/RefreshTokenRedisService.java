package com.hotspotpay.auth.service;

import com.hotspotpay.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Implémentation Redis des refresh tokens — active uniquement avec le profil "prod".
 *
 * Activation : spring.profiles.active=prod dans application.properties
 * ou SPRING_PROFILES_ACTIVE=prod en variable d'environnement.
 *
 * Avantages vs mémoire :
 *   - Persistant entre redémarrages
 *   - Partagé entre plusieurs instances (scalabilité)
 *   - Expiration automatique via TTL Redis (7 jours)
 *   - Révocation immédiate (logout)
 */
@Slf4j
@Service
@Primary
@Profile("prod")
@RequiredArgsConstructor
public class RefreshTokenRedisService extends RefreshTokenService {

    private final StringRedisTemplate redis;

    private static final String   PREFIX = "rt:";
    private static final Duration TTL    = Duration.ofDays(7);

    @Override
    public void store(String refreshToken, String userId) {
        redis.opsForValue().set(PREFIX + refreshToken, userId, TTL);
        log.debug("Refresh token stocké Redis userId={}", userId);
    }

    @Override
    public String validate(String refreshToken) {
        String userId = redis.opsForValue().get(PREFIX + refreshToken);
        if (userId == null) {
            throw AppException.unauthorized("Refresh token invalide ou expiré — reconnectez-vous");
        }
        return userId;
    }

    @Override
    public void invalidate(String refreshToken) {
        redis.delete(PREFIX + refreshToken);
    }

    @Override
    public String rotate(String oldToken, String userId) {
        invalidate(oldToken);
        String newToken = UUID.randomUUID().toString();
        store(newToken, userId);
        return newToken;
    }
}
