package com.hotspotpay.auth.controller;

import com.hotspotpay.auth.dto.*;
import com.hotspotpay.auth.service.TwoFactorService;
import com.hotspotpay.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "2FA", description = "Authentification à deux facteurs (TOTP)")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;

    @GetMapping("/auth/2fa/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Statut de la 2FA pour l'utilisateur connecté")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status(
            @AuthenticationPrincipal String userId) {
        boolean enabled = twoFactorService.isEnabled(userId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "enabled", enabled,
                "method", "totp"
        )));
    }

    @PostMapping("/auth/2fa/setup")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Générer un secret TOTP et l'URL du QR code")
    public ResponseEntity<ApiResponse<TwoFactorSetupResponse>> setup(
            @AuthenticationPrincipal String userId) {
        TwoFactorSetupResponse setup = twoFactorService.setup(userId);
        return ResponseEntity.ok(ApiResponse.ok("Scannez le QR code avec Google Authenticator", setup));
    }

    @PostMapping("/auth/2fa/enable")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Activer la 2FA après validation du premier code TOTP")
    public ResponseEntity<ApiResponse<Void>> enable(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody TwoFactorCodeRequest request) {
        // Le frontend envoie { secret, totpCode } — on utilise le code + le secret fourni
        twoFactorService.enable(userId, request.getCode(), request.getSecret());
        return ResponseEntity.ok(ApiResponse.ok("2FA activée avec succès"));
    }

    @PostMapping("/auth/2fa/disable")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Désactiver la 2FA (mot de passe requis)")
    public ResponseEntity<ApiResponse<Void>> disable(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody DisableTwoFactorRequest request) {
        twoFactorService.disable(userId, request.getPassword());
        return ResponseEntity.ok(ApiResponse.ok("2FA désactivée avec succès"));
    }

    @PostMapping("/auth/2fa/authenticate")
    @Operation(summary = "Valider le code TOTP après login (token temporaire requis)")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticate(
            @Valid @RequestBody TwoFactorAuthenticateRequest request) {
        AuthResponse response = twoFactorService.authenticateTwoFactor(
                request.getTempToken(), request.getTotpCode());
        return ResponseEntity.ok(ApiResponse.ok("Authentification 2FA réussie", response));
    }
}
