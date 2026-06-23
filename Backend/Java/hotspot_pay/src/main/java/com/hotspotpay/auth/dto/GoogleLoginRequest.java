package com.hotspotpay.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de connexion via Google OAuth2.
 *
 * Le frontend utilise la librairie Google Identity Services (GIS) pour obtenir
 * un ID token JWT, puis l'envoie ici pour vérification côté serveur.
 *
 * Flux :
 * 1. Clic "Se connecter avec Google" → popup Google
 * 2. Google renvoie { credential: "<JWT>" }
 * 3. Frontend POST /auth/google { idToken: "<JWT>" }
 * 4. Serveur vérifie le JWT auprès de Google (signature, audience, expiration)
 * 5. Si nouveau utilisateur → création automatique du compte
 * 6. Retourne { accessToken, refreshToken } comme un login normal
 */
@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Le token Google est obligatoire")
    private String idToken;
}
