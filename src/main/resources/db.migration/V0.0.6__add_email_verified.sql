-- V0.0.6: Add email_verified column to users table.
-- The User entity declares this column as NOT NULL.
-- Backfill existing rows with false BEFORE applying NOT NULL
-- so this migration runs cleanly on databases that already have data.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false;
