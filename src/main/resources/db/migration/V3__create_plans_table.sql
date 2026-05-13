CREATE TABLE IF NOT EXISTS plans
(
    id                  UUID           NOT NULL DEFAULT gen_random_uuid(),
    plan_id             VARCHAR(255)   NOT NULL,
    hotspot_id          VARCHAR(255)   NOT NULL,
    name                VARCHAR(100)   NOT NULL,
    description         VARCHAR(255),
    duration_minutes    INTEGER        NOT NULL,
    price               DECIMAL(10, 2) NOT NULL,
    currency            VARCHAR(5)     NOT NULL DEFAULT 'XAF',
    download_speed_kbps INTEGER,
    upload_speed_kbps   INTEGER,
    data_limit_mb       INTEGER,
    display_order       INTEGER                 DEFAULT 0,
    is_active           BOOLEAN                 DEFAULT TRUE,
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_plans          PRIMARY KEY (id),
    CONSTRAINT uq_plans_plan_id  UNIQUE (plan_id),
    CONSTRAINT fk_plans_hotspot  FOREIGN KEY (hotspot_id)
        REFERENCES hotspots (hotspot_id) ON DELETE CASCADE,
    CONSTRAINT chk_price_positive    CHECK (price > 0),
    CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0)
);

CREATE INDEX IF NOT EXISTS idx_plans_hotspot_id ON plans (hotspot_id);
CREATE INDEX IF NOT EXISTS idx_plans_active     ON plans (hotspot_id, is_active, display_order);