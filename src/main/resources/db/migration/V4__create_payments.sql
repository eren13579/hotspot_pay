CREATE TABLE IF NOT EXISTS payments
(
    id                  UUID           NOT NULL DEFAULT gen_random_uuid(),
    payment_id          VARCHAR(255)   NOT NULL,
    reference           VARCHAR(255)   NOT NULL,
    hotspot_id          VARCHAR(255)   NOT NULL,
    plan_id             VARCHAR(255)   NOT NULL,
    client_phone        VARCHAR(20)    NOT NULL,
    client_mac          VARCHAR(17)    NOT NULL,
    operator            VARCHAR(30)    NOT NULL,
    amount              DECIMAL(10, 2) NOT NULL,
    currency            VARCHAR(5)     NOT NULL DEFAULT 'XAF',
    status              VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    gateway_tx_id       VARCHAR(255),
    failure_reason      VARCHAR(500),
    retry_count         INTEGER                 DEFAULT 0,
    webhook_received_at TIMESTAMP,
    paid_at             TIMESTAMP,
    expires_at          TIMESTAMP,
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_payments           PRIMARY KEY (id),
    CONSTRAINT uq_payments_id        UNIQUE (payment_id),
    CONSTRAINT uq_payments_reference UNIQUE (reference),
    CONSTRAINT fk_payments_hotspot   FOREIGN KEY (hotspot_id)
        REFERENCES hotspots (hotspot_id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_plan      FOREIGN KEY (plan_id)
        REFERENCES plans (plan_id) ON DELETE RESTRICT,
    CONSTRAINT chk_operator CHECK (operator IN ('MTN_MOMO', 'ORANGE_MONEY')),
    CONSTRAINT chk_status   CHECK (status IN ('PENDING','PAID','FAILED','EXPIRED','REFUNDED'))
);

CREATE INDEX IF NOT EXISTS idx_payments_reference       ON payments (reference);
CREATE INDEX IF NOT EXISTS idx_payments_status          ON payments (status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_mac_phone       ON payments (client_mac, client_phone);
CREATE INDEX IF NOT EXISTS idx_payments_hotspot         ON payments (hotspot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_pending_created ON payments (created_at) WHERE status = 'PENDING';