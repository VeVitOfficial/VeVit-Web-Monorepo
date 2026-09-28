-- 024: VeVit Services – hledání a lokalita.
-- Podkategorie s ikonami, typ zakázky a rozpočtu, spěchá, souřadnice obce
-- (vzdálenost), kraj, normalizovaný text pro hledání bez diakritiky,
-- zobrazení, uložená hledání (hlídací pes), záložky, přečtení zpráv.
-- Stejně jako 023: přístup jen přes Next.js se service klíčem.

-- ── Kategorie: hierarchie + ikony ───────────────────────────────────────────
alter table public.services_categories
  add column if not exists parent_slug text references public.services_categories(slug),
  add column if not exists icon text not null default 'layers',
  add column if not exists description_cs text not null default '';

insert into public.services_categories (slug, name_cs, name_en, sort_order, icon, description_cs) values
  ('web-it', 'Weby a IT', 'Web & IT', 10, 'code', 'Weby, e-shopy, aplikace a IT podpora'),
  ('grafika', 'Grafika a design', 'Graphics & design', 20, 'palette', 'Loga, tiskoviny, UI a ilustrace'),
  ('marketing', 'Marketing a sítě', 'Marketing & social', 30, 'megaphone', 'Sociální sítě, SEO, reklama'),
  ('foto-video', 'Foto a video', 'Photo & video', 40, 'camera', 'Focení, natáčení a střih'),
  ('texty', 'Texty a překlady', 'Writing & translation', 50, 'pen-line', 'Copywriting, překlady, korektury'),
  ('doucovani', 'Doučování a kurzy', 'Tutoring & lessons', 60, 'graduation-cap', 'Škola, jazyky, hudba, programování'),
  ('remesla', 'Řemesla a opravy', 'Trades & repairs', 70, 'hammer', 'Elektro, voda, malování, drobné opravy'),
  ('domacnost', 'Domácnost a zahrada', 'Home & garden', 80, 'house', 'Úklid, zahrada, stěhování, hlídání'),
  ('auto-doprava', 'Auto a doprava', 'Car & transport', 90, 'car', 'Opravy aut, přeprava, kurýr'),
  ('administrativa', 'Účetnictví a administrativa', 'Accounting & admin', 100, 'briefcase', 'Účetnictví, právo, asistence'),
  ('akce', 'Akce a zábava', 'Events & entertainment', 110, 'party-popper', 'DJ, catering, organizace akcí'),
  ('zdravi-krasa', 'Zdraví a krása', 'Health & beauty', 120, 'heart-pulse', 'Kadeřnictví, masáže, trenéři'),
  ('ostatni', 'Ostatní', 'Other', 900, 'layers', 'Vše, co jinam nepatří')
on conflict (slug) do update set
  name_cs = excluded.name_cs, name_en = excluded.name_en, sort_order = excluded.sort_order,
  icon = excluded.icon, description_cs = excluded.description_cs, parent_slug = null;

