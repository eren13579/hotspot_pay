ALTER TABLE users ADD COLUMN auto_connect BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN users.auto_connect IS 'Si true, le client est automatiquement connecté au WiFi après paiement sans saisie manuelle des identifiants';
