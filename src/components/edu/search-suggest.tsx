"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourseIndexMeta } from "@/lib/edu/config";

/**
 * Search box with suggestions from two sources, each marked by its icon:
 * VeVit Edu (courses, lessons, own lessons — graduation cap) and Wikipedia
 * articles (W). Enter without a highlighted item searches Wikipedia for the
 * typed text; a trailing "?" keeps the AI mode of /edu/hledat.
 */

export type EduSuggestion = {
  source: "edu";
  label: string;
  sub?: string;
  href: string;
};

type WikiSuggestion = {
  source: "wiki";
  label: string;
  sub?: string;
  href: string;
};

type Suggestion = EduSuggestion | WikiSuggestion;

const WIKI_LANGS = ["cs", "en", "de", "uk", "es"];

export function eduSuggestionsFromIndex(index: CourseIndexMeta[] | null | undefined): EduSuggestion[] {
  const out: EduSuggestion[] = [];
  for (const course of index ?? []) {
    out.push({ source: "edu", label: course.title, sub: `Kurz · ${course.category}`, href: `/edu/kurzy/${encodeURIComponent(course.slug)}` });
    for (const lesson of course.lessons ?? []) {
      out.push({ source: "edu", label: lesson.title, sub: `Lekce · ${course.title}`, href: `/edu/lekce/${encodeURIComponent(lesson.slug)}` });
    }
  }
  return out;
}

function searchHref(q: string): string {
  return `/edu/hledat?q=${encodeURIComponent(q)}`;
}

export function EduCapIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  );
}

export function WikiIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="12" y="16.6" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="13" fontWeight="700" fill="currentColor">W</text>
    </svg>
  );
}

function Highlight({ label, query }: { label: string; query: string }) {
  const q = query.trim();
  const idx = q ? label.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="search-match">{label.slice(idx, idx + q.length)}</mark>
      {label.slice(idx + q.length)}
    </>
  );
}

export function SearchSuggest({
  initialValue = "",
  eduItems,
  lang = "cs",
  placeholder = "Hledej kurzy, lekce nebo články z Wikipedie…",
  inputClassName,
  autoFocus = false,
  showButton = false,
}: {
  initialValue?: string;
  eduItems: EduSuggestion[];
  lang?: string;
  placeholder?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  showButton?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [wiki, setWiki] = useState<WikiSuggestion[]>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wikiLang = WIKI_LANGS.includes(lang) ? lang : "cs";

  const query = value.trim().replace(/\?+\s*$/, "").trim();

  const eduMatches = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return eduItems
      .map((item, order) => {
        const hay = `${item.label} ${item.sub ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return null;
        return { item, prefix: item.label.toLowerCase().startsWith(q) ? 0 : 1, order };
      })
      .filter((x): x is { item: EduSuggestion; prefix: number; order: number } => x !== null)
      .sort((a, b) => a.prefix - b.prefix || a.order - b.order)
      .slice(0, 4)
      .map((x) => x.item);
  }, [eduItems, query]);

  const items: Suggestion[] = useMemo(() => [...eduMatches, ...wiki], [eduMatches, wiki]);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  // Wikipedia suggestions: debounced, previous request aborted.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    if (query.length < 2) {
      timerRef.current = setTimeout(() => {
        setWiki([]);
        setWikiLoading(false);
      }, 0);
      return;
    }
    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      setWikiLoading(true);
      fetch(`/edu/api/wikipedia.php?action=search&limit=5&lang=${wikiLang}&q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
        .then((res) => (res.ok ? res.json() : { pages: [] }))
        .then((data: { pages?: { title: string; description?: string | null }[] }) => {
          setWiki((data.pages ?? []).slice(0, 5).map((page) => ({
            source: "wiki",
            label: page.title,
            sub: page.description ? String(page.description) : "Článek na Wikipedii",
            href: searchHref(page.title),
          })));
        })
        .catch((error: unknown) => {
          if ((error as Error)?.name !== "AbortError") setWiki([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setWikiLoading(false);
        });
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, wikiLang]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) close();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [close]);

  const go = useCallback((href: string, label?: string) => {
    if (label) setValue(label);
    close();
    router.push(href);
  }, [router, close]);

  const submit = useCallback(() => {
    const v = value.trim();
    if (!v) return;
    go(searchHref(v));
  }, [value, go]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      if (items.length) setActive((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      if (!open || !items.length) return;
      event.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = open && active >= 0 ? items.at(active) : undefined;
      if (item) go(item.href, item.label);
      else submit();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  }

  const showList = open && query.length >= 2;
  const eduCount = eduMatches.length;

  return (
    <div className="relative flex gap-2" ref={wrapRef}>
      <div className="relative flex-1 min-w-0">
        <label className="sr-only" htmlFor={`${listId}-input`}>Vyhledat kurz, lekci nebo článek</label>
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={200}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={inputClassName}
        />
        {showList && (
          <ul id={`${listId}-list`} className="hero-search-listbox suggest-listbox" role="listbox">
            {eduCount > 0 && <li className="suggest-group" role="presentation">VeVit Edu</li>}
            {items.map((item, i) => (
              <SuggestOption
                key={`${item.source}-${item.href}`}
                id={`${listId}-opt-${i}`}
                item={item}
                query={query}
                active={i === active}
                groupStart={item.source === "wiki" && i === eduCount}
                onHover={() => setActive(i)}
                onSelect={() => go(item.href, item.label)}
              />
            ))}
            {wiki.length === 0 && wikiLoading && (
              <li className="hsl-empty" role="presentation">Hledám na Wikipedii…</li>
            )}
            {items.length === 0 && !wikiLoading && (
              <li className="hsl-empty" role="presentation">Nic nenalezeno. Enter prohledá Wikipedii.</li>
            )}
          </ul>
        )}
      </div>
      {showButton && (
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="h-10 px-4 rounded-lg bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition disabled:opacity-50"
        >
          Hledat
        </button>
      )}
    </div>
  );
}

function SuggestOption({
  id, item, query, active, groupStart, onHover, onSelect,
}: {
  id: string;
  item: Suggestion;
  query: string;
  active: boolean;
  groupStart: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <>
      {groupStart && <li className="suggest-group" role="presentation">Wikipedie</li>}
      <li
        id={id}
        role="option"
        aria-selected={active}
        className={`suggest-option${active ? " hsl-active" : ""}`}
        onMouseOver={onHover}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
      >
        <span className={`suggest-icon suggest-icon--${item.source}`} title={item.source === "wiki" ? "Wikipedie" : "VeVit Edu"}>
          {item.source === "wiki" ? <WikiIcon /> : <EduCapIcon />}
        </span>
        <span className="suggest-text">
          <span className="hsl-label"><Highlight label={item.label} query={query} /></span>
          {item.sub ? <span className="hsl-sub">{item.sub}</span> : null}
        </span>
      </li>
    </>
  );
}
