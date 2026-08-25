-- OAuth identities for the existing PHP session system.
-- Run manually in Supabase SQL editor. This migration does not use Supabase Auth.

BEGIN;

-- Password-only registration continues to populate these fields. OAuth users
-- finish their required profile details through /onboarding.
ALTER TABLE public.users
  ALTER COLUMN password DROP NOT NULL,
  ALTER COLUMN nickname DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.oauth_identities (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'github', 'discord')),
  provider_user_id text NOT NULL,
  provider_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS oauth_identities_user_id_idx
  ON public.oauth_identities (user_id);

-- One-time, server-side state and PKCE verifier store. No browser OAuth
-- cookie and no OAuth access token are persisted.
CREATE TABLE IF NOT EXISTS public.oauth_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state_hash text NOT NULL UNIQUE,
  provider text NOT NULL CHECK (provider IN ('google', 'github', 'discord')),
  code_verifier text NOT NULL,
  destination text NOT NULL DEFAULT '/account',
  initiated_user_id text REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oauth_attempts_pending_idx
  ON public.oauth_attempts (state_hash, expires_at)
  WHERE used_at IS NULL;

-- These tables are addressed only by the PHP backend with the service role.
ALTER TABLE public.oauth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_attempts ENABLE ROW LEVEL SECURITY;

-- Consumes state atomically, preventing callback replay and concurrent use.
CREATE OR REPLACE FUNCTION public.consume_oauth_attempt(p_state_hash text)
RETURNS TABLE (
  provider text,
  code_verifier text,
  destination text,
  initiated_user_id text
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  UPDATE public.oauth_attempts
     SET used_at = now()
   WHERE state_hash = p_state_hash
     AND used_at IS NULL
     AND expires_at > now()
  RETURNING provider, code_verifier, destination, initiated_user_id;
$$;

-- Users and identities are created in one database transaction. Existing
-- matching identities win on a concurrent first sign-in; a matching e-mail
-- without an already-linked identity is deliberately rejected.
CREATE OR REPLACE FUNCTION public.create_oauth_user_and_identity(
  p_user_id text,
  p_email text,
  p_full_name text,
  p_avatar_url text,
  p_provider text,
  p_provider_user_id text,
  p_provider_email text
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_user_id text;
BEGIN
  INSERT INTO public.users (
    id, email, full_name, nickname, password,
    tier, role, avatar_url, created_at
  ) VALUES (
    p_user_id, p_email, NULLIF(p_full_name, ''), NULL, NULL,
    'free', 'User', NULLIF(p_avatar_url, ''), now()
  );

  INSERT INTO public.oauth_identities (
    user_id, provider, provider_user_id, provider_email
  ) VALUES (
    p_user_id, p_provider, p_provider_user_id, NULLIF(p_provider_email, '')
  );

  RETURN p_user_id;
EXCEPTION WHEN unique_violation THEN
  SELECT user_id INTO v_existing_user_id
    FROM public.oauth_identities
   WHERE provider = p_provider
     AND provider_user_id = p_provider_user_id;

  IF v_existing_user_id IS NOT NULL THEN
    RETURN v_existing_user_id;
  END IF;

  RAISE EXCEPTION 'oauth_email_already_exists' USING ERRCODE = 'P0001';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_oauth_attempt(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_oauth_user_and_identity(
  text, text, text, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_oauth_attempt(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_oauth_user_and_identity(
  text, text, text, text, text, text, text
) TO service_role;

COMMIT;
