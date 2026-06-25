package com.hotspotpay.router.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestClientException;

import java.util.function.Supplier;

/**
 * Helper utilitaire pour ajouter du retry (3 tentatives avec backoff exponentiel)
 * aux appels vers le microservice FastAPI.
 * <p>
 * Utilisation dans chaque méthode FastApi*Client :
 * <pre>
 *     return FastApiRetryHelper.retry("nomOperation", () -> restClient.get()...body(JsonNode.class));
 * </pre>
 */
@Slf4j(topic = "FastApiRetry")
public final class FastApiRetryHelper {

    private FastApiRetryHelper() {}

    /**
     * Exécute l'appel FastAPI avec 3 tentatives et backoff exponentiel (1s, 2s).
     *
     * @param operationName nom lisible pour les logs (ex: "createHotspot")
     * @param call          lambda contenant l'appel RestClient
     * @param <T>           type de retour
     * @return le résultat de l'appel, ou null si toutes les tentatives ont échoué
     */
    public static <T> T retry(String operationName, Supplier<T> call) {
        Exception lastEx = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                return call.get();
            } catch (RestClientException e) {
                lastEx = e;
                if (attempt < 3) {
                    log.warn("FastAPI {} (attempt {}/3) failed: {}", operationName, attempt, e.getMessage());
                    try {
                        Thread.sleep(1000L * attempt); // 1s puis 2s
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        log.error("FastAPI {} failed after 3 attempts: {}", operationName,
                lastEx != null ? lastEx.getMessage() : "unknown");
        return null;
    }

    /**
     * Version pour les méthodes retournant boolean (delete, revoke).
     * Retourne false uniquement après 3 échecs.
     */
    public static boolean retryBool(String operationName, Supplier<Boolean> call) {
        Exception lastEx = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                boolean result = call.get();
                if (result) return true;
            } catch (RestClientException e) {
                lastEx = e;
                if (attempt < 3) {
                    log.warn("FastAPI {} (attempt {}/3) failed: {}", operationName, attempt, e.getMessage());
                    try {
                        Thread.sleep(1000L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        log.error("FastAPI {} failed after 3 attempts: {}", operationName,
                lastEx != null ? lastEx.getMessage() : "unknown");
        return false;
    }

    /**
     * Méthode utilitaire pour faire une pause avec gestion d'interruption.
     */
    public static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
