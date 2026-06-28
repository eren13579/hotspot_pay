-- ═══════════════════════════════════════════════════════
-- V31 : Frais fournisseur et colonnes retrait avancées
-- ═══════════════════════════════════════════════════════

ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS provider_fee     DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS net_amount       DECIMAL(10, 2);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS processed_by     VARCHAR(255);
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS notes            TEXT;
