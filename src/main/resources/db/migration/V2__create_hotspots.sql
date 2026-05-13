CREATE TABLE IF NOT EXISTS hotspots
(
    id                    UUID         NOT NULL DEFAULT gen_random_uuid(),
    hotspot_id            VARCHAR(255) NOT NULL,
    user_id               VARCHAR(255) NOT NULL,
    name                  VARCHAR(100) NOT NULL,
    location              VARCHAR(255),
    mikrotik_ip           VARCHAR(45)  NOT NULL,
    mikrotik_port         INTEGER               DEFAULT 8728,
    mikrotik_user         VARCHAR(100) NOT NULL,
    mikrotik_password_enc TEXT         NOT NULL,
    hotspot_profile       VARCHAR(100)          DEFAULT 'default',
    is_online             BOOLEAN               DEFAULT FALSE,
    last_ping_at          TIMESTAMP,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_hotspots         PRIMARY KEY (id),
    CONSTRAINT uq_hotspots_id      UNIQUE (hotspot_id),
    CONSTRAINT fk_hotspots_user    FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hotspots_user_id  ON hotspots (user_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_is_online ON hotspots (is_online);