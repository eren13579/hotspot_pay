package com.hotspotpay.auth.service;

import com.hotspotpay.common.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implémentation mémoire — active par défaut (profil dev/test).
 *
 * Pour la production, activer le profil "prod" → RefreshTokenRedisService prend le dessus.
 *
 * Note : ne pas utiliser en prod car les tokens sont perdus au redémarrage.
 */
@Slf4j
@Service
@Profile("!prod")
public class RefreshTokenService {

    private final Map<String, String> store = new ConcurrentHashMap<>();

    public void store(String refreshToken, String userId) {
        store.put(refreshToken, userId);
    }

    public String validate(String refreshToken) {
        String userId = store.get(refreshToken);
        if (userId == null) {
            throw AppException.unauthorized("Refresh token invalide ou expiré");
        }
        return userId;
    }

    public void invalidate(String refreshToken) {
        store.remove(refreshToken);
    }

    public String rotate(String oldToken, String userId) {
        invalidate(oldToken);
        String newToken = UUID.randomUUID().toString();
        store.put(newToken, userId);
        return newToken;
    }
}
