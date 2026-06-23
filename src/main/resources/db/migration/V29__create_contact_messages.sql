-- ═══════════════════════════════════════════════════════
-- V29 : Messages de contact (tickets support)
-- Messages envoyés depuis le portail ou la page contact
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contact_messages
(
    id             UUID           NOT NULL DEFAULT gen_random_uuid(),
    name           VARCHAR(150)   NOT NULL,
    email          VARCHAR(255)   NOT NULL,
    subject        VARCHAR(255)   NOT NULL,
    message        TEXT           NOT NULL,
    admin_reply    TEXT,
    status         VARCHAR(20)    NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP      NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_contact_messages       PRIMARY KEY (id),
    CONSTRAINT chk_contact_msg_status    CHECK (status IN ('pending', 'read', 'replied', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email  ON contact_messages (email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages (created_at DESC);

COMMENT ON TABLE contact_messages IS 'Messages de contact envoyés depuis la page Contact ou le portail captif';