insert into public.services_categories (slug, parent_slug, name_cs, name_en, sort_order) values
  ('tvorba-webu', 'web-it', 'Tvorba webu', 'Websites', 11),
  ('eshopy', 'web-it', 'E-shopy', 'E-shops', 12),
  ('aplikace', 'web-it', 'Aplikace a software', 'Apps & software', 13),
  ('it-podpora', 'web-it', 'IT podpora a opravy PC', 'IT support', 14),
  ('logo-identita', 'grafika', 'Logo a vizuální identita', 'Logo & branding', 21),
  ('tiskoviny', 'grafika', 'Tiskoviny a plakáty', 'Print design', 22),
  ('ui-design', 'grafika', 'UI/UX design', 'UI/UX design', 23),
  ('ilustrace', 'grafika', 'Ilustrace a 3D', 'Illustration & 3D', 24),
  ('socialni-site', 'marketing', 'Správa sociálních sítí', 'Social media', 31),
  ('seo-ppc', 'marketing', 'SEO a PPC reklama', 'SEO & ads', 32),
  ('fotografie', 'foto-video', 'Fotografie', 'Photography', 41),
  ('video', 'foto-video', 'Natáčení a střih videa', 'Video', 42),
  ('copywriting', 'texty', 'Copywriting a články', 'Copywriting', 51),
  ('preklady', 'texty', 'Překlady', 'Translation', 52),
  ('korektury', 'texty', 'Korektury', 'Proofreading', 53),
  ('skolni-predmety', 'doucovani', 'Školní předměty', 'School subjects', 61),
  ('jazyky', 'doucovani', 'Jazyky', 'Languages', 62),
  ('hudba', 'doucovani', 'Hudba a nástroje', 'Music lessons', 63),
  ('programovani-vyuka', 'doucovani', 'Programování', 'Coding lessons', 64),
  ('elektrikar', 'remesla', 'Elektrikář', 'Electrician', 71),
  ('instalater', 'remesla', 'Instalatér a topenář', 'Plumber', 72),
  ('malir', 'remesla', 'Malíř a natěrač', 'Painter', 73),
  ('hodinovy-manzel', 'remesla', 'Hodinový manžel', 'Handyman', 74),
  ('stavebni-prace', 'remesla', 'Stavební práce', 'Construction', 75),
  ('uklid', 'domacnost', 'Úklid', 'Cleaning', 81),
  ('zahrada', 'domacnost', 'Zahrada', 'Garden', 82),
  ('stehovani', 'domacnost', 'Stěhování a odvoz', 'Moving', 83),
  ('hlidani-deti', 'domacnost', 'Hlídání dětí', 'Babysitting', 84),
  ('zvirata', 'domacnost', 'Péče o zvířata', 'Pet care', 85),
  ('opravy-aut', 'auto-doprava', 'Opravy aut', 'Car repairs', 91),
  ('preprava', 'auto-doprava', 'Přeprava a kurýr', 'Transport & courier', 92),
  ('ucetnictvi', 'administrativa', 'Účetnictví a daně', 'Accounting', 101),
  ('pravni', 'administrativa', 'Právní služby', 'Legal', 102),
  ('asistence', 'administrativa', 'Virtuální asistence', 'Virtual assistant', 103),
  ('dj-hudba', 'akce', 'DJ a hudba na akce', 'DJ & live music', 111),
  ('catering', 'akce', 'Catering', 'Catering', 112),
  ('organizace-akci', 'akce', 'Organizace akcí', 'Event planning', 113),
  ('kadernictvi', 'zdravi-krasa', 'Kadeřnictví a kosmetika', 'Hair & beauty', 121),
  ('masaze', 'zdravi-krasa', 'Masáže', 'Massage', 122),
  ('trener', 'zdravi-krasa', 'Osobní trenér', 'Personal trainer', 123)
on conflict (slug) do update set
  parent_slug = excluded.parent_slug, name_cs = excluded.name_cs, name_en = excluded.name_en,
  sort_order = excluded.sort_order;

-- ── Poptávky ────────────────────────────────────────────────────────────────
alter table public.services_requests
  add column if not exists job_type text not null default 'one_time'
    check (job_type in ('one_time', 'recurring', 'long_term', 'part_time')),
  add column if not exists budget_type text not null default 'fixed'
    check (budget_type in ('fixed', 'hourly', 'negotiable')),
  add column if not exists urgent boolean not null default false,
  add column if not exists city_code int,
  add column if not exists region text not null default '' check (char_length(region) <= 60),
  add column if not exists lat double precision check (lat is null or lat between -90 and 90),
  add column if not exists lng double precision check (lng is null or lng between -180 and 180),
  add column if not exists search_text text not null default '' check (char_length(search_text) <= 4400),
  add column if not exists views int not null default 0,
  add column if not exists prolonged_count int not null default 0;

create index if not exists services_requests_category_idx on public.services_requests (category) where status = 'open';

