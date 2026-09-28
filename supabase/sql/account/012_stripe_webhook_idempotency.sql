-- Stripe webhook ledger and server-owned price catalogue.
-- Read-only preflight performed before this migration: none of these tables or
-- tier constraints existed and premium_subscriptions contained zero rows.

create table if not exists public.stripe_webhook_events (
  event_id       text primary key,
  event_type     text not null,
  payload_sha256 text not null,
  object_id      text,
  status         text not null default 'processing'
    check (status in ('processing', 'completed', 'ignored', 'failed')),
  attempts       integer not null default 1 check (attempts > 0),
  error_code     text,
  received_at    timestamptz not null default now(),
  processed_at   timestamptz
);

alter table public.stripe_webhook_events enable row level security;
alter table public.stripe_webhook_events force row level security;
revoke all on public.stripe_webhook_events from anon, authenticated, public;

create table if not exists public.premium_price_catalog (
  stripe_price_id text primary key,
  stripe_product_id text not null,
  tier             text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  billing_cycle    text not null check (billing_cycle in ('monthly', 'yearly')),
  currency         text not null check (currency = lower(currency)),
  amount_minor     integer not null check (amount_minor > 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.premium_price_catalog enable row level security;
alter table public.premium_price_catalog force row level security;
revoke all on public.premium_price_catalog from anon, authenticated, public;

insert into public.premium_price_catalog
  (stripe_price_id, stripe_product_id, tier, billing_cycle, currency, amount_minor)
values
  ('price_1TJ1n9CpR9PsJrSddMEHM52s', 'prod_UHazYyb3OOXW4G', 'bronze',   'monthly', 'czk',    4900),
  ('price_1TJ1n9CpR9PsJrSdUzepWO6o', 'prod_UHazYyb3OOXW4G', 'bronze',   'yearly',  'czk',   49000),
  ('price_1TJ1oBCpR9PsJrSd10t7APe1', 'prod_UHb0XNxQc5lkIp', 'silver',   'monthly', 'czk',    9900),
  ('price_1TJ1ogCpR9PsJrSd4An6lt4r', 'prod_UHb0XNxQc5lkIp', 'silver',   'yearly',  'czk',   99000),
  ('price_1TJ1q6CpR9PsJrSdqUWTcMgZ', 'prod_UHb2LCL1ndTTfc', 'gold',     'monthly', 'czk',   19900),
  ('price_1TJ1q6CpR9PsJrSdOQ96Fncv', 'prod_UHb2LCL1ndTTfc', 'gold',     'yearly',  'czk',  199000),
  ('price_1TbiDMCpR9PsJrSdffJpVK1e', 'prod_Uau1g8S2PUUTxy', 'platinum', 'monthly', 'czk',  149900),
  ('price_1TbiDMCpR9PsJrSdRmMFeL4e', 'prod_Uau1g8S2PUUTxy', 'platinum', 'yearly',  'czk', 1499000)
on conflict (stripe_price_id) do update set
  stripe_product_id = excluded.stripe_product_id,
  tier = excluded.tier,
  billing_cycle = excluded.billing_cycle,
  currency = excluded.currency,
  amount_minor = excluded.amount_minor,
  active = true,
  updated_at = now();

create unique index if not exists premium_subscriptions_payment_id_uidx
  on public.premium_subscriptions (payment_id)
  where payment_id is not null and payment_id <> '';

create or replace function public.claim_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_payload_sha256 text,
  p_object_id text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.stripe_webhook_events%rowtype;
begin
  insert into public.stripe_webhook_events
    (event_id, event_type, payload_sha256, object_id)
  values
    (p_event_id, p_event_type, p_payload_sha256, p_object_id)
  on conflict (event_id) do nothing;

  if found then
    return 'claimed';
  end if;

  select * into existing
    from public.stripe_webhook_events
   where event_id = p_event_id
   for update;

  if existing.payload_sha256 <> p_payload_sha256
     or existing.event_type <> p_event_type then
    return 'conflict';
  end if;
  if existing.status in ('completed', 'ignored') then
    return 'duplicate';
  end if;
  if existing.status = 'processing'
     and existing.received_at > now() - interval '5 minutes' then
    return 'busy';
  end if;

  update public.stripe_webhook_events
     set status = 'processing', attempts = attempts + 1, error_code = null,
         received_at = now(), processed_at = null
   where event_id = p_event_id;
  return 'claimed';
end;
$$;

revoke all on function public.claim_stripe_webhook_event(text, text, text, text)
  from anon, authenticated, public;
grant execute on function public.claim_stripe_webhook_event(text, text, text, text)
  to service_role;
