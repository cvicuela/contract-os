-- Add user_id to existing tables
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE obligations ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Indexes for user_id lookups
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_obligations_user_id ON obligations(user_id);

-- User tokens table (for Google Drive refresh tokens)
CREATE TABLE IF NOT EXISTS user_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  refresh_token TEXT NOT NULL,
  drive_folder_id TEXT,
  token_expiry TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- RLS (enable but keep open for MVP — add policies when adding proper auth)
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
