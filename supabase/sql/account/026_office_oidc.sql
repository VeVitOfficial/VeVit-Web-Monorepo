-- 026: VeVit Office – Vevit účet jako OIDC poskytovatel a Vevit API pro online režim.
-- Smlouva: docs/office/OIDC-SPEC.md. Tabulky jsou jen pro server (Next.js se secret klíčem): RLS zapnuté bez politik
-- a bez grantů pro anon / authenticated, stejně jako migrace 017, 021 a 025.
-- Tajemství (autorizační kód, device token, device/poll kód) se v databázi nikdy neukládají v čitelné podobě: jen SHA-256.
-- Jediná výjimka je zapečetěný (AES-256-GCM) device token v office_link_requests mezi potvrzením a prvním vyzvednutím,
-- nejvýš 10 minut, po vyzvednutí se maže.

alter table public.users add column if not exists email_verified_at timestamptz;

-- ── Spárovaná zařízení (servery Office v online režimu) ──────────────────────
create table if not exists public.office_devices (
  id text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  -- Podřetězec <name>.office.vevit.cz. Zůstává obsazený i po odpojení (jméno se nepřidělí jinému majiteli).
  name text not null unique check (name ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(name) between 3 and 40),
  display_name text not null check (length(display_name) between 1 and 60),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);
create index if not exists office_devices_owner_idx on public.office_devices (owner_id) where revoked_at is null;
alter table public.office_devices enable row level security;

-- ── Párování: kód ukázaný serverem + poll token ─────────────────────────────
create table if not exists public.office_link_requests (
  id text primary key,
  poll_hash text not null unique,
  code_hash text not null unique,
  expires_at timestamptz not null,
  device_id text references public.office_devices(id) on delete cascade,
  sealed_token text,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists office_link_requests_expires_idx on public.office_link_requests (expires_at);
alter table public.office_link_requests enable row level security;

-- ── Souhlasy s přihlášením na cizí server ────────────────────────────────────
create table if not exists public.office_consents (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  device_id text not null references public.office_devices(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index if not exists office_consents_active_idx on public.office_consents (user_id, device_id) where revoked_at is null;
alter table public.office_consents enable row level security;

-- ── OIDC: čekající žádost o souhlas, jednorázové kódy, device flow ───────────
create table if not exists public.office_oidc_pending (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  client_id text not null,
  device_id text not null references public.office_devices(id) on delete cascade,
  redirect_uri text not null,
  state text not null,
  nonce text not null,
  scope text not null,
  code_challenge text not null,
  expires_at timestamptz not null
);
alter table public.office_oidc_pending enable row level security;

create table if not exists public.office_oidc_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  client_id text not null,
  user_id text not null references public.users(id) on delete cascade,
  device_id text references public.office_devices(id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  nonce text not null,
  scope text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);
create index if not exists office_oidc_codes_expires_idx on public.office_oidc_codes (expires_at);
alter table public.office_oidc_codes enable row level security;

create table if not exists public.office_device_codes (
  device_code_hash text primary key check (device_code_hash ~ '^[0-9a-f]{64}$'),
  user_code_hash text not null unique check (user_code_hash ~ '^[0-9a-f]{64}$'),
  client_id text not null,
  user_id text references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'consumed')),
  interval_seconds int not null default 5,
  last_poll_at timestamptz,
  expires_at timestamptz not null
);
create index if not exists office_device_codes_expires_idx on public.office_device_codes (expires_at);
alter table public.office_device_codes enable row level security;

-- ── Tarify (ruční) a předplatné ──────────────────────────────────────────────
create table if not exists public.office_plans (
  plan text primary key check (plan ~ '^[a-z0-9_-]{1,32}$'),
  bytes_per_month bigint not null check (bytes_per_month >= 0),
  max_streams int not null check (max_streams >= 0),
  active boolean not null default true
);
insert into public.office_plans (plan, bytes_per_month, max_streams) values
  ('free', 10000000000, 8), ('pro', 500000000000, 64)
on conflict (plan) do nothing;
alter table public.office_plans enable row level security;

create table if not exists public.office_subscriptions (
  user_id text primary key references public.users(id) on delete cascade,
  plan text not null references public.office_plans(plan),
  active boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'stripe')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);
