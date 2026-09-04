// Pure port of tools/assets/js/search-core.js — normalize/score/parseState/serializeState.
// Bez DOM závislostí, použitelné ze serveru i klienta.
import type { ReactNode } from "react";
import type { Category, ProcessingLocation, ToolStatus, Tool } from "@/components/tools/registry/data";
import { CATEGORY_ORDER } from "@/components/tools/registry/data";

export interface HubState {
  q: string;
  category: "" | Category;
  processing: "" | ProcessingLocation;
  status: "" | ToolStatus;
  newOnly: boolean;
  sort: "relevance" | "name" | "newest";
}

export const DEFAULT_STATE: HubState = {
  q: "",
  category: "",
  processing: "",
  status: "",
  newOnly: false,
  sort: "relevance",
};

const CATEGORIES: readonly Category[] = ["pdf", "image", "media", "text", "ai", "dev", "security", "calc"];
const PROCESSINGS: readonly ProcessingLocation[] = ["client", "vevit_server", "external_ai"];
const STATUSES: readonly ToolStatus[] = ["working", "limited", "experimental", "coming_soon", "unavailable_on_wedos", "broken"];
const SORTS: readonly ("relevance" | "name" | "newest")[] = ["relevance", "name", "newest"];

export function parseState(sp: URLSearchParams | Record<string, string | string[] | undefined>): HubState {
  const get = (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const rawQ = (get("q") ?? "").slice(0, 80);
  const rawCat = get("category") ?? "";
  const rawProc = get("processing") ?? "";
  const rawStatus = get("status") ?? "";
  const rawNew = get("new") ?? "";
  const rawSort = get("sort") ?? "";
  return {
    q: rawQ,
    category: (CATEGORIES as readonly string[]).includes(rawCat) ? (rawCat as Category) : "",
    processing: (PROCESSINGS as readonly string[]).includes(rawProc) ? (rawProc as ProcessingLocation) : "",
    status: (STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as ToolStatus) : "",
    newOnly: rawNew === "1",
    sort: (SORTS as readonly string[]).includes(rawSort as "relevance" | "name" | "newest") ? (rawSort as "relevance" | "name" | "newest") : "relevance",
  };
}

export function serializeState(s: HubState): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.category) p.set("category", s.category);
  if (s.processing) p.set("processing", s.processing);
  if (s.status) p.set("status", s.status);
  if (s.newOnly) p.set("new", "1");
  if (s.sort !== "relevance") p.set("sort", s.sort);
  const str = p.toString();
  return str ? `?${str}` : "";
}

// ── normalize (port search-core.js normalize) ───────────────────────────

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ── Levenshtein (port search-core.js fuzzy) ─────────────────────────────

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// ── score (port search-core.js score) ───────────────────────────────────

export interface ScoredTool { tool: Tool; score: number; }

export function scoreTool(tool: Tool, query: string): number {
  if (!query) return 0;
  const q = normalize(query);
  if (!q) return 0;
  const name = normalize(tool.name);
  const desc = normalize(tool.description);
  const slug = normalize(tool.slug);
  const keywords = tool.keywords.map(normalize);
  const aliases = (tool.aliases ?? []).map(normalize);

  if (name === q) return 1000;
  if (name.startsWith(q)) return 900;
  if (name.includes(q)) return 740;
  for (const a of aliases) {
    if (a === q) return 700;
    if (a.startsWith(q)) return 660;
  }
  for (const k of keywords) {
    if (k === q) return 640;
    if (k.startsWith(q)) return 600;
  }
  if (slug === q) return 560;
  if (slug.includes(q)) return 500;
  if (desc.includes(q)) return 320;

  const tokens = q.split(/\s+/);
  if (tokens.length === 1 && q.length >= 4) {
    const limit = q.length <= 6 ? 1 : 2;
    let best = Infinity;
    const probe = (candidate: string) => {
      if (!candidate) return;
      if (Math.abs(candidate.length - q.length) > limit) return;
      const d = levenshtein(q, candidate);
      if (d <= limit && d < best) best = d;
    };
    probe(name); probe(slug);
    for (const k of keywords) probe(k);
    for (const a of aliases) probe(a);
    if (best !== Infinity) return 220 - best * 30;
  }
  return 300;
}

// ── filter + sort (port hub.js applyFilters + render) ───────────────────

export function applyFilters(tools: readonly Tool[], s: HubState): Tool[] {
  let out = tools.slice();
  if (s.category) out = out.filter((t) => t.category === s.category);
  if (s.processing) out = out.filter((t) => t.processing_location === s.processing);
  if (s.status) out = out.filter((t) => t.status === s.status);
  if (s.newOnly) out = out.filter((t) => t.new);
  if (s.q.trim()) {
    out = out
      .map((t) => ({ t, sc: scoreTool(t, s.q) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .map((x) => x.t);
  } else if (s.sort === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name, "cs"));
  } else if (s.sort === "newest") {
    out.sort((a, b) => Number(b.new) - Number(a.new));
  }
  return out;
}

/** Tools pro sekci kategorie (nebo 'nove'), respektující aktivní filtry (kromě category). */
export function sectionTools(tools: readonly Tool[], s: HubState, cat: Category | "nove"): Tool[] {
  let out = tools.slice();
  if (s.processing) out = out.filter((t) => t.processing_location === s.processing);
  if (s.status) out = out.filter((t) => t.status === s.status);
  if (s.newOnly) out = out.filter((t) => t.new);
  if (cat === "nove") out = out.filter((t) => t.new);
  else out = out.filter((t) => t.category === cat);
  if (s.q.trim()) {
    out = out
      .map((t) => ({ t, sc: scoreTool(t, s.q) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .map((x) => x.t);
  } else if (s.sort === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name, "cs"));
  }
  return out;
}

export function categoryOrder(): readonly Category[] { return CATEGORY_ORDER; }

// ── highlight (port hub.js appendHighlighted) ───────────────────────────
// Vrátí pole React uzlů se <mark> kolem shody (case-insensitive, diakritika-agnostic).

export function highlight(text: string, query: string): ReactNode[] {
  if (!query) return [text];
  const q = normalize(query);
  if (!q) return [text];
  const qTokens = q.split(/\s+/).filter(Boolean);
  if (qTokens.length === 0) return [text];
  const lower = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const marks: { start: number; end: number }[] = [];
  for (const tok of qTokens) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(tok, from);
      if (idx === -1) break;
      marks.push({ start: idx, end: idx + tok.length });
      from = idx + tok.length;
    }
  }
  if (marks.length === 0) return [text];
  marks.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const m of marks) {
    const last = merged[merged.length - 1];
    if (last && m.start <= last.end) last.end = Math.max(last.end, m.end);
    else merged.push({ start: m.start, end: m.end });
  }
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < merged.length; i++) {
    const m = merged[i];
    if (m.start > cursor) nodes.push(text.slice(cursor, m.start));
    nodes.push(<mark key={i}>{text.slice(m.start, m.end)}</mark>);
    cursor = m.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}