CREATE TABLE IF NOT EXISTS audit_logs
(
    id          BIGSERIAL    NOT NULL,
    user_id     VARCHAR(255),
    hotspot_id  VARCHAR(255),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   VARCHAR(100),
    client_phone VARCHAR(20),
    client_mac  VARCHAR(17),
    ip_address  VARCHAR(45),
    details     JSONB,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_audit_logs PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_hotspot ON audit_logs (hotspot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_phone   ON audit_logs (client_phone);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs (user_id, created_at DESC);