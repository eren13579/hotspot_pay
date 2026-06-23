package com.hotspotpay.router.service;

import com.hotspotpay.router.dto.RouterActionPayload;
import com.hotspotpay.router.enumeration.RouterActionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service de gestion des actions routeur MikroTik.
 *
 * ANCIENNEMENT : créait des RouterAction en DB Java, le routeur pullait.
 * MAINTENANT : appelle FastAPI qui enqueue l'action pour le Long Polling.
 *
 * FastAPI gère :
 * - La file d'attente des actions (Redis)
 * - Le Long Polling avec le routeur MikroTik
 * - La réception de l'ACK du routeur
 * - Le callback Java pour mise à jour du statut de session
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RouterActionService {

    private final FastApiTicketClient fastApiTicketClient;
    private final FastApiRouterActionClient fastApiRouterActionClient;

    /**
     * Crée une action pour le routeur MikroTik via FastAPI.
     *
     * Utilise /api/v1/router/actions/create pour TOUS les types d'action
     * (CREATE_USER, REMOVE_USER, KICK_SESSION).
     *
     * @param hotspotId    ID du hotspot
     * @param actionType   Type d'action
     * @param payload      Données de l'action
     * @param sessionId    ID de session Java (pour callback)
     * @return l'action_id FastAPI (ou null si échec)
     */
    public String createAction(String hotspotId, RouterActionType actionType,
                                RouterActionPayload payload, String sessionId) {

        log.info("Création action {} pour hotspot={} user={}",
                 actionType, hotspotId, payload.getUsername());

        String actionId = fastApiRouterActionClient.createAction(
                hotspotId, actionType, payload, sessionId);

        if (actionId != null) {
            log.info("Action {} envoyée à FastAPI: hotspot={} user={} actionId={}",
                    actionType, hotspotId, payload.getUsername(), actionId);
            return actionId;
        }

        log.warn("Échec création action {} pour hotspot={} user={}",
                 actionType, hotspotId, payload.getUsername());
        return null;
    }
}
