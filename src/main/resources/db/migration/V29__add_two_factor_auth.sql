-- Ajout des colonnes pour l'authentification à deux facteurs (TOTP)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS two_factor_secret   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS two_factor_enabled  BOOLEAN NOT NULL DEFAULT FALSE;
