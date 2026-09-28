import type { Metadata } from "next";
import { connection } from "next/server";
import {
  activeProviders, categoryCounts, completedJobsFor, expireRequests, listCategories, publicUsers, ratingsFor,
  renderTime, servicesStats,
} from "@/lib/services";
import { parseRequestFilters, searchRequests } from "@/lib/services-search";
import { servicesLocale } from "@/lib/services-locale";
import { categoryTree } from "@/components/services/categories";
import { RADII } from "@/components/services/constants";
import { SvcIcon } from "@/components/services/icons";
import { RequestCard } from "@/components/services/request-card";
import { HeroSearch } from "@/components/services/hero-search";
import { Avatar, Stars, plural } from "@/components/services/ui";

export const metadata: Metadata = {
  title: "VeVit Services – poptávky, zakázky a šikovní lidé kolem vás",
  description: "Zadejte poptávku zdarma a vyberte si z nabídek, nebo najděte zakázky ve svém okolí. Weby, grafika, řemesla, úklid, doučování a další.",
};

const POPULAR = [
  { label: "Tvorba webu", kat: "tvorba-webu" },
  { label: "Úklid", kat: "uklid" },
  { label: "Hodinový manžel", kat: "hodinovy-manzel" },
  { label: "Logo", kat: "logo-identita" },
  { label: "Doučování", kat: "skolni-predmety" },
  { label: "Stěhování", kat: "stehovani" },
  { label: "Fotograf", kat: "fotografie" },
  { label: "Překlady", kat: "preklady" },
];

const STEPS = [
  { icon: "pen-line", title: "Popište, co potřebujete", text: "Zadání je zdarma a zabere pár minut. Kontakt zůstane skrytý." },
  { icon: "inbox", title: "Přijdou nabídky", text: "Poskytovatelé pošlou cenu, termín a jak na to půjdou. Doptáte se ve zprávách." },
  { icon: "handshake", title: "Vyberte si", text: "Porovnejte hodnocení a ceny. Po výběru uvidíte kontakt na druhou stranu." },
  { icon: "star", title: "Ohodnoťte spolupráci", text: "Po dokončení se navzájem ohodnotíte. Hodnocení pomáhá dalším." },
];

