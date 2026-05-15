CREATE TABLE IF NOT EXISTS webhook_events (
    id                BIGSERIAL    NOT NULL,
    event_id          VARCHAR(255) NOT NULL,
    payment_reference VARCHAR(255) NOT NULL,
    gateway           VARCHAR(50)  NOT NULL,
    payload           JSONB,
    processed_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    status            VARCHAR(20)           DEFAULT 'PROCESSED',
    CONSTRAINT pk_webhook_events    PRIMARY KEY (id),
    CONSTRAINT uq_webhook_event_id  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_ref     ON webhook_events (payment_reference);
CREATE INDEX IF NOT EXISTS idx_webhook_events_gateway ON webhook_events (gateway);