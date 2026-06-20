-- V16__add_router_token.sql
-- Ajoute le champ router_token à la table hotspots.
-- Ce token est utilisé par le routeur MikroTik pour s'authentifier
-- lors du polling des actions (sans JWT).

ALTER TABLE hotspots
    ADD COLUMN IF NOT EXISTS router_token VARCHAR(255);

-- Index pour la recherche rapide par token (chaque requête routeur vérifie le token)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hotspots_router_token
    ON hotspots (router_token)
    WHERE router_token IS NOT NULL;

COMMENT ON COLUMN hotspots.router_token IS
    'Token d''authentification du routeur MikroTik. '
    'Généré par POST /hotspots/{hotspotId}/generate-token. '
    'Transmis dans le header X-Router-Token ou le query param ?token=';

-- Aussi ajouter PENDING_MIKROTIK dans la contrainte de statut des sessions
-- (état intermédiaire : paiement confirmé mais routeur pas encore exécuté)
ALTER TABLE sessions
    DROP CONSTRAINT IF EXISTS chk_session_status;

ALTER TABLE sessions
    ADD CONSTRAINT chk_session_status CHECK (
        status IN ('PENDING_MIKROTIK', 'ACTIVE', 'EXPIRED', 'REVOKED')
    );

COMMENT ON COLUMN sessions.status IS
    'PENDING_MIKROTIK : paiement confirmé, en attente d''exécution MikroTik | '
    'ACTIVE : session WiFi active | EXPIRED : expirée | REVOKED : révoquée manuellement';
