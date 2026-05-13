package hotspotpay.com.mvp.auth.service;

import hotspotpay.com.mvp.auth.dto.AuthResponse;
import hotspotpay.com.mvp.auth.dto.LoginRequest;
import hotspotpay.com.mvp.auth.dto.PasswordUpdateRequest;
import hotspotpay.com.mvp.auth.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void updatePassword(PasswordUpdateRequest request);
    void logout(String refreshToken);
}
