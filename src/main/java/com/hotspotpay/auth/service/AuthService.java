package com.hotspotpay.auth.service;

import com.hotspotpay.auth.dto.AuthResponse;
import com.hotspotpay.auth.dto.LoginRequest;
import com.hotspotpay.auth.dto.PasswordUpdateRequest;
import com.hotspotpay.auth.dto.RegisterRequest;

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
}
