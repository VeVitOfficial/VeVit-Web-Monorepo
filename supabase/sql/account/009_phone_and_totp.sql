-- Phone identity and TOTP 2FA. Run manually after migration 008.
BEGIN;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_e164 text, ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz, ADD COLUMN IF NOT EXISTS phone_added_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_e164_unique ON public.users (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.user_totp_methods (user_id text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE, secret_ciphertext text NOT NULL, enabled_at timestamptz, last_verified_step bigint, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.user_recovery_codes (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, code_hash text NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, code_hash));
CREATE TABLE IF NOT EXISTS public.auth_challenges (id text PRIMARY KEY, user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, kind text NOT NULL CHECK (kind IN ('login_totp','totp_setup','phone_connect','phone_register')), payload jsonb NOT NULL DEFAULT '{}'::jsonb, expires_at timestamptz NOT NULL, used_at timestamptz, attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 10), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS auth_challenges_active_idx ON public.auth_challenges (user_id, kind, expires_at DESC) WHERE used_at IS NULL;
ALTER TABLE public.user_totp_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_challenges ENABLE ROW LEVEL SECURITY;
COMMIT;
