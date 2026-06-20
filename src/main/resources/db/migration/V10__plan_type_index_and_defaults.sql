-- V10__plan_type_index_and_defaults.sql
-- S'assure que plan_type a une valeur par défaut et un index pour les requêtes de limite

ALTER TABLE users
    ALTER COLUMN plan_type SET DEFAULT 'BASIC';

UPDATE users SET plan_type = 'BASIC' WHERE plan_type IS NULL;

ALTER TABLE users
    ALTER COLUMN plan_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users (plan_type);

-- Index sur subscriptions pour retrouver vite par paymentReference
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_ref ON subscriptions (payment_reference);
