-- V15__create_router_actions.sql
-- Architecture Pull : le routeur MikroTik poll le serveur pour récupérer les actions
-- au lieu que le serveur essaie de se connecter au routeur (inaccessible derrière NAT)

CREATE TABLE IF NOT EXISTS router_actions
(
    id            UUID           NOT NULL DEFAULT gen_random_uuid(),
    action_id     VARCHAR(255)   NOT NULL,
    hotspot_id    VARCHAR(255)   NOT NULL,

    -- Type d'action à exécuter sur le routeur
    action_type   VARCHAR(50)    NOT NULL,
    -- CONSTRAINT : valeurs autorisées
    CONSTRAINT chk_action_type CHECK (
        action_type IN ('CREATE_USER', 'REMOVE_USER', 'KICK_SESSION')
    ),

    -- Payload JSON : username, password, macAddress, durationMinutes, hotspotProfile
    payload       TEXT           NOT NULL,

    -- Statut du cycle de vie de l'action
    status        VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    CONSTRAINT chk_action_status CHECK (
        status IN ('PENDING', 'SENT', 'COMPLETED', 'FAILED')
    ),

    -- Référence vers la session (optionnel, pour traçabilité)
    session_id    VARCHAR(255),

    -- Nombre de tentatives (max 3 — au-delà, on abandonne)
    retry_count   INTEGER        NOT NULL DEFAULT 0,

    -- Message d'erreur si FAILED
    error_message TEXT,

    created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMP,

    CONSTRAINT pk_router_actions        PRIMARY KEY (id),
    CONSTRAINT uq_router_actions_id     UNIQUE (action_id),
    CONSTRAINT fk_router_actions_hotspot
        FOREIGN KEY (hotspot_id)
        REFERENCES hotspots(hotspot_id)
        ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED
);

-- Index principal : récupérer les actions PENDING d'un hotspot (polling toutes les 10s)
CREATE INDEX idx_router_actions_hotspot_status
    ON router_actions (hotspot_id, status);

-- Index pour le scheduler de retry (actions FAILED récupérables)
CREATE INDEX idx_router_actions_status_retry
    ON router_actions (status, retry_count)
    WHERE status = 'FAILED' AND retry_count < 3;

-- Index temporel pour le nettoyage des vieilles actions
CREATE INDEX idx_router_actions_created_at
    ON router_actions (created_at);

COMMENT ON TABLE router_actions IS
    'Actions à exécuter sur les routeurs MikroTik via architecture Pull. '
    'Le routeur poll GET /router/{hotspotId}/pending-actions toutes les 10s.';

COMMENT ON COLUMN router_actions.payload IS
    'JSON : { "username": "hp_abc", "password": "xyz", "macAddress": "AA:BB:CC:DD:EE:FF", '
    '"durationMinutes": 60, "hotspotProfile": "default" }';
