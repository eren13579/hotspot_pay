-- ═══════════════════════════════════════════════════════
-- V38 : Suppression de l'ancienne colonne `name`
--       (remplacée par `full_name`)
-- ═══════════════════════════════════════════════════════

ALTER TABLE contact_messages
    DROP COLUMN IF EXISTS name;

ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);

COMMENT ON COLUMN contact_messages.full_name IS 'Nom complet de l''expéditeur (a remplacé name)';
