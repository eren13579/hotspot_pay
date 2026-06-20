package com.hotspotpay.auth.controller;

import com.hotspotpay.auth.dto.*;
import com.hotspotpay.auth.service.AuthService;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.router.service.FastApiSubscriptionClient;
import com.hotspotpay.users.dto.UserProfileResponse;
import com.hotspotpay.users.dto.UserResponse;
import com.hotspotpay.users.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Inscription, connexion, tokens")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final FastApiSubscriptionClient subscriptionClient;

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouveau propriétaire")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Inscription réussie", authService.register(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion et obtention des tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Connexion réussie", authService.login(request)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renouvellement de l'access token via refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestHeader("Refresh-Token") String refreshToken) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refreshToken(refreshToken)));
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Changement de mot de passe (ancien + nouveau requis)")
    public ResponseEntity<ApiResponse<Void>> updatePassword(
            @Valid @RequestBody PasswordUpdateRequest request) {
        authService.updatePassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Mot de passe mis à jour avec succès"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion et invalidation du refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader("Refresh-Token") String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok("Déconnexion réussie"));
    }

    @PostMapping("/google")
    @Operation(summary = "Connexion via Google OAuth2 — échange un ID token Google contre les JWT HotspotPay")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Connexion Google réussie", authService.loginWithGoogle(request.getIdToken())));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Profil complet de l'utilisateur connecté (infos + abonnement)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal String userId) {
        UserResponse user = userService.getMe();
        var subscription = subscriptionClient.getCurrent(userId);
        return ResponseEntity.ok(ApiResponse.ok(
                UserProfileResponse.builder().user(user).subscription(subscription).build()));
    }
}