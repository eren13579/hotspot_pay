-- ============================================================
-- V36 : Ajout des colonnes TOTP pour l'authentification 2FA
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS totp_secret   VARCHAR(64)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS totp_enabled  BOOLEAN        DEFAULT FALSE;
