-- V11__create_withdrawals.sql
CREATE TABLE IF NOT EXISTS withdrawals
(
    id               UUID           NOT NULL DEFAULT gen_random_uuid(),
    withdrawal_id    VARCHAR(255)   NOT NULL,
    user_id          VARCHAR(255)   NOT NULL,
    amount           DECIMAL(10, 2) NOT NULL,
    currency         VARCHAR(5)     NOT NULL DEFAULT 'XAF',
    recipient_phone  VARCHAR(20)    NOT NULL,
    operator         VARCHAR(30)    NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    gateway_ref      VARCHAR(255),
    failure_reason   VARCHAR(500),
    processed_at     TIMESTAMP,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_withdrawals       PRIMARY KEY (id),
    CONSTRAINT uq_withdrawals_id    UNIQUE (withdrawal_id),
    CONSTRAINT fk_withdrawals_user  FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_withdrawal_status CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')),
    CONSTRAINT chk_withdrawal_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user   ON withdrawals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals (status);

COMMENT ON TABLE withdrawals IS 'Demandes de retrait des revenus par les propriétaires de hotspots';
