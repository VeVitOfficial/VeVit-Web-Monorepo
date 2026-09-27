"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchSummary,
  type DisambiguationItem,
  type ParsedDisambiguation,
  type TocEntry,
  type WikiHatnote,
  type WikiSummary,
} from "@/lib/edu/wikipedia";
import { Icon } from "../pages/home-icons";
import { WikiIcon } from "../search-suggest";

/**
 * Custom presentation of Wikipedia content inside VeVit Edu: article header,
 * lead notes ("další významy"), infobox card, sticky contents with the
 * current section, reading progress, licence footer and disambiguation
 * pages rendered as a list of meaning cards.
 */

export function SignpostIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 13v8" />
      <path d="M12 3v3" />
      <path d="M18 6a2 2 0 0 1 1.387.56l2.307 2.22a1 1 0 0 1 0 1.44l-2.307 2.22A2 2 0 0 1 18 13H6a2 2 0 0 1-1.387-.56l-2.306-2.22a1 1 0 0 1 0-1.44l2.306-2.22A2 2 0 0 1 6 6z" />
    </svg>
  );
}

function LinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function wikipediaUrl(title: string, lang = "cs"): string {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

/* ── Header ──────────────────────────────────────────────────────────── */

export function WikiArticleHeader({
  title,
  summary,
  readingMinutes,
  onAsk,
  asking,
}: {
  title: string;
  summary: WikiSummary | null;
  readingMinutes: number;
  onAsk: (question: string) => void;
  asking: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState("");
  const edited = formatDate(summary?.timestamp);
  const thumb = summary?.thumbnail;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <header className="wiki-hero">
      <div className="wiki-hero__body">
        <div className="wiki-kicker">
          <span className="wiki-kicker__source"><WikiIcon className="h-4 w-4" /> Wikipedie</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1"><Icon name="clock" className="h-3.5 w-3.5" /> {readingMinutes} min čtení</span>
          {edited && (<><span aria-hidden="true">·</span><span>upraveno {edited}</span></>)}
        </div>
        <h1 className="wiki-title">{title}</h1>
        {summary?.description && <p className="wiki-description">{summary.description}</p>}

        <form
          className="wiki-ask"
          onSubmit={(event) => {
            event.preventDefault();
            const q = question.trim();
            if (q) onAsk(q);
          }}
        >
          <Icon name="sparkles" className="h-4 w-4 text-emerald-500 shrink-0" />
          <label className="sr-only" htmlFor="wiki-ask-input">Zeptat se AI na tento článek</label>
          <input
            id="wiki-ask-input"
            type="text"
            maxLength={300}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={`Zeptej se AI na článek „${title}“…`}
          />
          <button type="submit" disabled={!question.trim() || asking}>{asking ? "Přemýšlím…" : "Zeptat se"}</button>
        </form>

        <div className="wiki-actions">
          <a href={wikipediaUrl(title, summary?.lang)} target="_blank" rel="noopener noreferrer" className="wiki-chip">
            <WikiIcon className="h-3.5 w-3.5" /> Otevřít na Wikipedii <Icon name="external-link" className="h-3 w-3" />
          </a>
          <button type="button" className="wiki-chip" onClick={copyLink}>
            <LinkIcon className="h-3.5 w-3.5" /> {copied ? "Odkaz zkopírován" : "Kopírovat odkaz"}
          </button>
        </div>
      </div>
      {thumb && (
        <figure className="wiki-hero__image">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Wikimedia thumbnail, sizes vary */}
          <img src={thumb.source} alt={title} width={thumb.width ?? undefined} height={thumb.height ?? undefined} />
        </figure>
      )}
    </header>
  );
}

/* ── Lead notes (další významy) ──────────────────────────────────────── */

function TextWithLinks({ note }: { note: WikiHatnote }) {
  // Replace each link title in the note's text with an in-app link, in order.
  const parts: React.ReactNode[] = [];
  let rest = note.text;
  note.links.forEach((link, i) => {
    const at = rest.indexOf(link.title);
    if (at === -1) return;
    parts.push(rest.slice(0, at));
    parts.push(
      link.missing
        ? <span key={i} className="wp-redlink">{link.title}</span>
        : <Link key={i} href={link.href} className="wiki-hatnote__link">{link.title}</Link>,
    );
    rest = rest.slice(at + link.title.length);
  });
  parts.push(rest);
  return <>{parts}</>;
}

