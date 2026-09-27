-- 015: Premium tiers (Bronze/Silver/Gold/Platinum), ranks, permissions and
-- organizations (Platinum for schools and companies).
-- Server-only tables: RLS on, no policies; Next.js uses the secret key.

-- ── Tiers ──────────────────────────────────────────────────────────────────
create table if not exists public.tiers (
  key text primary key,
  sort_order integer not null unique,
  xp_bonus_pct integer not null default 0 check (xp_bonus_pct between 0 and 200),
  ai_daily_limit integer check (ai_daily_limit is null or ai_daily_limit >= 0),
  store_discount_pct integer not null default 0 check (store_discount_pct between 0 and 100),
  is_public boolean not null default true
);
alter table public.tiers enable row level security;

insert into public.tiers (key, sort_order, xp_bonus_pct, ai_daily_limit, store_discount_pct, is_public) values
  ('free',     0,  0,   10,  0, true),
  ('bronze',   1, 10,   50,  5, true),
  ('silver',   2, 25,  200, 10, true),
  ('gold',     3, 50, 1000, 20, true),
  ('platinum', 4, 50, null,  0, false)
on conflict (key) do update set
  sort_order = excluded.sort_order,
  xp_bonus_pct = excluded.xp_bonus_pct,
  ai_daily_limit = excluded.ai_daily_limit,
  store_discount_pct = excluded.store_discount_pct,
  is_public = excluded.is_public;

-- Leftover row with an empty tier (unfinished Platinum); Platinum is priced per contract.
delete from public.tier_prices where tier = '';

alter table public.premium_subscriptions
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_customer_id text;
create unique index if not exists premium_subscriptions_stripe_sub_key
  on public.premium_subscriptions (stripe_subscription_id) where stripe_subscription_id is not null;
-- (dropped again in 018: the webhook stores the subscription id in payment_id)

alter table public.users add column if not exists stripe_customer_id text;
create unique index if not exists users_stripe_customer_key
  on public.users (stripe_customer_id) where stripe_customer_id is not null;

-- ── Organizations (Platinum) ───────────────────────────────────────────────
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 200),
  kind text not null check (kind in ('school', 'company', 'other')),
  ico text,
  contract_start date not null default current_date,
  contract_end date,
  seat_limit integer check (seat_limit is null or seat_limit > 0),
  modules text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'suspended', 'ended')),
  created_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'teacher', 'member')),
  invited_by text references public.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (org_id, user_id)
);
create index if not exists organization_members_user_idx on public.organization_members (user_id) where removed_at is null;
alter table public.organization_members enable row level security;

create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text,
  code text unique,
  role text not null default 'member' check (role in ('admin', 'teacher', 'member')),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by text references public.users(id) on delete set null,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (email is not null or code is not null)
);
alter table public.organization_invites enable row level security;

-- ── Ranks ──────────────────────────────────────────────────────────────────
create table if not exists public.ranks (
  key text primary key,
  kind text not null check (kind in ('level', 'membership', 'program', 'staff')),
  min_level integer check (min_level is null or min_level between 1 and 100),
  tier_key text references public.tiers(key),
  priority integer not null default 0,
  color text,
  permissions text[] not null default '{}',
  check ((kind = 'level') = (min_level is not null)),
  check ((kind = 'membership') = (tier_key is not null))
);
alter table public.ranks enable row level security;

insert into public.ranks (key, kind, min_level, tier_key, priority, color, permissions) values
  ('novacek',    'level',       1, null,   0, '#9aa4b2', '{}'),
  ('ucen',       'level',       5, null,   1, '#7cc4a4', '{comments.post}'),
  ('pruzkumnik', 'level',      10, null,   2, '#4fb3d9', '{}'),
  ('tvurce',     'level',      20, null,   3, '#7a8cf0', '{}'),
  ('expert',     'level',      35, null,   4, '#b57cf0', '{}'),
  ('mistr',      'level',      50, null,   5, '#f0a44f', '{}'),
  ('legenda',    'level',      75, null,   6, '#f05f5f', '{}'),
  ('bronze',     'membership', null, 'bronze',   20, '#cd7f32',
     '{ads.hidden,edu.premium_basic,ai.daily_50,store.discount_5,xp.bonus_10}'),
  ('silver',     'membership', null, 'silver',   21, '#c0c0c0',
     '{edu.premium_all,edu.offline,edu.certificate,tools.premium,ai.daily_200,store.discount_10,xp.bonus_25}'),
  ('gold',       'membership', null, 'gold',     22, '#ffd700',
     '{ai.unlimited,support.priority,beta.early,store.discount_20,xp.bonus_50}'),
  ('platinum',   'membership', null, 'platinum', 23, '#e5e4e2', '{org.member}'),
  ('betatester', 'program',    null, null,   30, '#2ec4b6', '{beta.access,feedback.priority}'),
  ('partner',    'program',    null, null,   31, '#ff9f1c', '{}'),
  ('moderator',  'staff',      null, null,   40, '#3a86ff', '{comments.post,comments.moderate,users.view}'),
  ('admin',      'staff',      null, null,   50, '#e63946', '{*}')
