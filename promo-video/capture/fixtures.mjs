// Ukázková data pro natáčení. Všechny osoby, firmy, poptávky i hodnocení jsou
// smyšlené; e-maily jsou na rezervované doméně example.com, telefony nejsou.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Přihlašovací cookie demo účtu (__vvsession). 64 hex znaků, jen pro lokální mock.
export const DEMO_SESSION_TOKEN = createHash("sha256").update("vevit-promo-demo-session").digest("hex");
export const DEMO_USER_ID = "u-demo-klara";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms) => new Date(Date.now() - ms).toISOString();
const inFuture = (ms) => new Date(Date.now() + ms).toISOString();

function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Kategorie bereme přímo z migrace 024, ať odpovídají produkci.
function categoriesFromMigration() {
  const sqlPath = fileURLToPath(new URL("../../supabase/sql/account/024_services_search.sql", import.meta.url));
  const sql = readFileSync(sqlPath, "utf8");
  const rows = [];
  for (const match of sql.matchAll(/^\s*\('([a-z-]+)', '([^']+)', '([^']+)', (\d+), '([a-z-]+)', '([^']*)'\)/gm)) {
    rows.push({ slug: match[1], name_cs: match[2], name_en: match[3], sort_order: Number(match[4]), icon: match[5], description_cs: match[6], parent_slug: null, active: true });
  }
  for (const match of sql.matchAll(/^\s*\('([a-z-]+)', '([a-z-]+)', '([^']+)', '([^']+)', (\d+)\)/gm)) {
    rows.push({ slug: match[1], parent_slug: match[2], name_cs: match[3], name_en: match[4], sort_order: Number(match[5]), icon: "layers", description_cs: "", active: true });
  }
  return rows;
}

const PEOPLE = [
  // id, celé jméno, přezdívka, registrace před (dny)
  [DEMO_USER_ID, "Klára Dvořáková", "klara.d", 240],
  ["u-martin", "Martin Holub", "Martin H.", 410],
  ["u-pixelka", "Tereza Malá", "Studio Pixelka", 380],
  ["u-petra", "Petra Svobodová", "Petra S.", 300],
  ["u-ondrej", "Ondřej Veselý", "Ondřej V.", 520],
  ["u-lucie", "Lucie Marková", "Lucie M.", 190],
  ["u-jakub", "Jakub Toman", "Jakub T.", 260],
  ["u-radek", "Radek Šimek", "Elektro Šimek", 610],
  ["u-filip", "Filip Beneš", "Filip B.", 150],
  ["u-eva", "Eva Kratochvílová", "Eva K.", 90],
  ["u-tomas", "Tomáš Bureš", "Tomáš B.", 75],
  ["u-hana", "Hana Pokorná", "Hana P.", 60],
  ["u-vojta", "Vojtěch Kříž", "Vojta K.", 45],
];

const CITY = {
  praha: { city: "Praha", city_code: 554782, region: "praha", lat: 50.0835, lng: 14.4341 },
  brno: { city: "Brno", city_code: 582786, region: "jihomoravsky", lat: 49.1951, lng: 16.608 },
  plzen: { city: "Plzeň", city_code: 554791, region: "plzensky", lat: 49.7475, lng: 13.3776 },
  olomouc: { city: "Olomouc", city_code: 500496, region: "olomoucky", lat: 49.5938, lng: 17.2509 },
  liberec: { city: "Liberec", city_code: 563889, region: "liberecky", lat: 50.7663, lng: 15.0543 },
  ostrava: { city: "Ostrava", city_code: 554821, region: "moravskoslezsky", lat: 49.8347, lng: 18.282 },
  remote: { city: "", city_code: null, region: null, lat: null, lng: null },
};

