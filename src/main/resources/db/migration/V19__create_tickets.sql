-- V19__create_tickets.sql
-- Tickets WiFi importés depuis MikroTik.
-- Chaque ticket = un accès WiFi prépayé avec username/password déjà générés
-- côté routeur (via /ip hotspot user print).
-- Le client peut saisir lui-même username/password sur la page du portail captif.

CREATE TABLE IF NOT EXISTS tickets
(
    id            UUID           NOT NULL DEFAULT gen_random_uuid(),
    ticket_id     VARCHAR(255)   NOT NULL,
    hotspot_id    VARCHAR(255)   NOT NULL,
    user_id       VARCHAR(255)   NOT NULL,  -- propriétaire (qui a importé)

    -- Credentials MikroTik importés
    username      VARCHAR(255)   NOT NULL,
    password      VARCHAR(255)   NOT NULL,

    -- Informations optionnelles importées depuis MikroTik
    profile       VARCHAR(100)   DEFAULT 'default',
    comment       VARCHAR(500),
    uptime_limit  VARCHAR(50),              -- ex: "2:00:00" (2h)
    data_limit    VARCHAR(50),              -- ex: "500M"

    status        VARCHAR(20)    NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT chk_ticket_status CHECK (
        status IN ('AVAILABLE', 'USED', 'EXPIRED', 'REVOKED')
    ),

    -- Référence vers la session si ce ticket a été utilisé
    session_id    VARCHAR(255),

    -- Client qui a utilisé ce ticket (MAC + téléphone, si connu)
    client_mac    VARCHAR(17),
    client_phone  VARCHAR(20),

    used_at       TIMESTAMP,
    expires_at    TIMESTAMP,

    created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_tickets           PRIMARY KEY (id),
    CONSTRAINT uq_ticket_id         UNIQUE (ticket_id),
    CONSTRAINT uq_ticket_username_hotspot UNIQUE (hotspot_id, username),
    CONSTRAINT fk_tickets_hotspot   FOREIGN KEY (hotspot_id)
        REFERENCES hotspots(hotspot_id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_user      FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_tickets_hotspot_status ON tickets (hotspot_id, status);
CREATE INDEX idx_tickets_hotspot_username ON tickets (hotspot_id, username);
CREATE INDEX idx_tickets_user ON tickets (user_id);

COMMENT ON TABLE tickets IS
    'Tickets WiFi importés depuis MikroTik. '
    'Permettent aux clients de se connecter en saisissant username/password '
    'directement sur le portail captif, sans paiement Mobile Money.';