on conflict (key) do update set
  kind = excluded.kind, min_level = excluded.min_level, tier_key = excluded.tier_key,
  priority = excluded.priority, color = excluded.color, permissions = excluded.permissions;

create table if not exists public.user_ranks (
  id bigint generated always as identity primary key,
  user_id text not null references public.users(id) on delete cascade,
  rank_key text not null references public.ranks(key),
  source text not null default 'manual' check (source in ('manual', 'migration')),
  granted_by text references public.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  unique (user_id, rank_key)
);
alter table public.user_ranks enable row level security;

-- Only program/staff ranks are granted by hand; level and membership are derived.
create or replace function public.user_ranks_check_kind() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select kind from public.ranks where key = new.rank_key) not in ('program', 'staff') then
    raise exception 'Rank % is derived automatically and cannot be granted', new.rank_key;
  end if;
  return new;
end $$;
drop trigger if exists user_ranks_check_kind on public.user_ranks;
create trigger user_ranks_check_kind before insert or update of rank_key on public.user_ranks
  for each row execute function public.user_ranks_check_kind();

-- Legacy users.role = admin → staff rank.
insert into public.user_ranks (user_id, rank_key, source)
select id, 'admin', 'migration' from public.users where lower(role) = 'admin'
on conflict (user_id, rank_key) do nothing;

-- ── Derived state ──────────────────────────────────────────────────────────

-- Highest of: personal paid tier (not expired) and Platinum via an active organization.
create or replace function public.user_effective_tier(p_user_id text) returns text
language sql stable security definer set search_path = public as $$
  with personal as (
    select t.key, t.sort_order
    from public.users u
    join public.tiers t on t.key = u.tier
    where u.id = p_user_id and (u.tier_expires is null or u.tier_expires > now())
  ), org as (
    select t.key, t.sort_order
    from public.tiers t
    where t.key = 'platinum' and exists (
      select 1 from public.organization_members m
      join public.organizations o on o.id = m.org_id
      where m.user_id = p_user_id and m.removed_at is null
        and o.status = 'active'
        and o.contract_start <= current_date
        and (o.contract_end is null or o.contract_end >= current_date)
    )
  )
  select coalesce(
    (select key from (select * from personal union all select * from org) x order by sort_order desc limit 1),
    'free'
  );
$$;

-- Every valid rank of the user, highest priority first.
create or replace function public.user_rank_keys(p_user_id text) returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(key order by priority desc), '{}') from (
    -- current level rank only
    (select r.key, r.priority from public.ranks r, public.users u
      where u.id = p_user_id and r.kind = 'level' and r.min_level <= greatest(u.level, 1)
      order by r.min_level desc limit 1)
    union all
    select r.key, r.priority from public.ranks r
      where r.kind = 'membership' and r.tier_key = public.user_effective_tier(p_user_id)
    union all
    select r.key, r.priority from public.user_ranks ur join public.ranks r on r.key = ur.rank_key
      where ur.user_id = p_user_id and ur.revoked_at is null
        and (ur.expires_at is null or ur.expires_at > now())
  ) x;
$$;

-- Union of permissions: every level rank reached, every membership rank up to
-- the effective tier (tiers are cumulative), granted ranks, organization roles
-- and the organization's contracted modules.
create or replace function public.user_permissions(p_user_id text) returns text[]
language sql stable security definer set search_path = public as $$
  with eff as (
    select t.sort_order from public.tiers t where t.key = public.user_effective_tier(p_user_id)
  ), perms as (
    select unnest(r.permissions) p from public.ranks r, public.users u
      where u.id = p_user_id and r.kind = 'level' and r.min_level <= greatest(u.level, 1)
    union
    select unnest(r.permissions) from public.ranks r join public.tiers t on t.key = r.tier_key, eff
      where r.kind = 'membership' and t.sort_order <= eff.sort_order and t.sort_order > 0
    union
    select unnest(r.permissions) from public.user_ranks ur join public.ranks r on r.key = ur.rank_key
      where ur.user_id = p_user_id and ur.revoked_at is null
        and (ur.expires_at is null or ur.expires_at > now())
    union
    select unnest(case m.role
        when 'admin' then array['org.manage_members', 'org.view_reports', 'org.manage_classes', 'org.view_class_progress']
        when 'teacher' then array['org.manage_classes', 'org.view_class_progress']
        else array[]::text[] end
      || array(select 'org.' || x from unnest(o.modules) x))
      from public.organization_members m join public.organizations o on o.id = m.org_id
      where m.user_id = p_user_id and m.removed_at is null and o.status = 'active'
        and o.contract_start <= current_date
        and (o.contract_end is null or o.contract_end >= current_date)
  )
  select coalesce(array_agg(distinct p order by p), '{}') from perms where p is not null;
$$;

revoke all on function public.user_effective_tier(text) from public, anon, authenticated;
revoke all on function public.user_rank_keys(text) from public, anon, authenticated;
revoke all on function public.user_permissions(text) from public, anon, authenticated;
revoke all on function public.user_ranks_check_kind() from public, anon, authenticated;
grant execute on function public.user_effective_tier(text) to service_role;
grant execute on function public.user_rank_keys(text) to service_role;
grant execute on function public.user_permissions(text) to service_role;