// id, autor, kategorie, název, popis, místo, na dálku, rozpočet, typ zakázky, typ rozpočtu, spěchá, stáří
const REQUESTS = [
  ["11111111-1111-4111-8111-000000000001", DEMO_USER_ID, "elektrikar", "Výměna zásuvek a vypínačů v bytě 2+kk",
    "V bytě po rekonstrukci potřebuji vyměnit 9 zásuvek a 6 vypínačů za nové (bílé, řada Tango). Materiál mám koupený. Byt je ve 3. patře s výtahem, termín ideálně během příštího týdne.",
    "praha", false, [2500, 4500], "one_time", "fixed", true, 3 * HOUR],
  ["11111111-1111-4111-8111-000000000002", "u-eva", "logo-identita", "Logo a vizitky pro novou kavárnu",
    "Otevíráme malou kavárnu s vlastní pražírnou. Hledáme logo (varianta na tmavé i světlé pozadí), vizitky a jednoduchý manuál barev a písma.",
    "olomouc", true, [6000, 10000], "one_time", "fixed", false, 6 * HOUR],
  ["11111111-1111-4111-8111-000000000003", "u-tomas", "skolni-predmety", "Doučování matematiky k přijímačkám",
    "Dcera jde v 9. třídě na přijímačky na gymnázium. Hledáme doučování matematiky 2× týdně po 60 minutách, ideálně u nás doma v Brně – Žabovřeskách.",
    "brno", false, [350, 450], "recurring", "hourly", false, 20 * HOUR],
  ["11111111-1111-4111-8111-000000000004", "u-hana", "tvorba-webu", "Web pro malou truhlářskou dílnu",
    "Potřebujeme jednoduchý web o 4–5 stránkách: kdo jsme, ukázky práce (galerie), ceník a kontaktní formulář. Texty a fotky dodáme.",
    "remote", true, [15000, 25000], "one_time", "fixed", false, 1 * DAY + 2 * HOUR],
  ["11111111-1111-4111-8111-000000000005", "u-vojta", "stehovani", "Stěhování 2+kk v rámci Plzně",
    "Stěhování z Lochotína na Slovany, cca 20 krabic, pračka, lednice, rozložená postel a skříň. Třetí patro bez výtahu, cílové místo přízemí.",
    "plzen", false, [4000, 7000], "one_time", "fixed", false, 1 * DAY + 8 * HOUR],
  ["11111111-1111-4111-8111-000000000006", "u-filip", "uklid", "Pravidelný úklid kanceláře 1× týdně",
    "Kancelář 80 m² (4 místnosti, kuchyňka, WC). Úklid každý pátek odpoledne, vysávání, podlahy, kuchyňka a koše. Úklidové prostředky zajistíme.",
    "praha", false, [1200, 1600], "recurring", "fixed", false, 2 * DAY],
  ["11111111-1111-4111-8111-000000000007", "u-eva", "fotografie", "Fotograf na rodinnou oslavu",
    "Sobotní oslava 60. narozenin v restauraci, cca 3 hodiny focení, 40 lidí. Chceme hlavně přirozené momentky a pár skupinových fotek.",
    "liberec", false, [3500, 6000], "one_time", "fixed", false, 3 * DAY],
  ["11111111-1111-4111-8111-000000000008", "u-tomas", "preklady", "Překlad e-shopu do angličtiny",
    "Překlad textů e-shopu s ručně šitými batohy: 40 produktových popisů, obchodní podmínky a stránka O nás. Celkem asi 9 normostran.",
    "remote", true, [5000, 8000], "one_time", "fixed", false, 4 * DAY],
  ["11111111-1111-4111-8111-000000000009", "u-hana", "hodinovy-manzel", "Montáž kuchyňské linky a polic",
    "Hledám šikovného člověka na smontování kuchyňské linky z Ikey (6 skříněk) a pověšení 4 polic do panelu. Nářadí mám jen základní.",
    "ostrava", false, [2000, 3500], "one_time", "fixed", false, 5 * DAY],
];

