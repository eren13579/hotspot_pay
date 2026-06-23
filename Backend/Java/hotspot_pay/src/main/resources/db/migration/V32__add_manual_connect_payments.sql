ALTER TABLE payments
    ADD COLUMN manual_connect BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN manual_username VARCHAR(100),
    ADD COLUMN manual_password VARCHAR(100);

COMMENT ON COLUMN payments.manual_connect IS 'True si le hotspot owner a désactivé l''auto-connect — le client doit entrer ses identifiants manuellement';
COMMENT ON COLUMN payments.manual_username IS 'Nom d''utilisateur WiFi généré pour connexion manuelle';
COMMENT ON COLUMN payments.manual_password IS 'Mot de passe WiFi généré pour connexion manuelle';
