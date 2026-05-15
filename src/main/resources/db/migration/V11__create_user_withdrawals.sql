CREATE TABLE IF NOT EXISTS user_withdrawals (
    id           BIGSERIAL      NOT NULL,
    user_id      VARCHAR(255)   NOT NULL,
    amount       DECIMAL(15, 2) NOT NULL,
    withdrawn_at TIMESTAMP      NOT NULL DEFAULT NOW(),
    description  VARCHAR(500),
    CONSTRAINT pk_user_withdrawals   PRIMARY KEY (id),
    CONSTRAINT fk_withdrawals_user   FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_withdrawals_user ON user_withdrawals (user_id);
CREATE INDEX IF NOT EXISTS idx_user_withdrawals_date ON user_withdrawals (withdrawn_at);