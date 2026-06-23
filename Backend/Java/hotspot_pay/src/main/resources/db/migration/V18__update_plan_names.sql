-- V18__update_plan_names.sql
-- Met à jour les contraintes CHECK pour utiliser les nouveaux noms de plans
-- STANDARD (ex-BASIC), PRO, PREMIUM (ex-ENTERPRISE)

-- Supprimer l'ancienne contrainte
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS chk_plan_name;

-- Ajouter la nouvelle contrainte
ALTER TABLE subscriptions ADD CONSTRAINT chk_plan_name
    CHECK (plan_name IN ('STANDARD', 'PRO', 'PREMIUM'));

-- Mettre à jour la valeur par défaut dans users
ALTER TABLE users ALTER COLUMN plan_type SET DEFAULT 'STANDARD';

COMMENT ON COLUMN subscriptions.plan_name IS 'STANDARD, PRO ou PREMIUM';
