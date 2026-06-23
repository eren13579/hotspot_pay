-- ═══════════════════════════════════════════════════════
-- V33 : Rattrapage colonnes manquantes sur les tables
-- contact_messages et faqs créées lors de la session
-- du 22 juin avec un schéma différent
-- ═══════════════════════════════════════════════════════

-- Contact messages : ajouter admin_reply si manquant
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS admin_reply TEXT;

-- Faqs : ajouter les colonnes si la table existe déjà (schéma partiel)
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS category   VARCHAR(100);
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS sort_order INTEGER  NOT NULL DEFAULT 0;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_active  BOOLEAN  NOT NULL DEFAULT TRUE;
