package com.hotspotpay.auth.service;

import com.hotspotpay.auth.dto.AuthResponse;
import com.hotspotpay.auth.dto.TwoFactorSetupResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorConfig;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.HmacHashFunction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    private static final String ISSUER = "HotspotPay";
    private static final int TOTP_WINDOW = 3; // ±1 step (3 = 1 before + 1 after + current)

    private GoogleAuthenticator authenticator() {
        GoogleAuthenticatorConfig config = new GoogleAuthenticatorConfig.GoogleAuthenticatorConfigBuilder()
                .setHmacHashFunction(HmacHashFunction.HmacSHA1)
                .setWindowSize(TOTP_WINDOW)
                .setCodeDigits(6)
                .setTimeStepSizeInMillis(30000)
                .build();
        return new GoogleAuthenticator(config);
    }

    // ─────────────── Setup ───────────────

    /**
     * Phase 1 : génère un secret TOTP et l'URL du QR code.
     * Stocke le secret temporairement en base (pas encore activé).
     */
    @Transactional
    public TwoFactorSetupResponse setup(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            throw AppException.conflict("La 2FA est déjà activée sur ce compte");
        }

        GoogleAuthenticatorKey key = authenticator().createCredentials();
        String secret = key.getKey();

        // Stocker le secret provisoirement (le frontend l'a aussi)
        user.setTotpSecret(secret);
        userRepository.save(user);

        String qrUrl = buildQrCodeUrl(user.getEmail() != null ? user.getEmail() : user.getUserId(), secret);

        return TwoFactorSetupResponse.builder()
                .secret(secret)
                .qrUri(qrUrl)
                .method("totp")
                .build();
    }

    // ─────────────── Enable ───────────────

    /**
     * Phase 2 : active la 2FA après validation d'un code TOTP.
     * Le secret peut venir du frontend (envoyé par le client) ou de la DB.
     */
    @Transactional
    public void enable(String userId, String code, String secretFromFrontend) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            throw AppException.conflict("La 2FA est déjà activée");
        }

        // Utiliser le secret fourni par le frontend, ou celui stocké en DB
        String secret = secretFromFrontend != null && !secretFromFrontend.isBlank()
                ? secretFromFrontend
                : user.getTotpSecret();

        if (secret == null || secret.isBlank()) {
            throw AppException.badRequest("Aucun secret TOTP disponible. Veuillez d'abord appeler /auth/2fa/setup");
        }

        if (!checkCode(secret, code)) {
            throw AppException.badRequest("Code TOTP invalide. Vérifiez votre application d'authentification");
        }

        // Stocker le secret utilisé et activer
        user.setTotpSecret(secret);
        user.setTotpEnabled(true);
        userRepository.save(user);
        log.info("2FA TOTP activée pour userId={}", userId);
    }

    // ─────────────── Disable ───────────────

    /**
     * Désactive la 2FA après validation du mot de passe.
     */
    @Transactional
    public void disable(String userId, String password) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        if (!Boolean.TRUE.equals(user.getTotpEnabled())) {
            throw AppException.conflict("La 2FA n'est pas activée sur ce compte");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw AppException.badRequest("Mot de passe incorrect");
        }

        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        userRepository.save(user);
        log.info("2FA TOTP désactivée pour userId={}", userId);
    }

    // ─────────────── Status ───────────────

    /**
     * Vérifie si l'utilisateur a la 2FA activée.
     */
    public boolean isEnabled(String userId) {
        return userRepository.findByUserId(userId)
                .map(User::getTotpEnabled)
                .map(Boolean.TRUE::equals)
                .orElse(false);
    }

    // ─────────────── Code validation ───────────────

    /**
     * Valide un code TOTP pour un utilisateur (utilisé lors du login 2FA).
     */
    public boolean validateCode(String userId, String code) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        if (!Boolean.TRUE.equals(user.getTotpEnabled()) || user.getTotpSecret() == null) {
            return false;
        }

        return checkCode(user.getTotpSecret(), code);
    }

    /**
     * Valide un code TOTP contre un secret donné.
     */
    private boolean checkCode(String secret, String code) {
        if (code == null || code.isBlank()) return false;
        if (secret == null || secret.isBlank()) return false;

        try {
            int verificationCode = Integer.parseInt(code.trim());
            return authenticator().authorize(secret, verificationCode);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    // ─────────────── QR URL ───────────────

    /**
     * Construit l'URL otpauth:// pour QR code.
     */
    private String buildQrCodeUrl(String accountName, String secret) {
        try {
            String encodedName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);
            String encodedIssuer = URLEncoder.encode(ISSUER, StandardCharsets.UTF_8);
            return String.format(
                    "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                    encodedIssuer, encodedName, secret, encodedIssuer
            );
        } catch (Exception e) {
            log.error("Erreur lors de la construction de l'URL QR", e);
            return "";
        }
    }

    // ─────────────── Login 2FA ───────────────

    /**
     * Authentifie avec un twoFactorToken + code TOTP.
     * Retourne un AuthResponse complet (access + refresh tokens).
     */
    public AuthResponse authenticateTwoFactor(String twoFactorToken, String code) {
        if (!jwtService.isTwoFactorToken(twoFactorToken)) {
            throw AppException.unauthorized("Token 2FA invalide ou expiré");
        }

        String userId = jwtService.extractUserId(twoFactorToken);

        if (!validateCode(userId, code)) {
            throw AppException.unauthorized("Code TOTP invalide");
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.unauthorized("Utilisateur introuvable"));

        if (!user.getIsActive()) {
            throw AppException.forbidden("Compte désactivé — contactez le support");
        }

        return buildFullAuthResponse(user);
    }

    /**
     * Construit une AuthResponse complète avec access + refresh tokens.
     */
    private AuthResponse buildFullAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtService.getAccessExpiration())
                .tokenType("Bearer")
                .userId(user.getUserId())
                .role(user.getRole().name())
                .planType(user.getPlanType())
                .build();
    }
}
