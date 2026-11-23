"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// Port home/assets/js/support.js — initFaq. Položky FAQ nemají data-ui-text
// (jsou české, bez lokalizace), takže je bezpečné řídit je React statem.
// normalizeSearch: NFD → lower (cs-CZ) → trim, jako legacy.

const CATEGORIES = [
  { key: "all", label: "Vše" },
  { key: "account", label: "Account" },
  { key: "tools", label: "Tools" },
  { key: "edu", label: "Edu" },
  { key: "services", label: "Services" },
  { key: "other", label: "Ostatní" },
] as const;

type FaqItem = {
  id: string;
  category: string;
  question: string;
  // Odpověď obsahuje odkazy (locale-aware) — skládáme ji sami ze známých
  // řetězců, žádný vstup od uživatele, takže dangerouslySetInnerHTML je safe.
  answerHtml: string;
};

function normalizeSearch(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .trim();
}

export function SupportFaq({
  locale,
  children,
}: {
  locale: string;
  children?: ReactNode;
}) {
  const L = `/${locale}`;
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const items: FaqItem[] = useMemo(
    () => [
      {
        id: "faq-answer-account-access",
        category: "account",
        question: "Jak se přihlásím nebo zaregistruji?",
        answerHtml: `Pro přihlášení otevřete <a href="${L}/account/login">VeVit Account</a>. Nový účet vytvoříte na stránce <a href="${L}/account/register">Registrace</a>.`,
      },
      {
        id: "faq-answer-password",
        category: "account",
        question: "Co dělat, když zapomenu heslo?",
        answerHtml: `Na přihlašovací stránce zvolte obnovu hesla. Odkaz najdete také přímo na <a href="${L}/account/forgot-password">vevit.cz/account/forgot-password.html</a>.`,
      },
      {
        id: "faq-answer-files",
        category: "tools",
        question: "Kam se nahrávají moje soubory?",
        answerHtml:
          "Většina nástrojů zpracuje soubor přímo ve vašem prohlížeči. U nástrojů využívajících externí službu je způsob zpracování uvedený přímo na jejich stránce.",
      },
      {
        id: "faq-answer-tool-bug",
        category: "tools",
        question: "Jak nahlásím chybu v nástroji?",
        answerHtml:
          "Ve formuláři níže vyberte aplikaci Tools a typ Nahlášení chyby. Přidejte název nástroje a popis toho, co se stalo.",
      },
      {
        id: "faq-answer-report-details",
        category: "other",
        question: "Co mám uvést v hlášení chyby?",
        answerHtml:
          "Napište použitou aplikaci, zařízení a prohlížeč. Přidejte kroky, po kterých chyba nastala, a přesné chybové hlášení, pokud se zobrazilo.",
      },
      {
        id: "faq-answer-edu",
        category: "edu",
        question: "V jakém stavu je VeVit Edu?",
        answerHtml: `VeVit Edu je v betě a jeho obsah postupně doplňujeme. Aktuální stav najdete ve <a href="${L}/home#roadmap">veřejné roadmapě</a>.`,
      },
      {
        id: "faq-answer-services",
        category: "services",
        question: "Kde najdu VeVit Services?",
        answerHtml: `VeVit Services otevřete na <a href="https://services.vevit.cz">services.vevit.cz</a>. Můžete tam zadat poptávku nebo nabídnout vlastní službu.`,
      },
      {
        id: "faq-answer-contact",
        category: "other",
        question: "Jak můžu VeVit kontaktovat?",
        answerHtml: `Použijte formulář níže nebo napište na <a href="mailto:info@vevit.cz" data-contact-email>info@vevit.cz</a>. Najdete nás také na Instagramu, X a Discordu.`,
      },
    ],
    [L],
  );

  const normalizedQuery = normalizeSearch(query);
  const visibleItems = items.filter((item) => {
    const categoryMatch =
      activeCategory === "all" || item.category === activeCategory;
    const textMatch = normalizeSearch(
      `${item.question} ${item.answerHtml}`,
    ).includes(normalizedQuery);
    return categoryMatch && textMatch;
  });
  const visibleCount = visibleItems.length;
  const resultCountText =
    visibleCount === 1
      ? "1 nalezená odpověď"
      : `${visibleCount} nalezených odpovědí`;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Ctrl/Cmd+K focusuje vyhledávání (legacy keyboard shortcut).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLocaleLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <section className="support-hero" aria-labelledby="support-title">
        <div className="container">
          <span className="eyebrow">Centrum podpory</span>
          <h1 id="support-title">Nápověda a časté otázky</h1>
          <p>Najděte odpověď nebo nám rovnou napište.</p>

          <div className="support-search">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <label className="sr-only" htmlFor="support-search">
              Hledat v otázkách a odpovědích
            </label>
            <input
              id="support-search"
              ref={searchRef}
              type="search"
              autoComplete="off"
              placeholder="Hledat v otázkách a nápovědě..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd aria-hidden="true">Ctrl K</kbd>
          </div>
          <p
            className="support-result-count"
            data-support-result-count
            role="status"
            aria-live="polite"
          >
            {resultCountText}
          </p>
        </div>
      </section>

      <section
        className="section support-content"
        id="faq"
        aria-labelledby="faq-title"
      >
        <div className="container support-layout">
          <aside
            className="support-categories"
            aria-label="Kategorie podpory"
          >
            <p className="support-categories-title">Kategorie</p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                data-support-category={cat.key}
                aria-pressed={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </aside>

          <div className="faq-column">
            <div className="support-section-heading">
              <div>
                <span className="eyebrow">FAQ</span>
                <h2 id="faq-title">Nejčastější otázky</h2>
              </div>
              <a href="#contact">Přejít na formulář</a>
            </div>

            <div className="faq-list">
              {visibleItems.map((item) => {
                const isOpen = expanded.has(item.id);
                return (
                  <article
                    className="faq-item"
                    data-faq-item
                    data-category={item.category}
                    key={item.id}
                  >
                    <h3>
                      <button
                        type="button"
                        data-faq-question
                        aria-expanded={isOpen}
                        aria-controls={item.id}
                        onClick={() => toggle(item.id)}
                      >
                        {item.question}
                        <span aria-hidden="true">+</span>
                      </button>
                    </h3>
                    <div
                      className="faq-answer"
                      id={item.id}
                      role="region"
                      hidden={!isOpen}
                      dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                    />
                  </article>
                );
              })}
            </div>

            <div
              className="support-no-results"
              id="support-no-results"
              hidden={visibleCount !== 0}
            >
              <h3>Nenašli jsme odpovídající otázku</h3>
              <p>Zkuste jiný výraz nebo nám pošlete zprávu přes formulář.</p>
              <a className="btn btn-ghost btn-sm" href="#contact">
                Napsat podpoře
              </a>
            </div>

            {children}
          </div>
        </div>
      </section>
    </>
  );
}