// Nabídky na poptávku demo uživatelky (elektrikář) + pár dalších.
const OFFERS = [
  ["22222222-2222-4222-8222-000000000001", "11111111-1111-4111-8111-000000000001", "u-radek", 3200, "Úterý 8:00, cca 4 hodiny",
    "Dobrý den, výměnu zvládnu za jedno dopoledne. V ceně je kontrola obvodů a revizní zpráva k vyměněným zásuvkám.", 2 * HOUR],
  ["22222222-2222-4222-8222-000000000002", "11111111-1111-4111-8111-000000000001", "u-martin", 2800, "Čtvrtek odpoledne",
    "Zdravím, podobné výměny dělám běžně. Stará zařízení odvezu a zlikviduji. Materiál máte, takže počítám jen práci.", 90 * MIN],
  ["22222222-2222-4222-8222-000000000003", "11111111-1111-4111-8111-000000000001", "u-vojta", 3900, "Do 10 dnů",
    "Dobrý den, mohu nabídnout výměnu včetně zapojení do nové krabice tam, kde je potřeba. Ozvěte se, doladíme termín.", 40 * MIN],
  ["22222222-2222-4222-8222-000000000004", "11111111-1111-4111-8111-000000000002", "u-pixelka", 8500, "Návrhy do 7 dnů",
    "Ahoj, pošlu 3 návrhy loga, po výběru dvě kola úprav, vizitky připravím pro tisk a přidám jednostránkový manuál.", 5 * HOUR],
  ["22222222-2222-4222-8222-000000000005", "11111111-1111-4111-8111-000000000004", "u-ondrej", 19000, "3 týdny",
    "Web postavím na rychlém statickém řešení s jednoduchou správou galerie. V ceně je nasazení na vaši doménu a půl roku podpory.", 20 * HOUR],
  ["22222222-2222-4222-8222-000000000006", "11111111-1111-4111-8111-000000000003", "u-petra", 400, "Od příštího týdne",
    "Dobrý den, učím matematiku na ZŠ a na přijímačky připravuji už 6 let. Materiály z CERMATu mám připravené.", 10 * HOUR],
  ["22222222-2222-4222-8222-000000000007", "11111111-1111-4111-8111-000000000006", "u-lucie", 1400, "Každý pátek od 15:00",
    "Dobrý den, kanceláře uklízím pravidelně, mám vlastní vysavač i mopy. Mohu začít hned tento týden.", 30 * HOUR],
];

// Poskytovatelé: user_id, headline, bio, kategorie, město, rádius, na dálku, sazba
const PROVIDERS = [
  ["u-radek", "Elektrikář s revizemi a osvědčením", "Elektroinstalace v bytech a rodinných domech, výměny zásuvek, jističů a osvětlení. Vystavuji revizní zprávy.", ["elektrikar"], "praha", 30, false, 650],
  ["u-pixelka", "Grafické studio – loga a vizuální identita", "Navrhuji loga, obaly a tiskoviny pro malé firmy, kavárny a řemeslníky. Pracuji na dálku po celé ČR.", ["logo-identita", "tiskoviny"], "remote", 0, true, 700],
  ["u-petra", "Doučování matematiky a přípravy na přijímačky", "Učitelka matematiky, přípravy na přijímací zkoušky na SŠ a maturitu. Doučuji u vás doma nebo online.", ["skolni-predmety"], "brno", 15, true, 400],
  ["u-ondrej", "Webové stránky a e-shopy na míru", "Rychlé a přehledné weby pro řemeslníky a malé firmy, včetně správy a hostingu.", ["tvorba-webu", "eshopy"], "remote", 0, true, 900],
  ["u-martin", "Hodinový manžel a drobné opravy", "Montáže nábytku, drobné elektro a instalatérské práce, vrtání a věšení. Vlastní nářadí.", ["hodinovy-manzel", "elektrikar"], "praha", 20, false, 450],
  ["u-lucie", "Úklid domácností a kanceláří", "Pravidelný i jednorázový úklid, mytí oken, úklid po rekonstrukci.", ["uklid"], "praha", 15, false, 300],
  ["u-jakub", "Fotograf – rodinné a firemní akce", "Fotím oslavy, svatby a firemní akce. Upravené fotky dodávám do týdne.", ["fotografie"], "liberec", 60, false, 1200],
];

const REVIEWS = [
  ["u-radek", 5, "Rychlé, čisté a s revizní zprávou. Doporučuji."],
  ["u-radek", 5, "Přišel přesně na čas, vše vysvětlil."],
  ["u-radek", 4, "Kvalitní práce, termín se o den posunul."],
  ["u-martin", 5, "Skříně smontované za dopoledne, super."],
  ["u-martin", 5, "Ochotný a šikovný, určitě znovu."],
  ["u-pixelka", 5, "Logo předčilo očekávání, skvělá komunikace."],
  ["u-pixelka", 5, "Profesionální přístup a rychlé úpravy."],
  ["u-petra", 5, "Syn udělal přijímačky, díky!"],
  ["u-ondrej", 5, "Web je rychlý a vypadá skvěle."],
  ["u-lucie", 5, "Spolehlivá a důkladná."],
  ["u-jakub", 4, "Krásné fotky z oslavy."],
  ["u-vojta", 5, "Rychlá výměna světel, v pohodě."],
];

