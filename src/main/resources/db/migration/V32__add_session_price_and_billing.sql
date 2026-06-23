-- ═══════════════════════════════════════════════════════
-- V32 : Colonnes sessions avancées
-- session_price, portal_settings (JSONB), billing_cycle
-- ═══════════════════════════════════════════════════════

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_price     DECIMAL(10, 2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS portal_settings   JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS billing_cycle     VARCHAR(50) DEFAULT 'one_time';

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS chk_session_status;
ALTER TABLE sessions ADD CONSTRAINT chk_session_status CHECK (
    status IN ('ACTIVE','EXPIRED','REVOKED','PENDING_MIKROTIK','PENDING_PAYMENT','CANCELLED')
);
