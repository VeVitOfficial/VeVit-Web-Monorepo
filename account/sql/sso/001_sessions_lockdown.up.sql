create extension if not exists pgcrypto with schema extensions;

drop policy if exists sessions_own on public.sessions;
revoke all on table public.sessions from anon, authenticated, public;
alter table public.sessions enable row level security;
alter table public.sessions force row level security;

alter table public.sessions
  add column if not exists token_hash text,
  add column if not exists csrf_token_hash text,
  add column if not exists remember boolean not null default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_reason text,
  add column if not exists device_label text,
  add column if not exists ua_hash text,
  add column if not exists ip_hash text;

-- Backfill proběhne ve stejné transakci před vytvořením hashového indexu.
-- Plaintext zůstává do konce Fáze 5 kvůli bezvýpadkovému dual-read přechodu.
update public.sessions
set token_hash = encode(extensions.digest(session_token::text, 'sha256'), 'hex')
where token_hash is null and session_token is not null;

update public.sessions set created_at = now() where created_at is null;
alter table public.sessions alter column created_at set not null;

create unique index if not exists sessions_token_hash_uidx
  on public.sessions (token_hash);
create index if not exists sessions_user_active_idx
  on public.sessions (user_id) where revoked_at is null;
create index if not exists sessions_expires_idx
  on public.sessions (expires_at);

alter table public.users
  add column if not exists status text not null default 'active',
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_status_check'
  ) then
    alter table public.users add constraint users_status_check
      check (status in ('active', 'blocked', 'deleted'));
  end if;
end
$$;

revoke execute on function public.delete_user_account(text) from anon, authenticated, public;
grant execute on function public.delete_user_account(text) to service_role;
alter function public.delete_user_account(text) set search_path = '';

alter table public.store_product_views enable row level security;
alter table public.store_product_views force row level security;
revoke all on table public.store_product_views from anon, authenticated, public;
-- Bez klientské policy: zápis i čtení jde pouze přes serverový service_role.
