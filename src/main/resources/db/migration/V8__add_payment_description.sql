-- V8__add_payment_description.sql
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS description VARCHAR(255);

COMMENT ON COLUMN payments.description IS 'Description lisible du paiement';

-- Optionnel : Ajouter plan_type dans users si pas encore présent
ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'BASIC';