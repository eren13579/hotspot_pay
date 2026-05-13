package hotspotpay.com.mvp.auth.service.impl;

import hotspotpay.com.mvp.auth.dto.AuthResponse;
import hotspotpay.com.mvp.auth.dto.LoginRequest;
import hotspotpay.com.mvp.auth.dto.PasswordUpdateRequest;
import hotspotpay.com.mvp.auth.dto.RegisterRequest;
import hotspotpay.com.mvp.auth.service.AuthService;
import hotspotpay.com.mvp.auth.service.JwtService;
import hotspotpay.com.mvp.auth.service.RefreshTokenService;
import hotspotpay.com.mvp.common.exception.AppException;
import hotspotpay.com.mvp.users.model.User;
import hotspotpay.com.mvp.users.repository.UserRepository;
import hotspotpay.com.mvp.users.role.UserRole;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("Cet email est déjà utilisé");
        }
        // Vérification doublon téléphone
        if (userRepository.existsByPhone(request.getPhone())) {
            throw AppException.conflict("Ce numéro de téléphone est déjà utilisé");
        }
        User newUser = convertToDto(request);
        userRepository.save(newUser);
        log.info("New user registered: userId={}, email={}", newUser.getUserId(), newUser.getEmail());

        String accessToken = jwtService.generateAccessToken(newUser);
        String refreshToken = jwtService.generateRefreshToken(newUser);
        return buildAuthResponse(newUser);
    }

    private User convertToDto(RegisterRequest request) {
        return User.builder()
                .id(UUID.randomUUID())
                .userId(UUID.randomUUID().toString())
                .email(request.getEmail().toLowerCase().trim())
                .phone(request.getPhone().trim())
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
        String userId = refreshTokenService.validate(refreshToken);

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.unauthorized("Utilisateur introuvable"));

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
                .build();
    }
}