export default async function ServicesHomePage() {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const categories = await listCategories();
  await expireRequests();
  const [counts, stats, latest, providers] = await Promise.all([
    categoryCounts(categories),
    servicesStats(),
    searchRequests(parseRequestFilters({}, categories), categories, 6),
    activeProviders(60),
  ]);
  const now = renderTime();
  const tree = categoryTree(categories);

  // Doporučení poskytovatelé: nejlépe hodnocení, pak nejvíc dokončených zakázek.
  const providerIds = providers.map((provider) => provider.user_id);
  const [ratings, jobs, people] = await Promise.all([ratingsFor(providerIds), completedJobsFor(providerIds), publicUsers(providerIds)]);
  const featured = [...providers]
    .sort((a, b) => (ratings.get(b.user_id)?.average ?? 0) - (ratings.get(a.user_id)?.average ?? 0)
      || (jobs.get(b.user_id) ?? 0) - (jobs.get(a.user_id) ?? 0))
    .slice(0, 4);
  const names = new Map(categories.map((category) => [category.slug, category.name_cs]));

  return (
    <>
      <section className="svc-hero2">
        <div className="svc-hero2__text">
          <p className="svc-eyebrow">VeVit Services · beta</p>
          <h1 className="svc-hero2__title">Šikovní lidé na cokoli.<br /><span>Kousek od vás, nebo na dálku.</span></h1>
          <p className="svc-lead">Zadejte poptávku zdarma a vyberte si z nabídek. Nebo najděte zakázky, na které máte ruce i hlavu.</p>
        </div>
        <HeroSearch action={`${base}/poptavky`} radii={[...RADII]} />
        <div className="svc-popular" aria-label="Oblíbená hledání">
          <span className="svc-small">Oblíbené:</span>
          {POPULAR.map((item) => <a key={item.kat} className="svc-pill" href={`${base}/poptavky?kat=${item.kat}`}>{item.label}</a>)}
        </div>
      </section>

      <section className="svc-cta2">
        <a className="svc-cta2__card" href={`${base}/poptavka/nova`}>
          <span className="svc-cta2__icon"><SvcIcon name="send" size={22} /></span>
          <span>
            <strong>Potřebuji něco udělat</strong>
            <small>Zadat poptávku zdarma a nechat si poslat nabídky</small>
          </span>
          <SvcIcon name="arrow-right" size={18} />
        </a>
        <a className="svc-cta2__card" href={`${base}/poptavky`}>
          <span className="svc-cta2__icon svc-cta2__icon--alt"><SvcIcon name="briefcase" size={22} /></span>
          <span>
            <strong>Hledám zakázky</strong>
            <small>Procházet otevřené poptávky a nabídnout svou práci</small>
          </span>
          <SvcIcon name="arrow-right" size={18} />
        </a>
      </section>

      <section className="svc-stats" aria-label="VeVit Services v číslech">
        <div><strong>{stats.open}</strong><span>{plural(stats.open, "otevřená poptávka", "otevřené poptávky", "otevřených poptávek").replace(/^\d+ /, "")}</span></div>
        <div><strong>{stats.providers}</strong><span>{plural(stats.providers, "poskytovatel", "poskytovatelé", "poskytovatelů").replace(/^\d+ /, "")}</span></div>
        <div><strong>{stats.completed}</strong><span>{plural(stats.completed, "dokončená zakázka", "dokončené zakázky", "dokončených zakázek").replace(/^\d+ /, "")}</span></div>
        <div><strong>0 Kč</strong><span>za zadání i nabídku</span></div>
      </section>

      <section className="svc-section">
        <div className="svc-section__head">
          <h2 className="svc-h2">Kategorie</h2>
          <a className="svc-link" href={`${base}/poptavky`}>Všechny poptávky</a>
        </div>
        <div className="svc-catgrid">
          {tree.map((category) => (
            <a key={category.slug} className="svc-catcard" href={`${base}/poptavky?kat=${category.slug}`}>
              <span className="svc-catcard__icon"><SvcIcon name={category.icon} size={22} /></span>
              <strong>{category.name_cs}</strong>
              <small>{category.description_cs}</small>
              <span className="svc-catcard__count">{plural(counts.get(category.slug) ?? 0, "poptávka", "poptávky", "poptávek")}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="svc-section">
        <div className="svc-section__head">
          <h2 className="svc-h2">Nejnovější poptávky</h2>
          <a className="svc-link" href={`${base}/poptavky`}>Zobrazit všechny</a>
        </div>
        {latest.items.length === 0 ? (
          <div className="svc-empty">
            <p>Zatím tu není žádná otevřená poptávka. Buďte první.</p>
            <p style={{ marginTop: 12 }}><a className="svc-btn svc-btn--primary" href={`${base}/poptavka/nova`}>Zadat poptávku</a></p>
          </div>
        ) : (
          <div className="svc-rlist">
            {latest.items.map((request) => (
              <RequestCard key={request.id} request={request} categories={categories} base={base} now={now} offers={request.offer_count} />
            ))}
          </div>
        )}
      </section>

      <section className="svc-section">
        <h2 className="svc-h2">Jak to funguje</h2>
        <ol className="svc-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="svc-steps__icon"><SvcIcon name={step.icon} size={20} /></span>
              <span className="svc-steps__num">{index + 1}</span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {featured.length ? (
        <section className="svc-section">
          <div className="svc-section__head">
            <h2 className="svc-h2">Poskytovatelé</h2>
            <a className="svc-link" href={`${base}/poskytovatele`}>Všichni poskytovatelé</a>
          </div>
          <div className="svc-pgrid">
            {featured.map((provider) => {
              const person = people.get(provider.user_id);
              const rating = ratings.get(provider.user_id);
              return (
                <a key={provider.user_id} className="svc-pcard" href={`${base}/poskytovatel/${provider.user_id}`}>
                  <div className="svc-row">
                    <Avatar name={person?.name ?? "?"} url={person?.avatar_url ?? null} />
                    <div>
                      <strong>{person?.name ?? "Poskytovatel"}</strong>
                      <div className="svc-small">{provider.city || "Na dálku"}</div>
                    </div>
                  </div>
                  <p className="svc-pcard__headline">{provider.headline}</p>
                  <div className="svc-small">
                    {rating ? <><Stars value={rating.average} /> {rating.average.toFixed(1)} ({rating.count})</> : "Nový poskytovatel"}
                    {" · "}{(provider.categories ?? []).slice(0, 2).map((slug) => names.get(slug) ?? slug).join(", ")}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="svc-trust">
        <div><SvcIcon name="shield-check" size={20} /><span><strong>Kontakt až po výběru.</strong> Telefon a e-mail uvidí jen poskytovatel, kterého vyberete.</span></div>
        <div><SvcIcon name="star" size={20} /><span><strong>Oboustranné hodnocení.</strong> Hodnotit lze jen dokončenou zakázku.</span></div>
        <div><SvcIcon name="bell" size={20} /><span><strong>Hlídací pes.</strong> Nastavte si filtr a nové poptávky vám pošleme e-mailem.</span></div>
      </section>
    </>
  );
}
