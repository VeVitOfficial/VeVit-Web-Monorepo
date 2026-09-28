-- 023: VeVit Services MVP (plán: VeVit Services — plán, fáze 0 + 1).
-- Tržiště poptávek: poptávka → nabídky → výběr → zprávy → dokončení → hodnocení.
-- Přístup jen přes Next.js routy se service klíčem; klientské role nemají
-- žádná práva (stejně jako migrace 021). Stavové přechody hlídají funkce níže,
-- aby šlo nabídku přijmout jen jednou a hodnotit jen dokončenou zakázku.

create table if not exists public.services_categories (
  slug text primary key,
  name_cs text not null,
  name_en text not null,
  sort_order int not null default 0,
  active boolean not null default true
);

insert into public.services_categories (slug, name_cs, name_en, sort_order) values
  ('web-it', 'Weby a IT', 'Web & IT', 10),
  ('grafika', 'Grafika a design', 'Graphics & design', 20),
  ('doucovani', 'Doučování', 'Tutoring', 30),
  ('texty', 'Texty a překlady', 'Writing & translation', 40),
  ('domacnost', 'Domácnost a zahrada', 'Home & garden', 50),
  ('ostatni', 'Ostatní', 'Other', 90)
on conflict (slug) do nothing;

create table if not exists public.services_providers (
  user_id text primary key references public.users(id) on delete cascade,
  headline text not null check (char_length(headline) between 3 and 120),
  bio text not null default '' check (char_length(bio) <= 2000),
  categories text[] not null default '{}',
  city text not null default '' check (char_length(city) <= 80),
  radius_km int not null default 0 check (radius_km between 0 and 500),
  remote boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services_requests (
  id uuid primary key default gen_random_uuid(),
  author_id text not null references public.users(id) on delete cascade,
  category text not null references public.services_categories(slug),
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 20 and 4000),
  city text not null default '' check (char_length(city) <= 80),
  remote boolean not null default false,
  budget_min int check (budget_min is null or budget_min between 0 and 10000000),
  budget_max int check (budget_max is null or budget_max between 0 and 10000000),
  deadline date,
  status text not null default 'open' check (status in ('open', 'assigned', 'completed', 'cancelled', 'expired')),
  accepted_offer_id uuid,
  author_done boolean not null default false,
  provider_done boolean not null default false,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_min is null or budget_max is null or budget_min <= budget_max),
  check (remote or city <> '')
);
create index if not exists services_requests_open_idx on public.services_requests (status, created_at desc);
create index if not exists services_requests_author_idx on public.services_requests (author_id, created_at desc);

create table if not exists public.services_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.services_requests(id) on delete cascade,
  provider_id text not null references public.users(id) on delete cascade,
  price int not null check (price between 0 and 10000000),
  delivery text not null default '' check (char_length(delivery) <= 120),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'sent' check (status in ('sent', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, provider_id)
);
create index if not exists services_offers_provider_idx on public.services_offers (provider_id, created_at desc);

alter table public.services_requests
  drop constraint if exists services_requests_accepted_offer_fk;
alter table public.services_requests
  add constraint services_requests_accepted_offer_fk foreign key (accepted_offer_id) references public.services_offers(id);

create table if not exists public.services_messages (
  id bigint generated always as identity primary key,
  offer_id uuid not null references public.services_offers(id) on delete cascade,
  sender_id text not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists services_messages_offer_idx on public.services_messages (offer_id, id);

create table if not exists public.services_reviews (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.services_requests(id) on delete cascade,
  author_id text not null references public.users(id) on delete cascade,
  subject_id text not null references public.users(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  unique (request_id, author_id)
);
create index if not exists services_reviews_subject_idx on public.services_reviews (subject_id, created_at desc);

create table if not exists public.services_reports (
  id bigint generated always as identity primary key,
  reporter_id text not null references public.users(id) on delete cascade,
  target_kind text not null check (target_kind in ('request', 'provider', 'message', 'offer')),
  target_id text not null check (char_length(target_id) <= 64),
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, target_kind, target_id)
);

-- Klienti (anon/authenticated) nemají k Services žádný přímý přístup.
alter table public.services_categories enable row level security;
alter table public.services_providers enable row level security;
alter table public.services_requests enable row level security;
alter table public.services_offers enable row level security;
alter table public.services_messages enable row level security;
alter table public.services_reviews enable row level security;
alter table public.services_reports enable row level security;
revoke all on public.services_categories, public.services_providers, public.services_requests,
  public.services_offers, public.services_messages, public.services_reviews, public.services_reports
  from anon, authenticated;

-- Přijetí nabídky: jen autor, jen otevřená poptávka, jen jednou (zámek řádku).
create or replace function public.services_accept_offer(p_user_id text, p_offer_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_offer services_offers%rowtype;
  v_request services_requests%rowtype;
begin
  select * into v_offer from services_offers where id = p_offer_id for update;
  if not found or v_offer.status <> 'sent' then return 'offer_unavailable'; end if;
  select * into v_request from services_requests where id = v_offer.request_id for update;
  if v_request.author_id <> p_user_id then return 'forbidden'; end if;
  if v_request.status <> 'open' or v_request.expires_at < now() then return 'request_closed'; end if;
  update services_offers set status = 'accepted', updated_at = now() where id = p_offer_id;
  update services_offers set status = 'rejected', updated_at = now()
    where request_id = v_request.id and id <> p_offer_id and status = 'sent';
  update services_requests set status = 'assigned', accepted_offer_id = p_offer_id, updated_at = now()
    where id = v_request.id;
  return 'ok';
end $$;

-- Potvrzení dokončení: každá strana zvlášť; obě → completed.
create or replace function public.services_mark_done(p_user_id text, p_request_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_request services_requests%rowtype;
  v_provider text;
begin
  select * into v_request from services_requests where id = p_request_id for update;
  if not found or v_request.status <> 'assigned' then return 'not_assigned'; end if;
  select provider_id into v_provider from services_offers where id = v_request.accepted_offer_id;
  if p_user_id = v_request.author_id then
    update services_requests set author_done = true, updated_at = now() where id = p_request_id;
  elsif p_user_id = v_provider then
    update services_requests set provider_done = true, updated_at = now() where id = p_request_id;
  else
    return 'forbidden';
  end if;
  update services_requests set status = 'completed', updated_at = now()
    where id = p_request_id and author_done and provider_done;
  return (select case when status = 'completed' then 'completed' else 'ok' end from services_requests where id = p_request_id);
end $$;

-- Vypršení neobsazených poptávek (volá se líně při čtení seznamu).
create or replace function public.services_expire_requests()
returns int language sql security definer set search_path = public as $$
  with expired as (
    update services_requests set status = 'expired', updated_at = now()
    where status = 'open' and expires_at < now()
    returning 1
  )
  select count(*)::int from expired;
$$;

revoke all on function public.services_accept_offer(text, uuid) from public, anon, authenticated;
revoke all on function public.services_mark_done(text, uuid) from public, anon, authenticated;
revoke all on function public.services_expire_requests() from public, anon, authenticated;

insert into public.xp_rules (source, amount, max_amount, daily_cap, bonus_applies) values
  ('services.request_created', 20, null, 40, true),
  ('services.job_completed', 100, null, 300, true),
  ('services.review', 15, null, 45, true)
on conflict (source) do nothing;

grant execute on function public.services_accept_offer(text, uuid), public.services_mark_done(text, uuid),
  public.services_expire_requests() to service_role;