alter table public.office_subscriptions enable row level security;

-- ── DNS: poslední hodnota TXT záznamu zařízení (pro srovnání s poskytovatelem) ─
create table if not exists public.office_dns_records (
  device_id text not null references public.office_devices(id) on delete cascade,
  name text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (device_id, name)
);
alter table public.office_dns_records enable row level security;

-- ── Audit: přihlášení, párování, změny DNS a zařízení ────────────────────────
-- ip_hash je HMAC adresy (bez surové IP), detail nikdy neobsahuje tajemství ani hodnoty TXT.
create table if not exists public.office_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (length(kind) between 1 and 48),
  user_id text,
  device_id text,
  ip_hash text,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists office_audit_user_idx on public.office_audit (user_id, at desc);
create index if not exists office_audit_device_idx on public.office_audit (device_id, at desc);
alter table public.office_audit enable row level security;

revoke all on table
  public.office_devices, public.office_link_requests, public.office_consents, public.office_oidc_pending, public.office_oidc_codes,
  public.office_device_codes, public.office_plans, public.office_subscriptions, public.office_dns_records, public.office_audit
from anon, authenticated;
revoke all on sequence public.office_audit_id_seq from anon, authenticated;

-- Úklid prošlých záznamů (volat z existující cron úlohy /api/jobs/run nebo ručně).
create or replace function public.office_purge_expired() returns void language sql security definer set search_path = public as $$
  delete from public.office_link_requests where expires_at < now() - interval '1 day';
  delete from public.office_oidc_codes where expires_at < now() - interval '1 day';
  delete from public.office_oidc_pending where expires_at < now() - interval '1 day';
  delete from public.office_device_codes where expires_at < now() - interval '1 day';
$$;
revoke all on function public.office_purge_expired() from public, anon, authenticated;
grant execute on function public.office_purge_expired() to service_role;

-- Atomické jednorázové použití kódu: vrátí řádek a označí ho, druhé volání vrátí reused = true.
create or replace function public.office_use_code(p_hash text) returns table (
  client_id text, user_id text, device_id text, redirect_uri text, code_challenge text, nonce text, scope text, expires_at timestamptz, reused boolean
) language plpgsql security definer set search_path = public as $$
declare r public.office_oidc_codes%rowtype;
begin
  update public.office_oidc_codes c set used_at = now() where c.code_hash = p_hash and c.used_at is null returning c.* into r;
  if found then
    return query select r.client_id, r.user_id, r.device_id, r.redirect_uri, r.code_challenge, r.nonce, r.scope, r.expires_at, false;
  else
    return query select c.client_id, c.user_id, c.device_id, c.redirect_uri, c.code_challenge, c.nonce, c.scope, c.expires_at, true
      from public.office_oidc_codes c where c.code_hash = p_hash;
  end if;
end $$;
revoke all on function public.office_use_code(text) from public, anon, authenticated;
grant execute on function public.office_use_code(text) to service_role;

-- ── Rate limiting nových endpointů ───────────────────────────────────────────
-- Vlastní tabulka s atomickým počítadlem (klíč = SHA-256 z "namespace|identita"; identita je IP, uživatel nebo zařízení).
create table if not exists public.office_rate_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  hits int not null,
  window_end timestamptz not null
);
alter table public.office_rate_limits enable row level security;
revoke all on table public.office_rate_limits from anon, authenticated;

create or replace function public.office_rate_consume(p_key text, p_window_seconds int, p_max int) returns boolean
language plpgsql security definer set search_path = public as $$
declare h int;
begin
  if p_window_seconds < 1 or p_window_seconds > 86400 or p_max < 1 then raise exception 'bad rate limit configuration'; end if;
  insert into public.office_rate_limits as r (key_hash, hits, window_end)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key_hash) do update set
    hits = case when r.window_end <= now() then 1 else r.hits + 1 end,
    window_end = case when r.window_end <= now() then now() + make_interval(secs => p_window_seconds) else r.window_end end
  returning hits into h;
  return h <= p_max;
end $$;
revoke all on function public.office_rate_consume(text, int, int) from public, anon, authenticated;
grant execute on function public.office_rate_consume(text, int, int) to service_role;
