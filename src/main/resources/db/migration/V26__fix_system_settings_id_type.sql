-- ═══════════════════════════════════════════════════════
-- V26 : Fix system_settings id: UUID → BIGSERIAL
-- V25 a créé la colonne id en UUID mais l'entité JPA
-- attend un BIGINT (GenerationType.IDENTITY).
-- ═══════════════════════════════════════════════════════

ALTER TABLE system_settings DROP CONSTRAINT pk_system_settings;
ALTER TABLE system_settings DROP COLUMN id;
ALTER TABLE system_settings ADD COLUMN id BIGSERIAL;
ALTER TABLE system_settings ADD PRIMARY KEY (id);
