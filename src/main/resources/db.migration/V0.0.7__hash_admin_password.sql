-- bcrypt hash of "password" (strength 10) — change after first deploy
UPDATE users
SET password = '$2b$10$SJqw/w3YFZZ4YGjxRMfR.OFJWm6L38z/opQHLfES2HfVxQ8azjFUe'
WHERE username = 'admin'
  AND password = 'password';
