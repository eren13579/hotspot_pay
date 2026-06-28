package com.hotspotpay.systemsettings.service;

import com.hotspotpay.systemsettings.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Supplier;

/**
 * Utilitaire de lecture des paramètres système avec fallback.
 *
 * Chaque valeur est d'abord cherchée dans la table `system_settings` (BD),
 * ce qui permet à l'administrateur de modifier les paramètres depuis l'UI
 * sans redémarrer le serveur ni toucher au code.
 *
 * Si la clé n'existe pas en BD ou si sa valeur est vide, le fallback
 * (propriété Spring / .env) est utilisé.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SettingsReader {

    private final SystemSettingRepository repository;

    /**
     * Lit un paramètre depuis la BD. Si absent ou vide, retourne le fallback.
     *
     * @param key      clé du setting (ex: "payments.moneroo.apiKey")
     * @param fallback valeur de repli (ex: props.getApiKey())
     * @return la valeur BD si présente et non vide, sinon le fallback
     */
    public String get(String key, String fallback) {
        try {
            return repository.findBySettingKey(key)
                    .map(s -> s.getValue())
                    .filter(v -> v != null && !v.isBlank())
                    .orElse(fallback);
        } catch (Exception e) {
            log.warn("Impossible de lire '{}' depuis la BD: {} — fallback", key, e.getMessage());
            return fallback;
        }
    }

    /**
     * Version avec {@code Supplier<String>} pour les cas où le fallback
     * est coûteux à calculer (ex: properties.getBaseUrl()).
     */
    public String get(String key, Supplier<String> fallback) {
        try {
            return repository.findBySettingKey(key)
                    .map(s -> s.getValue())
                    .filter(v -> v != null && !v.isBlank())
                    .orElseGet(fallback);
        } catch (Exception e) {
            log.warn("Impossible de lire '{}' depuis la BD: {} — fallback", key, e.getMessage());
            return fallback.get();
        }
    }

    /**
     * Lit la valeur BD et la découpe par séparateur pour les listes.
     * Utilisé pour les méthodes de paiement, IP autorisées, etc.
     */
    public List<String> getList(String key, String separator, Supplier<List<String>> fallback) {
        try {
            return repository.findBySettingKey(key)
                    .map(s -> s.getValue())
                    .filter(v -> v != null && !v.isBlank())
                    .map(v -> List.of(v.split(separator)))
                    .orElseGet(fallback);
        } catch (Exception e) {
            log.warn("Impossible de lire la liste '{}' depuis la BD: {} — fallback", key, e.getMessage());
            return fallback.get();
        }
    }
}
