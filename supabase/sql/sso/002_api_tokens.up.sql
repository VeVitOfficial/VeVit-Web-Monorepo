create table if not exists public.api_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  client_kind text not null check (client_kind in ('mobile', 'cli')),
  device_label text,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  rotated_from uuid references public.api_refresh_tokens(id),
  revoked_at timestamptz,
  revoked_reason text
);

alter table public.api_refresh_tokens enable row level security;
alter table public.api_refresh_tokens force row level security;
revoke all on table public.api_refresh_tokens from anon, authenticated, public;
create index if not exists api_refresh_tokens_user_active_idx
  on public.api_refresh_tokens (user_id) where revoked_at is null;
