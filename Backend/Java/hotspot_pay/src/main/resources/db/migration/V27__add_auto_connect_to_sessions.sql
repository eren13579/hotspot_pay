-- ═══════════════════════════════════════════════════════
-- V27 : Auto-connect et connexion manuelle
-- ═══════════════════════════════════════════════════════

-- Les hotspots peuvent proposer la connexion automatique (auto-connect)
-- et autoriser la connexion manuelle via username/password
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS auto_connect      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS manual_connect    BOOLEAN NOT NULL DEFAULT TRUE;
