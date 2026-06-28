package com.hotspotpay.auth.service.impl;

import com.hotspotpay.auth.dto.*;
import com.hotspotpay.auth.model.PasswordResetToken;
import com.hotspotpay.auth.repository.PasswordResetTokenRepository;
import com.hotspotpay.auth.service.AuthService;
import com.hotspotpay.auth.service.JwtService;
import com.hotspotpay.auth.service.RefreshTokenService;
import com.hotspotpay.auth.service.TwoFactorService;
import com.hotspotpay.notification.service.EmailService;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.hotspotpay.users.role.UserRole;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import com.hotspotpay.auth.service.GoogleOAuth2Service;
import com.hotspotpay.auth.service.GoogleOAuth2Service.GoogleUserInfo;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService        emailService;
    private final GoogleOAuth2Service googleOAuth2Service;
    private final TwoFactorService twoFactorService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.base-url:http://localhost:8080/api/V1}")
    private String baseUrl;

    /** Regex : min 8 chars, au moins 1 chiffre */
    private static final String PASSWORD_PATTERN = "^(?=.*\\d).{8,}$";

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("Cet email est déjà utilisé");
        }
        // Validation force du mot de passe
        if (request.getPassword() != null && !request.getPassword().matches(PASSWORD_PATTERN)) {
            throw AppException.badRequest(
                    "Le mot de passe doit contenir au moins 8 caractères et 1 chiffre");
        }
        // Vérification doublon téléphone seulement si fourni
        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone())) {
            throw AppException.conflict("Ce numéro de téléphone est déjà utilisé");
        }
        User newUser = convertToDto(request);
        userRepository.save(newUser);
        log.info("New user registered: userId={}, email={}", newUser.getUserId(), newUser.getEmail());
        emailService.sendWelcome(newUser.getEmail(), newUser.getFullName());

        // Envoyer un email de vérification
        try {
            String verifyToken = jwtService.generateEmailVerificationToken(newUser.getEmail());
            String verifyLink = baseUrl.replace("/api/V1", "") + "/verify-email?token=" + verifyToken;
            emailService.sendEmailVerification(newUser.getEmail(), newUser.getFullName(), verifyLink);
        } catch (Exception e) {
            log.warn("Impossible d'envoyer l'email de vérification à {}: {}", newUser.getEmail(), e.getMessage());
        }

        return buildAuthResponse(newUser);
    }

    private User convertToDto(RegisterRequest request) {
        return User.builder()
                .id(UUID.randomUUID())
                .userId(UUID.randomUUID().toString())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .isActive(true)
                .build();
    }

    @Override
    @Transactional()
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> AppException.unauthorized("Email ou mot de passe incorrect"));

        if (!user.getIsActive()) {
            throw AppException.forbidden("Compte désactivé — contactez le support");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Failed login attempt for email={}", request.getEmail());
            throw AppException.unauthorized("Email ou mot de passe incorrect");
        }

        log.info("User logged in: userId={}", user.getUserId());

        // ── Vérification 2FA : si activée, retourner un token temporaire ──
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            String twoFactorToken = jwtService.generateTwoFactorToken(user);
            log.info("2FA requise pour userId={}", user.getUserId());
            return AuthResponse.builder()
                    .requiresTwoFactor(true)
                    .tempToken(twoFactorToken)
                    .userId(user.getUserId())
                    .role(user.getRole().name())
                    .planType(user.getPlanType())
                    .tokenType("Bearer")
                    .expiresIn(300_000L) // 5 minutes pour le token 2FA
                    .build();
        }

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw AppException.unauthorized("Refresh token manquant");
        }

        String userId = refreshTokenService.validate(refreshToken);
        if (userId == null) {
            throw AppException.unauthorized("Refresh token invalide ou expiré");
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    // Token valide mais utilisateur supprimé → invalider le token
                    refreshTokenService.invalidate(refreshToken);
                    return AppException.unauthorized("Utilisateur introuvable");
                });

        if (!user.getIsActive()) {
            refreshTokenService.invalidate(refreshToken);
            throw AppException.forbidden("Compte désactivé");
        }

        // Rotation : invalide l'ancien token, génère un nouveau
        String newRefreshToken = refreshTokenService.rotate(refreshToken, userId);
        String newAccessToken = jwtService.generateAccessToken(user);

        log.debug("Token refreshed for userId={}", userId);
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtService.getAccessExpiration())
                .tokenType("Bearer")
                .userId(user.getUserId())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public void updatePassword(PasswordUpdateRequest request) {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw AppException.badRequest("Ancien mot de passe incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password updated for userId={}", userId);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.invalidate(refreshToken);
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        // 1. Valider le token Google et extraire les infos
        GoogleUserInfo googleUser = googleOAuth2Service.verifyIdToken(idToken);

        // 2. Chercher un utilisateur existant par email
        User user = userRepository.findByEmail(googleUser.getEmail())
                .orElseGet(() -> createUserFromGoogle(googleUser));

        // 3. Mettre à jour le nom si changé (Google peut avoir un nom plus récent)
        if (googleUser.getName() != null && !googleUser.getName().equals(user.getFullName())) {
            user.setFullName(googleUser.getName());
            userRepository.save(user);
        }

        if (!user.getIsActive()) {
            throw AppException.forbidden("Compte désactivé — contactez le support");
        }

        log.info("User logged in via Google: userId={}, email={}", user.getUserId(), user.getEmail());
        return buildAuthResponse(user);
    }

    // ─────────────── Mot de passe oublié ───────────────

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // Ne pas révéler l'existence du compte — retour silencieux si email inconnu ou désactivé
        userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .ifPresent(user -> {

        // Invalider les anciens tokens
        passwordResetTokenRepository.deleteByUserId(user.getUserId());

        // Générer un nouveau token
        String token = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getUserId())
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = baseUrl + "/auth/reset-password?token=" + token;
        emailService.sendPasswordReset(user.getEmail(), user.getFullName(), resetLink);
        log.info("Email de réinitialisation envoyé à {}", user.getEmail());
        });
    }

    // ─────────────── Réinitialisation mot de passe ─────

    @Override
    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> AppException.badRequest("Token invalide ou expiré"));

        if (resetToken.isUsed()) {
            throw AppException.badRequest("Ce token a déjà été utilisé");
        }

        if (resetToken.isExpired()) {
            throw AppException.badRequest("Ce token a expiré — veuillez refaire une demande");
        }

        User user = userRepository.findByUserId(resetToken.getUserId())
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw AppException.forbidden("Ce compte est désactivé — contactez le support");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Marquer le token comme utilisé
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Mot de passe réinitialisé pour userId={}", user.getUserId());
        return buildAuthResponse(user);
    }

    // ─────────────── Vérification email ─────────────────

    @Override
    @Transactional
    public void verifyEmail(String token) {
        if (!jwtService.isEmailVerificationToken(token)) {
            throw AppException.badRequest("Token de vérification invalide ou expiré");
        }

        String email = jwtService.extractEmailFromToken(token);
        if (email == null || email.isBlank()) {
            throw AppException.badRequest("Token invalide");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));

        user.setEmailVerified(true);
        userRepository.save(user);
        log.info("Email vérifié pour userId={}, email={}", user.getUserId(), email);
    }

    /**
     * Crée un nouveau compte utilisateur à partir des infos Google.
     * Le mot de passe est un hash aléatoire (impossible de se connecter
     * avec un mot de passe classique — seul Google OAuth2 fonctionnera).
     */
    private User createUserFromGoogle(GoogleUserInfo googleUser) {
        User newUser = User.builder()
                .id(UUID.randomUUID())
                .userId(UUID.randomUUID().toString())
                .email(googleUser.getEmail())
                .fullName(googleUser.getName())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(com.hotspotpay.users.role.UserRole.USER)
                .isActive(true)
                .build();
        userRepository.save(newUser);
        log.info("New user created via Google: userId={}, email={}", newUser.getUserId(), newUser.getEmail());
        emailService.sendWelcome(newUser.getEmail(), newUser.getFullName());
        return newUser;
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        refreshTokenService.store(refreshToken, user.getUserId());

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
