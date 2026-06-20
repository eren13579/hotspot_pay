-- V13__add_webhook_events_table.sql
-- Table pour l'idempotence des webhooks (évite le double traitement)
-- Campay et Moneroo peuvent envoyer le même webhook plusieurs fois

CREATE TABLE IF NOT EXISTS webhook_events (
    id                BIGSERIAL    NOT NULL,
    event_id          VARCHAR(255) NOT NULL,   -- ID unique de l'événement (idempotence)
    gateway           VARCHAR(50)  NOT NULL,   -- CAMPAY, MONEROO, MTN_MOMO, ORANGE_MONEY
    payment_reference VARCHAR(255),            -- Notre référence interne
    gateway_tx_id     VARCHAR(255),            -- Référence de la gateway
    status            VARCHAR(20)  NOT NULL,   -- SUCCESSFUL, FAILED
    processed         BOOLEAN      NOT NULL DEFAULT FALSE,
    payload           TEXT,                    -- Corps JSON brut du webhook
    processed_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    error_message     VARCHAR(500),            -- Erreur si traitement échoué

    CONSTRAINT pk_webhook_events    PRIMARY KEY (id),
    CONSTRAINT uq_webhook_event_id  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_gateway   ON webhook_events (gateway, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_ref       ON webhook_events (payment_reference);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_events (processed);

COMMENT ON TABLE webhook_events IS 'Log des événements webhook reçus des opérateurs de paiement (idempotence)';
