-- ═══════════════════════════════════════════════════════
-- V33 : Enhancement des messages de contact (tickets support)
-- Ajoute le statut, la réponse admin et le suivi
-- ═══════════════════════════════════════════════════════

ALTER TABLE contact_messages
    ADD COLUMN status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    ADD COLUMN admin_reply  TEXT,
    ADD COLUMN handled_by   UUID         REFERENCES users(user_id),
    ADD COLUMN updated_at   TIMESTAMP;

COMMENT ON COLUMN contact_messages.status      IS 'Statut du ticket : OPEN, IN_PROGRESS, RESOLVED, CLOSED';
COMMENT ON COLUMN contact_messages.admin_reply IS 'Réponse de l''administrateur';
COMMENT ON COLUMN contact_messages.handled_by  IS 'ID de l''admin qui a traité le ticket';
COMMENT ON COLUMN contact_messages.updated_at  IS 'Date de dernière modification';

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_updated_at ON contact_messages (updated_at);

-- Mettre à jour updated_at pour les messages existants
UPDATE contact_messages SET updated_at = created_at WHERE updated_at IS NULL;
