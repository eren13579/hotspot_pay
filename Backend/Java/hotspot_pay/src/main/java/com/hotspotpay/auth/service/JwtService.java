package com.hotspotpay.auth.service;

import com.hotspotpay.users.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiration-ms}") long accessExpirationMs,
            @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(User user) {
        return Jwts.builder()
                .subject(user.getUserId())
                .claim("role", user.getRole().name())
                .claim("type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpirationMs))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .subject(user.getUserId())
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        return "access".equals(getClaims(token).get("type", String.class));
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(getClaims(token).get("type", String.class));
    }

    public String extractUserId(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public long getAccessExpiration() {
        return accessExpirationMs;
    }

    /**
     * Génère un token temporaire pour la validation 2FA (5 minutes).
     */
    public String generateTwoFactorToken(User user) {
        return Jwts.builder()
                .subject(user.getUserId())
                .claim("role", user.getRole().name())
                .claim("type", "2fa")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 300_000)) // 5 minutes
                .signWith(key)
                .compact();
    }

    /**
     * Vérifie que le token est bien un token 2FA temporaire (type="2fa").
     */
    public boolean isTwoFactorToken(String token) {
        try {
            Claims claims = getClaims(token);
            return "2fa".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Génère un token de vérification d'email (24h).
     */
    public String generateEmailVerificationToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("type", "verify_email")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 86_400_000)) // 24h
                .signWith(key)
                .compact();
    }

    /**
     * Vérifie que le token est un token de vérification d'email (type="verify_email").
     */
    public boolean isEmailVerificationToken(String token) {
        try {
            Claims claims = getClaims(token);
            return "verify_email".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extrait l'email depuis un token, sans vérifier le type.
     * Utilisé après vérification du type dans isEmailVerificationToken().
     */
    public String extractEmailFromToken(String token) {
        try {
            return getClaims(token).getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}