-- Migration: Harden API Tokens (Add expiry, last_used_at, status, scopes, revoke_reason)

-- 1. Add columns to api_tokens table
ALTER TABLE public.api_tokens
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS revoke_reason text;

-- 2. Add check constraint for status
ALTER TABLE public.api_tokens
DROP CONSTRAINT IF EXISTS chk_api_tokens_status,
ADD CONSTRAINT chk_api_tokens_status CHECK (status IN ('active', 'revoked', 'expired'));

-- 3. Comment columns for documentation
COMMENT ON COLUMN public.api_tokens.expires_at IS 'Timestamp when the token expires (NULL if infinite)';
COMMENT ON COLUMN public.api_tokens.last_used_at IS 'Timestamp when the token was last used to make an API request';
COMMENT ON COLUMN public.api_tokens.status IS 'Status of the token (active, revoked, expired)';
COMMENT ON COLUMN public.api_tokens.scopes IS 'Array of permissions/scopes assigned to the token';
COMMENT ON COLUMN public.api_tokens.revoke_reason IS 'Reason for revoking the token';
