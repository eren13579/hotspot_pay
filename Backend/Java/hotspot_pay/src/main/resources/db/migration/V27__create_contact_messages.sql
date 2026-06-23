CREATE TABLE IF NOT EXISTS contact_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           VARCHAR(150)  NOT NULL,
    email               VARCHAR(255)  NOT NULL,
    phone               VARCHAR(30)   NOT NULL,
    message             TEXT,
    is_read             BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP     NOT NULL DEFAULT now()
);

COMMENT ON TABLE  contact_messages            IS 'Messages du formulaire de contact (landing page)';
COMMENT ON COLUMN contact_messages.full_name  IS 'Nom complet de l''expéditeur';
COMMENT ON COLUMN contact_messages.email      IS 'Email de contact';
COMMENT ON COLUMN contact_messages.phone      IS 'Numéro de téléphone';
COMMENT ON COLUMN contact_messages.message    IS 'Message optionnel';
COMMENT ON COLUMN contact_messages.is_read    IS 'Lu par un admin ?';
