-- VeVit Account — Supabase schema
-- Run in Supabase → SQL editor. Requires the native Clerk ↔ Supabase
-- integration enabled (Supabase dashboard → Authentication → Third-party auth
-- → Clerk). With it, auth.jwt()->>'sub' is the Clerk user id.

-- ── profiles: app data keyed to the Clerk user id ──────────────────────────
create table if not exists public.profiles (
  user_id       text primary key,                    -- Clerk user id (sub)
  notifications jsonb  not null default '{}'::jsonb,  -- {news, marketing, monthly_summary}
  billing_info  jsonb  not null default '{}'::jsonb,  -- {company, ico, dic, address}
  payment_method jsonb,                               -- {brand, last4, exp} (display only)
  language      text   not null default 'cs',
  currency      text   not null default 'CZK',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── account_activity: security/audit feed shown on the Overview tab ─────────
create table if not exists public.account_activity (
  id         bigint generated always as identity primary key,
  user_id    text not null,
  kind       text not null,                           -- login | password_change | twofa | session_revoke
  detail     text,
  created_at timestamptz not null default now()
);
create index if not exists account_activity_user_idx
  on public.account_activity (user_id, created_at desc);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.account_activity enable row level security;

-- profiles: a user may only read/write their own row.
-- (auth.jwt()->>'sub' = Clerk user id via the third-party integration.)
create policy "profiles read own"   on public.profiles
  for select using ( (select auth.jwt()->>'sub') = user_id );
create policy "profiles insert own" on public.profiles
  for insert with check ( (select auth.jwt()->>'sub') = user_id );
create policy "profiles update own" on public.profiles
  for update using ( (select auth.jwt()->>'sub') = user_id )
           with check ( (select auth.jwt()->>'sub') = user_id );

-- account_activity: read-only for the owner. Writes come from the server
-- (service role) or Postgres triggers, never from the browser.
create policy "activity read own" on public.account_activity
  for select using ( (select auth.jwt()->>'sub') = user_id );
