-- ═══════════════════════════════════════════════════════
-- V34 : Ajout de toutes les colonnes métier manquantes
-- sur les tables existantes contact_messages et faqs
-- ═══════════════════════════════════════════════════════

-- Contact messages : toutes les colonnes utilisateur
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS name     VARCHAR(150)  NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS email    VARCHAR(255)  NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS subject  VARCHAR(255)  NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS message  TEXT          NOT NULL DEFAULT '';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_reply            TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status   VARCHAR(20)   NOT NULL DEFAULT 'pending';

-- Colonnes d'audit si manquantes
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Supprimer les defaults après ajout (pas de default en production)
ALTER TABLE contact_messages ALTER COLUMN name     DROP DEFAULT;
ALTER TABLE contact_messages ALTER COLUMN email    DROP DEFAULT;
ALTER TABLE contact_messages ALTER COLUMN subject  DROP DEFAULT;
ALTER TABLE contact_messages ALTER COLUMN message  DROP DEFAULT;

-- Contrainte de statut si absente
ALTER TABLE contact_messages DROP CONSTRAINT IF EXISTS chk_contact_msg_status;
ALTER TABLE contact_messages ADD CONSTRAINT chk_contact_msg_status
    CHECK (status IN ('pending', 'read', 'replied', 'closed'));

-- Faqs : toutes les colonnes
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS category   VARCHAR(100);
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS sort_order INTEGER       NOT NULL DEFAULT 0;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_active  BOOLEAN       NOT NULL DEFAULT TRUE;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS question   TEXT          NOT NULL DEFAULT '';
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS answer     TEXT          NOT NULL DEFAULT '';

-- Colonnes d'audit faqs si manquantes
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Supprimer les defaults après ajout
ALTER TABLE faqs ALTER COLUMN question DROP DEFAULT;
ALTER TABLE faqs ALTER COLUMN answer   DROP DEFAULT;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs (is_active, sort_order);
