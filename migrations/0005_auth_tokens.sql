-- Jetons usage unique : confirmation email & réinitialisation mot de passe

CREATE TABLE auth_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_auth_tokens_hash_purpose ON auth_tokens(token_hash, purpose);
CREATE INDEX idx_auth_tokens_user_purpose ON auth_tokens(user_id, purpose);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);