-- ── Poskytovatelé ───────────────────────────────────────────────────────────
alter table public.services_providers
  add column if not exists hourly_rate int check (hourly_rate is null or hourly_rate between 0 and 100000),
  add column if not exists website text not null default '' check (char_length(website) <= 200),
  add column if not exists city_code int,
  add column if not exists region text not null default '' check (char_length(region) <= 60),
  add column if not exists lat double precision check (lat is null or lat between -90 and 90),
  add column if not exists lng double precision check (lng is null or lng between -180 and 180);

-- ── Uložená hledání (hlídací pes), záložky, přečtení, zobrazení ────────────
create table if not exists public.services_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  query text not null default '' check (char_length(query) <= 1000),
  notify boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists services_saved_searches_user_idx on public.services_saved_searches (user_id, created_at desc);
create index if not exists services_saved_searches_notify_idx on public.services_saved_searches (created_at) where notify;

create table if not exists public.services_bookmarks (
  user_id text not null references public.users(id) on delete cascade,
  request_id uuid not null references public.services_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);

create table if not exists public.services_offer_reads (
  offer_id uuid not null references public.services_offers(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  last_read_message_id bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (offer_id, user_id)
);

create table if not exists public.services_request_views (
  request_id uuid not null references public.services_requests(id) on delete cascade,
  viewer text not null check (char_length(viewer) <= 64),
  day date not null default current_date,
  primary key (request_id, viewer, day)
);
create index if not exists services_request_views_day_idx on public.services_request_views (day);

alter table public.services_saved_searches enable row level security;
alter table public.services_bookmarks enable row level security;
alter table public.services_offer_reads enable row level security;
alter table public.services_request_views enable row level security;
revoke all on public.services_saved_searches, public.services_bookmarks, public.services_offer_reads,
  public.services_request_views from anon, authenticated;

-- ── Funkce ──────────────────────────────────────────────────────────────────

-- Hledání otevřených poptávek. Slova (p_words) posílá aplikace už normalizovaná
-- (malá písmena, bez diakritiky), každé musí být v názvu nebo popisu.
-- Vrací id v pořadí řazení + vzdálenost a počet nabídek; řádky dotáhne aplikace.
create or replace function public.services_search_requests(
  p_words text[] default null,
  p_categories text[] default null,
  p_job_types text[] default null,
  p_region text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km int default null,
  p_include_remote boolean default true,
  p_remote_only boolean default false,
  p_budget_min int default null,
  p_posted_days int default null,
  p_no_offers boolean default false,
  p_urgent boolean default false,
  p_sort text default 'newest',
  p_limit int default 20,
  p_offset int default 0
) returns table (id uuid, distance_km double precision, offer_count int, total_count bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select r.id, r.created_at, r.deadline, r.budget_min, r.budget_max, r.remote,
      case when p_lat is not null and p_lng is not null and r.lat is not null and r.lng is not null then
        6371.0 * 2 * asin(least(1.0, sqrt(power(sin(radians(r.lat - p_lat) / 2), 2)
          + cos(radians(p_lat)) * cos(radians(r.lat)) * power(sin(radians(r.lng - p_lng) / 2), 2))))
      end as distance_km,
      (select count(*) from services_offers o where o.request_id = r.id and o.status <> 'withdrawn')::int as offer_count
    from services_requests r
    where r.status = 'open' and r.expires_at >= now()
      and (p_categories is null or r.category = any (p_categories))
      and (p_job_types is null or r.job_type = any (p_job_types))
      and (not p_remote_only or r.remote)
      and (p_region is null or r.region = p_region or (p_include_remote and r.remote))
      and (p_budget_min is null or greatest(coalesce(r.budget_max, 0), coalesce(r.budget_min, 0)) >= p_budget_min)
      and (p_posted_days is null or r.created_at >= now() - make_interval(days => p_posted_days))
      and (not p_urgent or r.urgent)
      and (p_words is null or not exists (
        select 1 from unnest(p_words) as w(word)
        where position(w.word in case when r.search_text <> '' then r.search_text
          else lower(r.title || ' ' || r.description) end) = 0
      ))
  ), filtered as (
    select * from base
    where (p_radius_km is null or p_lat is null
        or (base.distance_km is not null and base.distance_km <= p_radius_km)
        or (p_include_remote and base.remote))
      and (not p_no_offers or base.offer_count = 0)
  )
  select f.id, f.distance_km, f.offer_count, count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'distance' then f.distance_km end asc nulls last,
    case when p_sort = 'budget' then nullif(greatest(coalesce(f.budget_max, 0), coalesce(f.budget_min, 0)), 0) end desc nulls last,
    case when p_sort = 'deadline' then f.deadline end asc nulls last,
    case when p_sort = 'offers' then f.offer_count end asc,
    f.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50)) offset greatest(0, coalesce(p_offset, 0));
