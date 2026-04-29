ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET email_verified = TRUE;

CREATE TABLE IF NOT EXISTS email_action_tokens
(
    id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    token      VARCHAR(512) UNIQUE NOT NULL,
    user_id    BIGINT              NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose    VARCHAR(50)         NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP           NOT NULL,
    used_at    TIMESTAMP,
    revoked    BOOLEAN   DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_email_action_tokens_user_purpose
    ON email_action_tokens (user_id, purpose);
