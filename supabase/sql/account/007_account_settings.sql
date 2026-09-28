-- Account settings extensions. Run manually in Supabase SQL editor.
BEGIN;

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Europe/Prague',
  date_format text NOT NULL DEFAULT 'DD. MM. YYYY' CHECK (date_format IN ('DD. MM. YYYY', 'YYYY-MM-DD')),
  week_starts_on text NOT NULL DEFAULT 'monday' CHECK (week_starts_on IN ('monday', 'sunday')),
  region text NOT NULL DEFAULT 'CZ',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE INDEX IF NOT EXISTS sessions_user_active_idx
  ON public.sessions (user_id, expires_at DESC);

COMMIT;
