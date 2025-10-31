-- Create zoho_oauth_tokens table for token caching
CREATE TABLE IF NOT EXISTS zoho_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  circuit_breaker_until TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_zoho_tokens_expires_at ON zoho_oauth_tokens(expires_at DESC);

-- Ensure only one active token exists (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_zoho_tokens_singleton ON zoho_oauth_tokens((1));