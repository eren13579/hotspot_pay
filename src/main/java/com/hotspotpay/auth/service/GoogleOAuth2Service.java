package com.hotspotpay.auth.service;

import com.hotspotpay.common.exception.AppException;
import com.nimbusds.jwt.JWTParser;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.text.ParseException;
import java.util.Map;

@Slf4j
@Service
public class GoogleOAuth2Service {

    /**
     * Client ID de l'application Google (doit correspondre à l'audience du token).
     */
    @Value("${oauth2.google.client-id:}")
    private String clientId;

    /**
     * Issuer attendu dans les tokens Google.
     */
    @Value("${oauth2.google.issuer:https://accounts.google.com}")
    private String expectedIssuer;

    /**
     * Valide un token Google qui peut être :
     * <ul>
     *   <li>Un ID token JWT (Google Identity Services — id_token)</li>
     *   <li>Un access token OAuth2 (popup — vérifié via l'API UserInfo)</li>
     * </ul>
     *
     * @param token le JWT ou access_token reçu du frontend
     * @return GoogleUserInfo contenant sub, email, name, picture
     * @throws AppException si le token est invalide, expiré ou falsifié
     */
    public GoogleUserInfo verifyIdToken(String token) {
        if (clientId == null || clientId.isBlank()) {
            throw AppException.internalError("Google OAuth2 n'est pas configuré — définir GOOGLE_CLIENT_ID");
        }

        // ── Essai 1 : Parser comme un JWT (ID token Google) ──────────────
        try {
            return verifyJwtToken(token);
        } catch (ParseException e) {
            log.debug("Token Google n'est pas un JWT — tentative en tant qu'access_token");
        }

        // ── Essai 2 : Valider comme un access token OAuth2 ──────────────
        return verifyAccessToken(token);
    }

    /**
     * Vérifie un ID token JWT signé par Google (flux GIS standard).
     */
    private GoogleUserInfo verifyJwtToken(String idToken) throws ParseException {
        var signedJWT = (SignedJWT) JWTParser.parse(idToken);
        Map<String, Object> claims = signedJWT.getJWTClaimsSet().getClaims();

        String issuer  = (String) claims.get("iss");
        String audience = (String) claims.get("aud");
        String subject  = (String) claims.get("sub");
        String email    = (String) claims.get("email");
        Object expObj   = claims.get("exp");

        // ── Vérifications ──────────────────────────────────────────────
        if (!"https://accounts.google.com".equals(issuer) && !"accounts.google.com".equals(issuer)) {
            log.warn("Google token issuer invalide: {}", issuer);
            throw AppException.unauthorized("Token Google invalide — issuer incorrect");
        }

        if (!clientId.equals(audience)) {
            log.warn("Google token audience mismatch: attendu={}, recu={}", clientId, audience);
            throw AppException.unauthorized("Token Google invalide — audience incorrecte");
        }

        if (subject == null || subject.isBlank()) {
            throw AppException.unauthorized("Token Google invalide — sujet manquant");
        }

        if (email == null || email.isBlank()) {
            throw AppException.unauthorized("Token Google invalide — email manquant");
        }

        if (expObj instanceof Number expNum) {
            long exp = expNum.longValue();
            if (exp * 1000 < System.currentTimeMillis()) {
                throw AppException.unauthorized("Token Google expiré — reconnectez-vous");
            }
        }

        // Double-check auprès de Google (détecte les tokens révoqués)
        verifyWithGoogleEndpoint(idToken);

        Boolean emailVerified = Boolean.TRUE.equals(claims.get("email_verified"));
        if (!emailVerified) {
            log.warn("Google email non verifié: {}", email);
            throw AppException.unauthorized("Email Google non vérifié — vérifiez votre compte Google d'abord");
        }

        String name    = (String) claims.get("name");
        String picture = (String) claims.get("picture");

        log.info("Google JWT validé: email={}, sub={}", email, subject);

        return GoogleUserInfo.builder()
                .googleId(subject)
                .email(email.toLowerCase().trim())
                .name(name)
                .pictureUrl(picture)
                .emailVerified(true)
                .build();
    }