$$;

-- Počty otevřených poptávek podle (pod)kategorie pro dlaždice a filtry.
create or replace function public.services_category_counts()
returns table (category text, open_count int)
language sql stable security definer set search_path = public as $$
  select category, count(*)::int from services_requests
  where status = 'open' and expires_at >= now()
  group by category;
$$;

-- Nepřečtené zprávy uživatele po nabídkách (jako zadavatel i poskytovatel).
create or replace function public.services_unread_counts(p_user_id text)
returns table (offer_id uuid, request_id uuid, unread int)
language sql stable security definer set search_path = public as $$
  select o.id, o.request_id, count(m.id)::int
  from services_offers o
  join services_requests r on r.id = o.request_id
  join services_messages m on m.offer_id = o.id and m.sender_id <> p_user_id and not m.hidden
  left join services_offer_reads rd on rd.offer_id = o.id and rd.user_id = p_user_id
  where (o.provider_id = p_user_id or r.author_id = p_user_id)
    and m.id > coalesce(rd.last_read_message_id, 0)
  group by o.id, o.request_id;
$$;

-- Označení konverzace za přečtenou (nikdy nesnižuje značku).
create or replace function public.services_mark_read(p_user_id text, p_offer_id uuid, p_message_id bigint)
returns void language sql security definer set search_path = public as $$
  insert into services_offer_reads (offer_id, user_id, last_read_message_id)
  values (p_offer_id, p_user_id, p_message_id)
  on conflict (offer_id, user_id) do update
    set last_read_message_id = greatest(services_offer_reads.last_read_message_id, excluded.last_read_message_id),
        updated_at = now();
$$;

-- Jedno zobrazení za návštěvníka a den.
create or replace function public.services_register_view(p_request_id uuid, p_viewer text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into services_request_views (request_id, viewer) values (p_request_id, p_viewer)
  on conflict do nothing;
  if found then
    update services_requests set views = views + 1 where id = p_request_id;
  end if;
end $$;

-- Vypršení neobsazených poptávek + úklid starých záznamů zobrazení.
create or replace function public.services_expire_requests()
returns int language sql security definer set search_path = public as $$
  with expired as (
    update services_requests set status = 'expired', updated_at = now()
    where status = 'open' and expires_at < now()
    returning 1
  ), pruned as (
    delete from services_request_views where day < current_date - 60
    returning 1
  )
  select count(*)::int from expired;
$$;

revoke all on function public.services_search_requests(text[], text[], text[], text, double precision, double precision, int, boolean, boolean, int, int, boolean, boolean, text, int, int) from public, anon, authenticated;
revoke all on function public.services_category_counts() from public, anon, authenticated;
revoke all on function public.services_unread_counts(text) from public, anon, authenticated;
revoke all on function public.services_mark_read(text, uuid, bigint) from public, anon, authenticated;
revoke all on function public.services_register_view(uuid, text) from public, anon, authenticated;
revoke all on function public.services_expire_requests() from public, anon, authenticated;

grant execute on function
  public.services_search_requests(text[], text[], text[], text, double precision, double precision, int, boolean, boolean, int, int, boolean, boolean, text, int, int),
  public.services_category_counts(),
  public.services_unread_counts(text),
  public.services_mark_read(text, uuid, bigint),
  public.services_register_view(uuid, text),
  public.services_expire_requests()
to service_role;