export function WikiHatnotes({ notes }: { notes: WikiHatnote[] }) {
  if (!notes.length) return null;
  return (
    <div className="wiki-hatnotes">
      {notes.map((note, i) => (
        <p key={i} className="wiki-hatnote">
          <SignpostIcon className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <span><TextWithLinks note={note} /></span>
        </p>
      ))}
    </div>
  );
}

/* ── Infobox card ────────────────────────────────────────────────────── */

export function WikiInfoboxCard({ html, onClick }: { html: string; onClick: (event: React.MouseEvent<HTMLDivElement>) => void }) {
  const [open, setOpen] = useState(false);
  // Open by default on wide screens where the card sits beside the text.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1280px)");
    const sync = () => setOpen(wide.matches);
    sync();
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);
  if (!html) return null;
  return (
    <details className="wiki-infobox" open={open} onToggle={(event) => setOpen((event.target as HTMLDetailsElement).open)}>
      <summary><Icon name="info" className="h-4 w-4" /> Základní údaje</summary>
      {/* Already sanitized twice (server + DOMPurify) in parseArticle. */}
      <div className="wiki-infobox__body wp-article" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
    </details>
  );
}

/* ── Contents with the current section ──────────────────────────────── */

export function useActiveHeading(container: HTMLElement | null, ids: string[]): string {
  const [active, setActive] = useState("");
  useEffect(() => {
    if (!container || ids.length === 0) return;
    const headings = ids
      .map((id) => container.querySelector(`[id="${id.replace(/(["\\])/g, "\\$1")}"]`))
      .filter((el): el is Element => el !== null);
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [container, ids]);
  return active;
}

export function WikiToc({ toc, active, onPick }: { toc: TocEntry[]; active: string; onPick: (id: string) => void }) {
  if (!toc.length) {
    return <p className="px-3 py-2 text-sm text-[var(--color-text-muted)]">Článek nemá další sekce.</p>;
  }
  return (
    <nav aria-label="Obsah článku" className="wiki-toc">
      <div className="wiki-toc__label">Obsah</div>
      <ol>
        {toc.map((h) => (
          <li key={h.id} className={`wiki-toc__item wiki-toc__item--l${h.level}${h.id === active ? " is-active" : ""}`}>
            <button type="button" onClick={() => onPick(h.id)} aria-current={h.id === active ? "location" : undefined}>
              {h.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ReadingProgress({ target }: { target: HTMLElement | null }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      setPct(total <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top + 140) / total * 100)));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [target]);
  return <div className="wiki-progress" role="presentation"><div style={{ width: `${pct}%` }} /></div>;
}

/* ── Licence ─────────────────────────────────────────────────────────── */

export function WikiLicense({ title, lang = "cs" }: { title: string; lang?: string }) {
  const url = wikipediaUrl(title, lang);
  return (
    <footer className="wiki-license">
      <WikiIcon className="h-4 w-4 shrink-0" />
      <p>
        Text pochází z článku <a href={url} target="_blank" rel="noopener noreferrer">„{title}“ na Wikipedii</a> a je
        dostupný pod licencí{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.cs" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
        {" "}Autoři jsou uvedeni v <a href={`${url}?action=history`} target="_blank" rel="noopener noreferrer">historii článku</a>.
        VeVit Edu obsah upravuje jen vzhledově.
      </p>
    </footer>
  );
}

/* ── Loading ─────────────────────────────────────────────────────────── */

export function WikiSkeleton({ label }: { label: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10" aria-busy="true">
      <div className="wiki-skel wiki-skel--kicker" />
      <div className="wiki-skel wiki-skel--title" />
      <div className="wiki-skel wiki-skel--line" />
      <div className="wiki-skel wiki-skel--line wiki-skel--short" />
      <p className="mt-8 flex items-center gap-3 text-sm text-[var(--color-text-muted)]"><span className="ai-spinner" /> {label}</p>
    </div>
  );
}

/* ── Disambiguation ──────────────────────────────────────────────────── */

type Preview = { thumbnail: string | null; description: string };

/** Loads summaries (thumbnail, short description) for the listed meanings, 4 at a time. */
function usePreviews(items: DisambiguationItem[]): Record<string, Preview> {
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const titles = useMemo(() => items.filter((i) => !i.missing).slice(0, 40).map((i) => i.title), [items]);
  useEffect(() => {
    let cancelled = false;
    const queue = [...titles];
    const worker = async () => {
      for (let t = queue.shift(); t !== undefined && !cancelled; t = queue.shift()) {
        const summary = await fetchSummary(t);
        if (cancelled || !summary) continue;
        const title = t;
        setPreviews((current) => ({
          ...current,
          [title]: { thumbnail: summary.thumbnail?.source ?? null, description: summary.description },
        }));
      }
    };
    void Promise.all([worker(), worker(), worker(), worker()]);
    return () => { cancelled = true; };
  }, [titles]);
  return previews;
}

function MeaningCard({ item, preview }: { item: DisambiguationItem; preview?: Preview }) {
  const description = item.description || preview?.description || "";
  const body = (
    <>
      <span className="wiki-meaning__thumb">
        {preview?.thumbnail
          // eslint-disable-next-line @next/next/no-img-element -- small remote Wikimedia thumbnail
          ? <img src={preview.thumbnail} alt="" loading="lazy" />
          : <span aria-hidden="true">{item.title.charAt(0).toLocaleUpperCase("cs-CZ")}</span>}
      </span>
      <span className="wiki-meaning__text">
        <strong>{item.title}</strong>
        {description && <span>{description}</span>}
        {item.missing && <em>Článek na Wikipedii zatím neexistuje</em>}
      </span>
      {!item.missing && <Icon name="arrow-right" className="h-4 w-4 wiki-meaning__arrow" />}
    </>
  );
  return item.missing
    ? <div className="wiki-meaning wiki-meaning--missing">{body}</div>
    : <Link href={item.href} className="wiki-meaning">{body}</Link>;
}

export function WikiDisambiguationView({ title, data, lang }: { title: string; data: ParsedDisambiguation; lang?: string }) {
  const [filter, setFilter] = useState("");
  const allItems = useMemo(() => data.groups.flatMap((g) => g.items), [data]);
  const previews = usePreviews(allItems);
  const q = filter.trim().toLowerCase();
  const groups = data.groups
    .map((group) => ({
      ...group,
      items: q
        ? group.items.filter((i) => `${i.title} ${i.description} ${previews[i.title]?.description ?? ""}`.toLowerCase().includes(q))
        : group.items,
    }))
    .filter((group) => group.items.length > 0);
  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">
      <header className="wiki-hero wiki-hero--disambig">
        <div className="wiki-hero__body">
          <div className="wiki-kicker">
            <span className="wiki-kicker__source wiki-kicker__source--disambig"><SignpostIcon className="h-4 w-4" /> Rozcestník</span>
            <span aria-hidden="true">·</span>
            <span>{allItems.length} {allItems.length === 1 ? "význam" : allItems.length < 5 ? "významy" : "významů"}</span>
          </div>
          <h1 className="wiki-title">{title}</h1>
          <p className="wiki-description">{data.intro.replace(/[:：]\s*$/, ".") || "Tento výraz má více významů. Vyber ten, který hledáš."}</p>
          {allItems.length > 6 && (
            <div className="wiki-filter">
              <Icon name="search" className="h-4 w-4" />
              <label className="sr-only" htmlFor="wiki-filter">Filtrovat významy</label>
              <input id="wiki-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrovat významy…" />
            </div>
          )}
        </div>
      </header>

      {shown === 0 && <p className="mt-10 text-center text-[var(--color-text-muted)]">Žádný význam neodpovídá filtru „{filter}“.</p>}
      {groups.map((group, gi) => (
        <section key={`${group.label}-${gi}`} className="mt-10">
          {group.label && <h2 className="wiki-group">{group.label}</h2>}
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item, ii) => <MeaningCard key={`${item.title}-${ii}`} item={item} preview={previews[item.title]} />)}
          </div>
        </section>
      ))}
      <div className="mt-14"><WikiLicense title={title} lang={lang} /></div>
    </div>
  );
}