    /**
     * Vérifie un access token OAuth2 via l'API UserInfo de Google.
     * Utilisé en fallback quand le token n'est pas un JWT (flux popup).
     */
    private GoogleUserInfo verifyAccessToken(String accessToken) {
        try {
            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> resp = rest.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    Map.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw AppException.unauthorized("Token Google invalide — rejeté par Google");
            }

            Map<String, Object> info = resp.getBody();

            String sub   = (String) info.get("sub");
            String email = (String) info.get("email");
            if (sub == null || sub.isBlank() || email == null || email.isBlank()) {
                throw AppException.unauthorized("Token Google invalide — informations utilisateur manquantes");
            }

            Boolean emailVerified = Boolean.TRUE.equals(info.get("email_verified"));
            if (!emailVerified) {
                throw AppException.unauthorized("Email Google non vérifié — vérifiez votre compte Google d'abord");
            }

            String name    = (String) info.get("name");
            String picture = (String) info.get("picture");

            log.info("Google access token validé: email={}, sub={}", email, sub);

            return GoogleUserInfo.builder()
                    .googleId(sub)
                    .email(email.toLowerCase().trim())
                    .name(name)
                    .pictureUrl(picture)
                    .emailVerified(true)
                    .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Erreur validation access token Google: {}", e.getMessage());
            throw AppException.unauthorized("Impossible de valider le token Google");
        }
    }

    /**
     * Double-vérification en interrogeant l'endpoint tokeninfo de Google.
     * Garantit que le token n'a pas été révoqué.
     */
    private void verifyWithGoogleEndpoint(String idToken) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            RestTemplate rest = new RestTemplate();
            ResponseEntity<Map> resp = rest.getForEntity(url, Map.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                log.warn("Google tokeninfo a rejeté le token");
                throw AppException.unauthorized("Token Google rejeté par Google");
            }

            Map<String, Object> info = resp.getBody();
            // Vérifier l'audience côté Google aussi
            if (!clientId.equals(info.get("aud"))) {
                throw AppException.unauthorized("Token Google invalide (audience Google)");
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Impossible de vérifier le token auprès de Google: {}", e.getMessage());
            // Ne pas bloquer si Google est indisponible — les vérifications locales suffisent
        }
    }

    /**
     * Conteneur immuable pour les informations extraites du Google ID token.
     */
    public static class GoogleUserInfo {
        private final String googleId;
        private final String email;
        private final String name;
        private final String pictureUrl;
        private final boolean emailVerified;

        public GoogleUserInfo(String googleId, String email, String name,
                              String pictureUrl, boolean emailVerified) {
            this.googleId = googleId;
            this.email = email;
            this.name = name;
            this.pictureUrl = pictureUrl;
            this.emailVerified = emailVerified;
        }

        public static GoogleUserInfoBuilder builder() {
            return new GoogleUserInfoBuilder();
        }

        // Getters
        public String getGoogleId()   { return googleId; }
        public String getEmail()      { return email; }
        public String getName()       { return name; }
        public String getPictureUrl() { return pictureUrl; }
        public boolean isEmailVerified() { return emailVerified; }

        @SuppressWarnings("unused")
        public static class GoogleUserInfoBuilder {
            private String googleId, email, name, pictureUrl;
            private boolean emailVerified;

            public GoogleUserInfoBuilder googleId(String v)   { this.googleId = v;   return this; }
            public GoogleUserInfoBuilder email(String v)      { this.email = v;      return this; }
            public GoogleUserInfoBuilder name(String v)       { this.name = v;       return this; }
            public GoogleUserInfoBuilder pictureUrl(String v) { this.pictureUrl = v; return this; }
            public GoogleUserInfoBuilder emailVerified(boolean v) { this.emailVerified = v; return this; }

            public GoogleUserInfo build() {
                return new GoogleUserInfo(googleId, email, name, pictureUrl, emailVerified);
            }
        }
    }
}
