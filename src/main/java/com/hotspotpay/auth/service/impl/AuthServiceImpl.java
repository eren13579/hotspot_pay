package com.hotspotpay.auth.service.impl;

import com.hotspotpay.auth.dto.AuthResponse;
import com.hotspotpay.auth.dto.LoginRequest;
import com.hotspotpay.auth.dto.PasswordUpdateRequest;
import com.hotspotpay.auth.dto.RegisterRequest;
import com.hotspotpay.auth.service.AuthService;
import com.hotspotpay.auth.service.JwtService;
import com.hotspotpay.auth.service.RefreshTokenService;
import com.hotspotpay.notification.service.EmailService;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.hotspotpay.users.role.UserRole;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
        User newUser = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> AppException.unauthorized("Email ou mot de passe incorrect"));

        if (!newUser.getIsActive()) {
            throw AppException.forbidden("Compte désactivé — contactez le support");
        }

        if (!passwordEncoder.matches(request.getPassword(), newUser.getPassword())) {
            log.warn("Failed login attempt for email={}", request.getEmail());
            throw AppException.unauthorized("Email ou mot de passe incorrect");
        }

        log.info("User logged in: userId={}", newUser.getUserId());
        return buildAuthResponse(newUser);
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
