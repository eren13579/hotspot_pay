-- ═══════════════════════════════════════════════════════
-- V30 : FAQ (Foire aux questions)
-- Questions/réponses modifiables depuis l'interface admin
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS faqs
(
    id             UUID           NOT NULL DEFAULT gen_random_uuid(),
    question       TEXT           NOT NULL,
    answer         TEXT           NOT NULL,
    category       VARCHAR(100),
    sort_order     INTEGER        NOT NULL DEFAULT 0,
    is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_faqs PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_faqs_active      ON faqs (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_category    ON faqs (category);

COMMENT ON TABLE faqs IS 'Foire aux questions — contenu éditable depuis le panneau admin';
