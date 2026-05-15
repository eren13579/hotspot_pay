CREATE TABLE IF NOT EXISTS plan_features (
    id          BIGSERIAL    NOT NULL,
    plan_type   VARCHAR(50)  NOT NULL,
    feature_key VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255),
    feature_type  VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_plan_features PRIMARY KEY (id),
    CONSTRAINT uq_plan_feature  UNIQUE (plan_type, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_type ON plan_features (plan_type);

INSERT INTO plan_features (plan_type, feature_key, feature_value, feature_type) VALUES
('BASIC', 'daily_withdrawal_limit', '100.00', 'DECIMAL'),
('BASIC', 'monthly_withdrawal_limit', '1000.00', 'DECIMAL'),
('BASIC', 'max_hotspots', '1', 'NUMBER'),
('BASIC', 'analytics_basic', 'true', 'BOOLEAN'),
('BASIC', 'support_email', 'true', 'BOOLEAN'),

('PRO', 'daily_withdrawal_limit', '500.00', 'DECIMAL'),
('PRO', 'monthly_withdrawal_limit', '5000.00', 'DECIMAL'),
('PRO', 'max_hotspots', '5', 'NUMBER'),
('PRO', 'analytics_advanced', 'true', 'BOOLEAN'),
('PRO', 'support_priority', 'true', 'BOOLEAN'),
('PRO', 'api_access', 'true', 'BOOLEAN'),

('ENTERPRISE', 'daily_withdrawal_limit', '2000.00', 'DECIMAL'),
('ENTERPRISE', 'monthly_withdrawal_limit', '20000.00', 'DECIMAL'),
('ENTERPRISE', 'max_hotspots', '50', 'NUMBER'),
('ENTERPRISE', 'analytics_enterprise', 'true', 'BOOLEAN'),
('ENTERPRISE', 'support_dedicated', 'true', 'BOOLEAN'),
('ENTERPRISE', 'api_access', 'true', 'BOOLEAN'),
('ENTERPRISE', 'white_label', 'true', 'BOOLEAN');