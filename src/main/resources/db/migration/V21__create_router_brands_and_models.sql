-- ═══════════════════════════════════════════════════════
-- V21 : Tables router_brands et router_models
-- Gestion multi-marque de routeurs pour HotspotPay
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS router_brands
(
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url    VARCHAR(500),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_router_brands   PRIMARY KEY (id),
    CONSTRAINT uq_router_brands_slug UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_router_brands_active ON router_brands (is_active);

CREATE TABLE IF NOT EXISTS router_models
(
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    brand_id        UUID         NOT NULL,
    name            VARCHAR(150) NOT NULL,
    slug            VARCHAR(150) NOT NULL,
    connection_type VARCHAR(20)  NOT NULL DEFAULT 'api',
    -- Types : api, ssh, snmp, http, telnet
    default_port    INTEGER,
    config_schema   JSONB,
    -- JSON Schema décrivant les champs de config requis pour ce modèle
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_router_models    PRIMARY KEY (id),
    CONSTRAINT fk_models_brand     FOREIGN KEY (brand_id) REFERENCES router_brands (id) ON DELETE CASCADE,
    CONSTRAINT uq_models_brand_slug UNIQUE (brand_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_router_models_brand ON router_models (brand_id);
CREATE INDEX IF NOT EXISTS idx_router_models_active ON router_models (is_active);

-- Ajouter model_id à la table hotspots (nullable pour compatibilité)
ALTER TABLE hotspots
    ADD COLUMN IF NOT EXISTS model_id UUID;

ALTER TABLE hotspots
    ADD CONSTRAINT fk_hotspots_model FOREIGN KEY (model_id) REFERENCES router_models (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hotspots_model ON hotspots (model_id);
