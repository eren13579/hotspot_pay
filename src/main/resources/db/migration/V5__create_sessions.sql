CREATE TABLE IF NOT EXISTS sessions
(
    id                UUID         NOT NULL DEFAULT gen_random_uuid(),
    session_id        VARCHAR(255) NOT NULL,
    payment_id        VARCHAR(255) NOT NULL,
    hotspot_id        VARCHAR(255) NOT NULL,
    plan_id           VARCHAR(255) NOT NULL,
    client_phone      VARCHAR(20)  NOT NULL,
    client_mac        VARCHAR(17)  NOT NULL,
    mikrotik_username VARCHAR(100) NOT NULL,
    mikrotik_password VARCHAR(100) NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    activated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at        TIMESTAMP    NOT NULL,
    expired_at        TIMESTAMP,
    bytes_in          BIGINT                DEFAULT 0,
    bytes_out         BIGINT                DEFAULT 0,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_sessions          PRIMARY KEY (id),
    CONSTRAINT uq_sessions_id       UNIQUE (session_id),
    CONSTRAINT uq_sessions_payment  UNIQUE (payment_id),
    CONSTRAINT fk_sessions_payment  FOREIGN KEY (payment_id)
        REFERENCES payments (payment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_sessions_hotspot  FOREIGN KEY (hotspot_id)
        REFERENCES hotspots (hotspot_id) ON DELETE RESTRICT,
    CONSTRAINT chk_session_status CHECK (status IN ('ACTIVE','EXPIRED','REVOKED'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_sessions_hotspot    ON sessions (hotspot_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_mac        ON sessions (client_mac);
CREATE INDEX IF NOT EXISTS idx_sessions_phone      ON sessions (client_phone);