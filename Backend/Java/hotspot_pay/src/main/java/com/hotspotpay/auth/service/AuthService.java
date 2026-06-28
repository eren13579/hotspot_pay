package com.hotspotpay.auth.service;

import com.hotspotpay.auth.dto.*;

public interface AuthService {

    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void updatePassword(PasswordUpdateRequest request);
    void logout(String refreshToken);

    /**
     * Connexion via Google OAuth2 (ID token).
     * Si l'utilisateur n'existe pas, le compte est créé automatiquement.
     */
    AuthResponse loginWithGoogle(String idToken);

    /** Envoyer un email de réinitialisation de mot de passe */
    void forgotPassword(ForgotPasswordRequest request);

    /** Réinitialiser le mot de passe avec un token */
    AuthResponse resetPassword(ResetPasswordRequest request);

    /** Vérifier l'adresse email */
    void verifyEmail(String token);
}
