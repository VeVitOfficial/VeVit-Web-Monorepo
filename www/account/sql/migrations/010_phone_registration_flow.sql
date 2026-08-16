BEGIN;

ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_added_at timestamptz,
  ADD COLUMN IF NOT EXISTS nickname_normalized text;

UPDATE public.users
SET nickname_normalized = lower(regexp_replace(btrim(nickname), '\s+', ' ', 'g'))
WHERE nickname IS NOT NULL AND nickname_normalized IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE nickname_normalized IS NOT NULL
    GROUP BY nickname_normalized HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'nickname_normalized_conflicts';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_e164_unique
  ON public.users (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_normalized_unique
  ON public.users (nickname_normalized) WHERE nickname_normalized IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.pending_phone_registrations (
  id text PRIMARY KEY CHECK (id ~ '^[0-9a-f]{48}$'),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 30),
  nickname_normalized text NOT NULL,
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^\+420[0-9]{9}$'),
  password_hash text NOT NULL CHECK (char_length(password_hash) >= 50),
  expires_at timestamptz NOT NULL,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 6),
  resend_count smallint NOT NULL DEFAULT 0 CHECK (resend_count BETWEEN 0 AND 5),
  last_sent_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS pending_phone_registrations_active_idx
  ON public.pending_phone_registrations (expires_at)
  WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS pending_phone_registrations_phone_idx
  ON public.pending_phone_registrations (phone_e164, created_at DESC);

ALTER TABLE public.pending_phone_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pending_phone_registrations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_phone_registration_failure(p_challenge_id text)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_attempts smallint;
BEGIN
  UPDATE public.pending_phone_registrations
  SET attempts = LEAST(attempts + 1, 6)
  WHERE id = p_challenge_id AND used_at IS NULL AND expires_at > now()
  RETURNING attempts INTO v_attempts;
  RETURN v_attempts;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_phone_registration_resend(p_challenge_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE public.pending_phone_registrations
  SET resend_count = resend_count + 1, last_sent_at = now()
  WHERE id = p_challenge_id
    AND used_at IS NULL
    AND expires_at > now()
    AND resend_count < 5
    AND (last_sent_at IS NULL OR last_sent_at <= now() - interval '60 seconds');
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_phone_registration(
  p_challenge_id text,
  p_user_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE p public.pending_phone_registrations%ROWTYPE;
BEGIN
  SELECT * INTO p
  FROM public.pending_phone_registrations
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND OR p.used_at IS NOT NULL OR p.expires_at <= now() OR p.attempts >= 6 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_phone_registration';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE phone_e164 = p.phone_e164)
     OR EXISTS (SELECT 1 FROM public.users WHERE nickname_normalized = p.nickname_normalized) THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'phone_registration_conflict';
  END IF;

  INSERT INTO public.users (
    id, email, nickname, nickname_normalized, full_name, password,
    phone_e164, phone_verified_at, phone_added_at, tier, role, created_at
  ) VALUES (
    p_user_id, NULL, p.nickname, p.nickname_normalized, p.full_name, p.password_hash,
    p.phone_e164, now(), now(), 'free', 'User', now()
  );

  UPDATE public.pending_phone_registrations
  SET used_at = now(), password_hash = repeat('*', 60)
  WHERE id = p_challenge_id AND used_at IS NULL;

  RETURN p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_phone_registration_failure(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_phone_registration_resend(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_phone_registration(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_phone_registration_failure(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_phone_registration_resend(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_phone_registration(text, text) TO service_role;

COMMIT;
