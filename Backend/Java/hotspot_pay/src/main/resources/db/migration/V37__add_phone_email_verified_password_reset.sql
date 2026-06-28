-- ═══════════════════════════════════════════════════════
-- V37 : Ajout téléphone aux messages de contact
-- + colonne email_verified sur users
-- + table de tokens pour réinitialisation mot de passe
-- ═══════════════════════════════════════════════════════

-- 1. Ajout du téléphone aux messages de contact
ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL;

-- 2. Ajout du champ email_verified sur users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Table de tokens pour réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_tokens
(
    id          UUID           NOT NULL DEFAULT gen_random_uuid(),
    user_id     VARCHAR(255)   NOT NULL,
    token       VARCHAR(255)   NOT NULL,
    used        BOOLEAN        NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMP      NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens (user_id);

COMMENT ON TABLE  password_reset_tokens IS 'Tokens de réinitialisation de mot de passe (expire après 1h)';
COMMENT ON COLUMN users.email_verified IS 'Flag indiquant si l''email a été vérifié';
COMMENT ON COLUMN contact_messages.phone IS 'Numéro de téléphone de l''expéditeur (page de contact)';
