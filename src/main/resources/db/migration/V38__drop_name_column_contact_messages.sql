-- ═══════════════════════════════════════════════════════
-- V38 : Suppression de l'ancienne colonne `name`
--       (remplacée par `full_name`)
-- ═══════════════════════════════════════════════════════

ALTER TABLE contact_messages
    DROP COLUMN IF EXISTS name;

COMMENT ON COLUMN contact_messages.full_name IS 'Nom complet de l''expéditeur (a remplacé name)';
