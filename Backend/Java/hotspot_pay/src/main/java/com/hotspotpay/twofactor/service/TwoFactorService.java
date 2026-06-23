package com.hotspotpay.twofactor.service;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private final UserRepository userRepository;
    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    /**
     * Génère un nouveau secret TOTP pour l'utilisateur.
     * Le secret n'est PAS encore sauvegardé — l'utilisateur doit d'abord
     * confirmer avec un code valide (enable).
     *
     * @return le secret en clair et l'URI du QR code
     */
    public SetupResult generateSecret(User user) {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        String secret = key.getKey();
        String qrUri = GoogleAuthenticatorQRGenerator.getOtpAuthURL(
                "HotspotPay",
                user.getEmail(),
                key
        );
        return new SetupResult(secret, qrUri);
    }

    /**
     * Active la 2FA après vérification du code TOTP.
     */
    @Transactional
    public void enable(User user, String secret, int verificationCode) {
        if (user.isTwoFactorEnabled()) {
            throw AppException.badRequest("La 2FA est déjà activée");
        }
        if (!gAuth.authorize(secret, verificationCode)) {
            throw AppException.badRequest("Code invalide. Vérifiez que l'application est correctement configurée");
        }
        user.setTwoFactorSecret(secret);
        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        log.info("2FA activée pour userId={}", user.getUserId());
    }

    /**
     * Désactive la 2FA.
     */
    @Transactional
    public void disable(User user) {
        if (!user.isTwoFactorEnabled()) {
            throw AppException.badRequest("La 2FA n'est pas activée");
        }
        user.setTwoFactorSecret(null);
        user.setTwoFactorEnabled(false);
        userRepository.save(user);
        log.info("2FA désactivée pour userId={}", user.getUserId());
    }

    /**
     * Vérifie un code TOTP pour l'utilisateur.
     */
    public boolean verify(User user, int verificationCode) {
        if (!user.isTwoFactorEnabled() || user.getTwoFactorSecret() == null) {
            return false;
        }
        return gAuth.authorize(user.getTwoFactorSecret(), verificationCode);
    }

    /**
     * Vérifie un code TOTP pour un secret donné (utilisé lors de l'activation).
     */
    public boolean verifyCode(String secret, int verificationCode) {
        return gAuth.authorize(secret, verificationCode);
    }

    // ── DTO interne ──

    public record SetupResult(String secret, String qrUri) {}
}
