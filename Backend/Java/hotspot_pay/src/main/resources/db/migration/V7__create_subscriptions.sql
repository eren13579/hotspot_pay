-- V7__create_subscriptions.sql
CREATE TABLE IF NOT EXISTS subscriptions
(
    id                  UUID           NOT NULL DEFAULT gen_random_uuid(),
    subscription_id     VARCHAR(255)   NOT NULL,
    user_id             VARCHAR(255)   NOT NULL,
    plan_name           VARCHAR(50)    NOT NULL,           -- BASIC, PRO, ENTERPRISE
    amount              DECIMAL(10, 2) NOT NULL,
    currency            VARCHAR(5)     NOT NULL DEFAULT 'XAF',
    duration_months     INTEGER        NOT NULL,
    status              VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    starts_at           TIMESTAMP,
    expires_at          TIMESTAMP      NOT NULL,
    cancelled_at        TIMESTAMP,
    payment_reference   VARCHAR(255),
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_subscriptions          PRIMARY KEY (id),
    CONSTRAINT uq_subscriptions_id       UNIQUE (subscription_id),
    CONSTRAINT fk_subscriptions_user     FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_subscription_status CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
    CONSTRAINT chk_plan_name CHECK (plan_name IN ('BASIC', 'PRO', 'ENTERPRISE'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user      ON subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires   ON subscriptions (expires_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscriptions_status    ON subscriptions (status);

COMMENT ON TABLE subscriptions IS 'Abonnements SaaS des propriétaires de hotspots';