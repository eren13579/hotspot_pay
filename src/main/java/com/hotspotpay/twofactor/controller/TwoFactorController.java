package com.hotspotpay.twofactor.controller;

import com.hotspotpay.auth.dto.AuthResponse;
import com.hotspotpay.auth.service.JwtService;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.twofactor.dto.*;
import com.hotspotpay.twofactor.service.TwoFactorService;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Récupère l'utilisateur connecté depuis le contexte de sécurité.
     */
    private User getAuthenticatedUser() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));
    }

    /**
     * GET /auth/2fa/status — Vérifier si la 2FA est activée
     */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TwoFactorStatusResponse>> status() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.ok(
                TwoFactorStatusResponse.builder().enabled(user.isTwoFactorEnabled()).build()
        ));
    }

    /**
     * POST /auth/2fa/setup — Générer le secret et le QR code
     */
    @PostMapping("/setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Setup2faResponse>> setup() {
        User user = getAuthenticatedUser();
        TwoFactorService.SetupResult result = twoFactorService.generateSecret(user);
        return ResponseEntity.ok(ApiResponse.ok(
                Setup2faResponse.builder()
                        .secret(result.secret())
                        .qrUri(result.qrUri())
                        .build()
        ));
    }

    /**
     * POST /auth/2fa/enable — Activer la 2FA après vérification du code
     */
    @PostMapping("/enable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> enable(@Valid @RequestBody Enable2faRequest request) {
        User user = getAuthenticatedUser();
        twoFactorService.enable(user, request.getSecret(), request.getTotpCode());
        return ResponseEntity.ok(ApiResponse.ok("Authentification à deux facteurs activée"));
    }

    /**
     * POST /auth/2fa/disable — Désactiver la 2FA (mot de passe requis)
     */
    @PostMapping("/disable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> disable(@Valid @RequestBody Disable2faRequest request) {
        User user = getAuthenticatedUser();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw AppException.badRequest("Mot de passe incorrect");
        }
        twoFactorService.disable(user);
        return ResponseEntity.ok(ApiResponse.ok("Authentification à deux facteurs désactivée"));
    }

    /**
     * POST /auth/2fa/authenticate — Deuxième facteur lors de la connexion
     * (public — appelé avec le tempToken obtenu après le login)
     */
    @PostMapping("/authenticate")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticate(
            @Valid @RequestBody Authenticate2faRequest request) {

        // Valider le token temporaire
        if (!jwtService.validateTempToken(request.getTempToken())) {
            throw AppException.unauthorized("Token temporaire invalide ou expiré");
        }

        // Extraire l'utilisateur
        String userId = jwtService.extractUserId(request.getTempToken());
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.unauthorized("Utilisateur introuvable"));

        // Vérifier le code TOTP
        if (!twoFactorService.verify(user, request.getTotpCode())) {
            throw AppException.unauthorized("Code de vérification invalide");
        }

        // Générer les tokens complets
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtService.getAccessExpiration())
                .tokenType("Bearer")
                .userId(user.getUserId())
                .role(user.getRole().name())
                .planType(user.getPlanType())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Authentification réussie", authResponse));
    }
}
