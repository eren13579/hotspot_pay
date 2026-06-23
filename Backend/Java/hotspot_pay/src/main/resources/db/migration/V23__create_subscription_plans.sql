-- Création de la table subscription_plans pour gérer les plans d'abonnement en DB locale
-- (au lieu des plans hardcodés ou du proxy FastAPI)

CREATE TABLE subscription_plans (
    id              UUID PRIMARY KEY,
    plan_name       VARCHAR(50)  NOT NULL UNIQUE,
    monthly_price   NUMERIC(10,2) NOT NULL DEFAULT 0,
    yearly_price    NUMERIC(10,2) DEFAULT 0,
    max_hotspots    INTEGER      DEFAULT 1,
    description     VARCHAR(500),
    is_popular      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

-- Insérer les 3 plans par défaut (le @PostConstruct de SubscriptionServiceImpl
-- les ajoutera aussi si la table est vide, mais on les seed ici pour la migration)
INSERT INTO subscription_plans (id, plan_name, monthly_price, yearly_price, max_hotspots, description, is_popular, is_active)
VALUES
    (gen_random_uuid(), 'BASIC',   0,      0,      1,   'Pour démarrer',              FALSE,  TRUE),
    (gen_random_uuid(), 'PRO',     15000,  144000, 10,  'Pour les professionnels',    TRUE,   TRUE),
    (gen_random_uuid(), 'PREMIUM', 50000,  480000, 99,  'Solution entreprise',        FALSE,  TRUE);