export function buildFixtures() {
  const users = PEOPLE.map(([id, full_name, nickname, days], index) => ({
    id,
    email: `${nickname.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@example.com`,
    nickname,
    full_name,
    tier: id === DEMO_USER_ID ? "silver" : "free",
    tier_expires: id === DEMO_USER_ID ? inFuture(23 * DAY) : null,
    tier_billing: id === DEMO_USER_ID ? "monthly" : null,
    tier_cancel_at: null,
    role: "user",
    avatar_url: null,
    phone: null,
    phone_e164: null,
    phone_verified_at: index % 3 === 0 ? ago(days * DAY) : null,
    location: id === DEMO_USER_ID ? "Praha" : null,
    birth_date: null,
    bio: id === DEMO_USER_ID ? "Učím se Python a ve volném čase fotím." : null,
    level: id === DEMO_USER_ID ? 12 : 3,
    xp: id === DEMO_USER_ID ? 7240 : 420,
    created_at: ago(days * DAY),
    company_name: null,
    ico: null,
    dic: null,
    billing_address: null,
    language: "cs",
    two_factor_enabled: id === DEMO_USER_ID,
    status: "active",
    onboarding_completed_at: ago(days * DAY),
    // Jen příznak „heslo je nastavené“ pro stránku Zabezpečení; mock nikdy neověřuje hesla.
    password: id === DEMO_USER_ID ? "$2y$12$dummy.promo.mock.hash.not.a.real.password.hash" : null,
  }));

  const sessions = [
    { id: "s-demo-1", user_id: DEMO_USER_ID, token_hash: createHash("sha256").update(DEMO_SESSION_TOKEN).digest("hex"), created_at: ago(2 * HOUR), expires_at: inFuture(60 * DAY), last_seen_at: ago(1 * MIN), revoked_at: null, user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/537.36 Chrome/129.0 Safari/537.36", ip: "192.0.2.10", remember: true },
    { id: "s-demo-2", user_id: DEMO_USER_ID, token_hash: "0".repeat(64), created_at: ago(3 * DAY), expires_at: inFuture(40 * DAY), last_seen_at: ago(5 * HOUR), revoked_at: null, user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1", ip: "198.51.100.23", remember: true },
  ];

  const services_requests = REQUESTS.map(([id, author_id, category, title, description, place, remote, [min, max], job_type, budget_type, urgent, age], index) => ({
    id, author_id, category, title, description,
    ...CITY[place],
    remote,
    budget_min: min,
    budget_max: max,
    deadline: null,
    status: "open",
    accepted_offer_id: null,
    author_done: false,
    provider_done: false,
    expires_at: inFuture(30 * DAY - age),
    created_at: ago(age),
    updated_at: ago(age),
    job_type,
    budget_type,
    urgent,
    views: [48, 31, 22, 67, 19, 25, 14, 12, 9][index] ?? 10,
    prolonged_count: 0,
    search_text: normalize(`${title} ${description}`),
  }));
  // Pár dokončených zakázek, aby statistiky a počty zakázek nebyly nulové.
  for (let index = 0; index < 23; index++) {
    services_requests.push({
      ...services_requests[index % REQUESTS.length],
      id: `33333333-3333-4333-8333-${String(index).padStart(12, "0")}`,
      status: "completed",
      created_at: ago((20 + index * 3) * DAY),
      expires_at: ago(index * DAY),
    });
  }

  const services_offers = OFFERS.map(([id, request_id, provider_id, price, delivery, message, age]) => ({
    id, request_id, provider_id, price, delivery, message, status: "sent", created_at: ago(age), updated_at: ago(age),
  }));
  // Přijaté nabídky u dokončených zakázek (počty dokončených zakázek poskytovatelů).
  const completedProviders = ["u-radek", "u-radek", "u-radek", "u-radek", "u-radek", "u-radek", "u-radek", "u-martin", "u-martin", "u-martin", "u-martin", "u-martin", "u-pixelka", "u-pixelka", "u-pixelka", "u-petra", "u-petra", "u-ondrej", "u-ondrej", "u-lucie", "u-lucie", "u-jakub", "u-jakub"];
  completedProviders.forEach((provider_id, index) => {
    services_offers.push({
      id: `44444444-4444-4444-8444-${String(index).padStart(12, "0")}`,
      request_id: `33333333-3333-4333-8333-${String(index).padStart(12, "0")}`,
      provider_id, price: 2000 + index * 150, delivery: "", message: "Dokončená zakázka.", status: "accepted",
      created_at: ago((20 + index * 3) * DAY), updated_at: ago((20 + index * 3) * DAY),
    });
  });

  const services_providers = PROVIDERS.map(([user_id, headline, bio, categories, place, radius_km, remote, hourly_rate], index) => ({
    user_id, headline, bio, categories, ...CITY[place], radius_km, remote, active: true, hourly_rate, website: null,
    created_at: ago((100 + index * 20) * DAY), updated_at: ago((index + 1) * HOUR),
  }));

  const services_reviews = REVIEWS.map(([subject_id, stars, body], index) => ({
    id: index + 1,
    request_id: `33333333-3333-4333-8333-${String(index).padStart(12, "0")}`,
    author_id: PEOPLE[(index + 9) % PEOPLE.length][0],
    subject_id, stars, body, created_at: ago((10 + index * 4) * DAY),
  }));

  const services_messages = [
    { id: 1, offer_id: "22222222-2222-4222-8222-000000000001", sender_id: DEMO_USER_ID, body: "Dobrý den, stihl byste to i v pondělí ráno?", hidden: false, created_at: ago(70 * MIN) },
    { id: 2, offer_id: "22222222-2222-4222-8222-000000000001", sender_id: "u-radek", body: "Dobrý den, pondělí 8:00 mi vyhovuje. Revizní zprávu pošlu e-mailem.", hidden: false, created_at: ago(55 * MIN) },
  ];

  const services_saved_searches = [
    { id: "55555555-5555-4555-8555-000000000001", user_id: DEMO_USER_ID, name: "Fotografie · Praha + 25 km", query: "kat=fotografie&mesto=554782&okruh=25", notify: true, created_at: ago(12 * DAY), last_notified_at: ago(1 * DAY) },
  ];

  const xpSources = [
    ["edu.lesson_complete", 40, 10, 25 * MIN],
    ["edu.quiz", 60, 15, 50 * MIN],
    ["tools.use", 2, 0, 2 * HOUR],
    ["edu.lesson_complete", 40, 10, 5 * HOUR],
    ["account.daily", 10, 2, 9 * HOUR],
    ["services.request_created", 20, 5, 3 * HOUR],
    ["edu.lesson_complete", 40, 10, 1 * DAY + 2 * HOUR],
    ["account.streak_7", 50, 12, 1 * DAY + 5 * HOUR],
    ["tools.use", 2, 0, 2 * DAY],
    ["edu.quiz", 80, 20, 3 * DAY],
    ["account.2fa", 50, 12, 6 * DAY],
  ];
  const xp_ledger = xpSources.map(([source, base_amount, bonus_amount, age], index) => ({
    id: index + 1, user_id: DEMO_USER_ID, source, base_amount, bonus_amount, created_at: ago(age),
  }));

  const account_activity = [
    { user_id: DEMO_USER_ID, kind: "login", detail: "Přihlášení · Chrome, macOS", created_at: ago(2 * HOUR) },
    { user_id: DEMO_USER_ID, kind: "2fa_enabled", detail: "Zapnuto dvoufázové ověření", created_at: ago(6 * DAY) },
    { user_id: DEMO_USER_ID, kind: "password_change", detail: "Změna hesla", created_at: ago(14 * DAY) },
    { user_id: DEMO_USER_ID, kind: "profile_update", detail: "Úprava profilu", created_at: ago(20 * DAY) },
  ];

  const tiers = [
    { key: "free", sort_order: 0, xp_bonus_pct: 0, ai_daily_limit: 10, store_discount_pct: 0, free_shipping: false, is_public: true },
    { key: "bronze", sort_order: 1, xp_bonus_pct: 10, ai_daily_limit: 50, store_discount_pct: 5, free_shipping: false, is_public: true },
    { key: "silver", sort_order: 2, xp_bonus_pct: 25, ai_daily_limit: 200, store_discount_pct: 10, free_shipping: true, is_public: true },
    { key: "gold", sort_order: 3, xp_bonus_pct: 50, ai_daily_limit: 1000, store_discount_pct: 20, free_shipping: true, is_public: true },
  ];
  const tier_prices = [
    ["bronze", "monthly", 99], ["bronze", "yearly", 990],
    ["silver", "monthly", 199], ["silver", "yearly", 1990],
    ["gold", "monthly", 399], ["gold", "yearly", 3990],
  ].map(([tier, billing_cycle, price_czk]) => ({ tier, billing_cycle, price_czk }));
  const premium_price_catalog = tier_prices.map((row) => ({ tier: row.tier, billing_cycle: row.billing_cycle, stripe_price_id: `price_dummy_${row.tier}_${row.billing_cycle}` }));
  const premium_subscriptions = [
    { id: "sub-demo", user_id: DEMO_USER_ID, tier: "silver", billing_cycle: "monthly", status: "active", started_at: ago(37 * DAY), current_period_end: inFuture(23 * DAY), cancel_at: null, created_at: ago(37 * DAY) },
  ];

  return {
    users,
    sessions,
    services_categories: categoriesFromMigration(),
    services_requests,
    services_offers,
    services_providers,
    services_reviews,
    services_messages,
    services_saved_searches,
    services_bookmarks: [],
    services_reports: [],
    xp_ledger,
    account_activity,
    tiers,
    tier_prices,
    premium_price_catalog,
    premium_subscriptions,
    user_ranks: [{ user_id: DEMO_USER_ID, rank_key: "betatester", granted_at: ago(200 * DAY) }],
    user_totp_methods: [{ user_id: DEMO_USER_ID, secret_ciphertext: "dummy", enabled_at: ago(6 * DAY), last_verified_step: null, updated_at: ago(6 * DAY) }],
    user_recovery_codes: Array.from({ length: 8 }, (_, index) => ({ id: index + 1, user_id: DEMO_USER_ID, used_at: null })),
    user_notification_prefs: [],
    user_preferences: [],
    oauth_identities: [{ id: "oauth-demo", user_id: DEMO_USER_ID, provider: "google", provider_email: "klara.d@example.com", created_at: ago(240 * DAY), updated_at: ago(240 * DAY) }],
    organizations: [],
    organization_members: [],
    login_attempts: [],
    edu_quiz_badge: [{ user_id: DEMO_USER_ID, badge_key: "archeolog-ai", awarded_at: ago(3 * DAY), meta: {} }],
    edu_quiz_attempt: [],
    edu_quiz_lesson_state: [],
    edu_quiz_review_queue: [],
    store_products: [],
    store_categories: [],
  };
}

const openRequests = (db) => db.services_requests.filter((row) => row.status === "open" && row.expires_at >= new Date().toISOString());

export const RPC = {
  services_expire_requests: () => null,
  services_register_view: () => null,
  services_mark_read: () => null,
  services_unread_counts: (db, { p_user_id }) => (p_user_id === DEMO_USER_ID
    ? [{ offer_id: "22222222-2222-4222-8222-000000000001", request_id: "11111111-1111-4111-8111-000000000001", unread: 1 }]
    : []),
  services_category_counts: (db) => {
    const counts = new Map();
    for (const row of openRequests(db)) counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    return [...counts].map(([category, open_count]) => ({ category, open_count }));
  },
  services_search_requests: (db, args) => {
    let rows = openRequests(db);
    if (args.p_categories) rows = rows.filter((row) => args.p_categories.includes(row.category));
    if (args.p_job_types) rows = rows.filter((row) => args.p_job_types.includes(row.job_type));
    if (args.p_remote_only) rows = rows.filter((row) => row.remote);
    if (args.p_urgent) rows = rows.filter((row) => row.urgent);
    if (args.p_region) rows = rows.filter((row) => row.region === args.p_region || (args.p_include_remote && row.remote));
    if (args.p_words) rows = rows.filter((row) => args.p_words.every((word) => row.search_text.includes(word)));
    const offerCount = (id) => db.services_offers.filter((offer) => offer.request_id === id && offer.status !== "withdrawn").length;
    if (args.p_no_offers) rows = rows.filter((row) => offerCount(row.id) === 0);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const total = rows.length;
    const offset = args.p_offset ?? 0;
    return rows.slice(offset, offset + (args.p_limit ?? 20)).map((row) => ({
      id: row.id,
      distance_km: args.p_lat && row.lat ? Math.round(Math.hypot((row.lat - args.p_lat) * 111, (row.lng - args.p_lng) * 71)) : null,
      offer_count: offerCount(row.id),
      total_count: total,
    }));
  },
  user_effective_tier: (db, { p_user_id }) => db.users.find((user) => user.id === p_user_id)?.tier ?? "free",
  user_rank_keys: (db, { p_user_id }) => (p_user_id === DEMO_USER_ID ? ["pruzkumnik", "silver", "betatester"] : ["ucen"]),
  user_permissions: (db, { p_user_id }) => (p_user_id === DEMO_USER_ID ? ["services.post", "edu.premium", "tools.ai"] : []),
  award_xp: () => ({ awarded: 0, reason: "promo_mock" }),
};
