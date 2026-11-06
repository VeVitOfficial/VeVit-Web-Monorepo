// Rekonstrukce struktury z PageModel (extract.ts): glyfy → segmenty → řádky → bloky.
// Výsledkem je dokumentový model (model.ts), ze kterého docx-writer.ts píše OOXML.
//
// Postup na stránce:
//  1. linky a výplně z vektorových cest (pravidla tabulek, oddělovače, stínování),
//  2. tabulky: (a) mřížka z čar, (b) linky jen mezi řádky (faktury), (c) bez čar podle
//     zarovnání textu do sloupců,
//  3. XY-cut zbytku stránky: vedle sebe ležící bloky (titulek | datumy, dodavatel | odběratel)
//     → tabulka bez ohraničení, dlouhé sloupce textu → sloupce sekce,
//  4. odstavce v listech: zarovnání, odsazení, řádkování, mezery, nadpisy, seznamy.
// Vše jsou čisté funkce bez DOM: testy je pouští v Node nad extrahovanými JSON fixtures.
import type { Glyph, PageModel, PathShape, Rgb, FontInfo } from "./extract.ts";
import { wordMetrics } from "./fontmap.ts";
import type { Block, Para, Run, Table, TableCell, TableRow, Borders, Border, ImageBlock, DocModel, PageLayout, ListInfo, Align, ColumnsBlock } from "./model.ts";

// ── Segmenty a řádky ────────────────────────────────────────────────────

export interface Seg {
  glyphs: Glyph[];
  x0: number; x1: number; top: number; bottom: number; base: number; size: number;
  /** Rovnoměrná mezera mezi znaky (prostrkání, pt); 0 = běžný text. */
  tracking?: number;
}

export interface Line { segs: Seg[]; x0: number; x1: number; top: number; bottom: number; base: number; size: number }

const segText = (s: Seg) => s.glyphs.map((g) => g.ch).join("");
export const lineText = (l: Line) => l.segs.map(segText).join(" ");

function mkSeg(glyphs: Glyph[]): Seg {
  const sizes = glyphs.map((g) => g.size).sort((a, b) => a - b);
  const size = sizes[sizes.length >> 1];
  const base = median(glyphs.filter((g) => Math.abs(g.size - size) < 0.5).map((g) => g.base));
  return {
    glyphs, size, base,
    x0: Math.min(...glyphs.map((g) => g.x)), x1: Math.max(...glyphs.map((g) => g.x + g.w)),
    top: base - size * 0.78, bottom: base + size * 0.22,
  };
}

function median(v: number[]): number {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b);
  return s[s.length >> 1];
}

/**
 * Glyfy → řádky (společné účaří) → segmenty (souvislý text bez velké mezery).
 * Mezera > `gapFactor` × velikost písma dělí segmenty: sloupce tabulek, text vlevo a vpravo.
 */
export function buildLines(glyphs: Glyph[], gapFactor = 1.6): Line[] {
  const gs = glyphs.filter((g) => g.visible && g.angle === 0 && g.ch !== "\u0000").sort((a, b) => a.base - b.base || a.x - b.x);
  const rows: Glyph[][] = [];
  for (const g of gs) {
    const row = rows.length ? rows[rows.length - 1] : null;
    const ref = row?.[0];
    // Horní/dolní index (rise) má jiné účaří, ale patří k řádku.
    if (row && ref && Math.abs(g.base - ref.base) <= Math.max(1.2, Math.min(g.size, ref.size) * 0.35)) row.push(g);
    else rows.push([g]);
  }
  const lines: Line[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    // Mezery mezi slovy na řádku: u textu zarovnaného do bloku jsou velké, ale stejné.
    const gaps: number[] = [];
    for (let k = 1; k < row.length; k++) { const gp = row[k].x - (row[k - 1].x + row[k - 1].w); if (gp > row[k].size * 0.12 && gp < row[k].size * gapFactor) gaps.push(gp); }
    const medGap = median(gaps);
    const segs: Seg[] = [];
    let cur: Glyph[] = [];
    let prevEnd = -Infinity, prevSize = 0;
    for (const g of row) {
      const gap = g.x - prevEnd;
      const lim = Math.max(Math.max(prevSize, g.size) * gapFactor, medGap * 2.5);
      // Dvě mezery za sebou nebo velký skok = nový segment (sloupec).
      if (cur.length && gap > lim) { segs.push(mkSeg(trimSpaces(cur))); cur = []; }
      if (g.space && !cur.length) continue;
      cur.push(g);
      prevEnd = Math.max(prevEnd, g.x + g.w); prevSize = g.size;
    }
    if (cur.length) segs.push(mkSeg(trimSpaces(cur)));
    const ok = segs.filter((s) => s.glyphs.length);
    if (!ok.length) continue;
    // Vložení mezer podle geometrie, kde PDF mezeru nemá (Skia/Chrome kreslí slova zvlášť).
    for (const s of ok) { s.tracking = trackingOf(s.glyphs); s.glyphs = withSpaces(s.glyphs, s.tracking); }
    lines.push({ segs: ok, x0: ok[0].x0, x1: ok[ok.length - 1].x1, top: Math.min(...ok.map((s) => s.top)), bottom: Math.max(...ok.map((s) => s.bottom)), base: median(ok.map((s) => s.base)), size: Math.max(...ok.map((s) => s.size)) });
  }
  return lines;
}

function trimSpaces(gs: Glyph[]): Glyph[] {
  let a = 0, b = gs.length;
  while (a < b && gs[a].space) a++;
  while (b > a && gs[b - 1].space) b--;
  return gs.slice(a, b);
}

/** Prostrkání: většina mezer mezi písmeny slova je kladná a stejná (CSS letter-spacing). */
function trackingOf(gs: Glyph[]): number {
  const gaps: number[] = [];
  for (let i = 1; i < gs.length; i++) if (!gs[i].space && !gs[i - 1].space) gaps.push(gs[i].x - (gs[i - 1].x + gs[i - 1].w));
  if (gaps.length < 4) return 0;
  const m = median(gaps), size = gs[0].size;
  if (m < size * 0.05) return 0;
  // Stejnoměrné: aspoň 60 % mezer do ±0,04 velikosti od mediánu.
  return gaps.filter((g) => Math.abs(g - m) < size * 0.04).length >= gaps.length * 0.6 ? m : 0;
}

function withSpaces(gs: Glyph[], tracking = 0): Glyph[] {
  const out: Glyph[] = [];
  for (let i = 0; i < gs.length; i++) {
    const g = gs[i], p = out[out.length - 1];
    if (p && !p.space && !g.space && g.x - (p.x + p.w) - tracking > Math.min(p.size, g.size) * 0.18) {
      out.push({ ...p, ch: " ", x: p.x + p.w, w: g.x - p.x - p.w, space: true });
    }
    // Sloučení vícenásobných mezer.
    if (g.space && p?.space) continue;
    out.push(g);
  }
  return out;
}

// ── Pravidla (čáry) a výplně ─────────────────────────────────────────────

export interface Rule { x0: number; x1: number; y0: number; y1: number; horiz: boolean; color: Rgb; width: number }
export interface FillBox { x: number; y: number; w: number; h: number; color: Rgb }

const isWhite = (c: Rgb) => c[0] > 245 && c[1] > 245 && c[2] > 245;

/** Vodorovné/svislé čáry (tenké obdélníky i úsečky) a podbarvené plochy. */
export function rulesAndFills(paths: PathShape[]): { rules: Rule[]; fills: FillBox[]; complex: PathShape[] } {
  const rules: Rule[] = [], fills: FillBox[] = [], complex: PathShape[] = [];
  for (const p of paths) {
    const b = p.bbox;
    if (p.rect && p.fill && !isWhite(p.fill)) {
      if (b.h <= 3 && b.w >= 8) { rules.push({ x0: b.x, x1: b.x + b.w, y0: b.y + b.h / 2, y1: b.y + b.h / 2, horiz: true, color: p.fill, width: Math.max(0.25, b.h) }); continue; }
      if (b.w <= 3 && b.h >= 8) { rules.push({ x0: b.x + b.w / 2, x1: b.x + b.w / 2, y0: b.y, y1: b.y + b.h, horiz: false, color: p.fill, width: Math.max(0.25, b.w) }); continue; }
      fills.push({ ...b, color: p.fill });
      continue;
    }
    if (p.stroke) {
      // Úsečky i obrys obdélníku (ohraničení buňky) rozložíme na hrany.
      const pts = p.segs.filter((s) => s.t === "M" || s.t === "L") as { t: string; x: number; y: number }[];
      let start: { x: number; y: number } | null = null, prev: { x: number; y: number } | null = null;
      for (const s of p.segs) {
        if (s.t === "M") { start = prev = s; continue; }
        if (s.t === "L" && prev) { addEdge(rules, prev, s, p); prev = s; continue; }
        if (s.t === "Z" && prev && start) { addEdge(rules, prev, start, p); prev = start; continue; }
        if (s.t === "C") { complex.push(p); break; }
      }
      if (!pts.length) complex.push(p);
      if (p.fill && !isWhite(p.fill) && p.rect && b.w > 3 && b.h > 3) fills.push({ ...b, color: p.fill });
      continue;
    }
    if (p.fill && !isWhite(p.fill)) {
      if (p.rect) fills.push({ ...b, color: p.fill });
      else complex.push(p);
    }
  }
  return { rules: mergeRules(rules), fills, complex };
}

function addEdge(rules: Rule[], a: { x: number; y: number }, b: { x: number; y: number }, p: PathShape) {
  const color = p.stroke ?? [0, 0, 0];
  if (Math.abs(a.y - b.y) < 0.8 && Math.abs(a.x - b.x) >= 4) rules.push({ x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: a.y, y1: a.y, horiz: true, color, width: p.lineWidth });
  else if (Math.abs(a.x - b.x) < 0.8 && Math.abs(a.y - b.y) >= 4) rules.push({ x0: a.x, x1: a.x, y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y), horiz: false, color, width: p.lineWidth });
}

/** Spojí na sebe navazující kousky téže čáry (LibreOffice kreslí ohraničení po buňkách). */
function mergeRules(rules: Rule[]): Rule[] {
  const out: Rule[] = [];
  const key = (r: Rule) => (r.horiz ? r.y0 : r.x0);
  const sorted = [...rules].sort((a, b) => Number(a.horiz) - Number(b.horiz) || key(a) - key(b) || (a.horiz ? a.x0 - b.x0 : a.y0 - b.y0));
  for (const r of sorted) {
    const p = out[out.length - 1];
    if (p && p.horiz === r.horiz && Math.abs(key(p) - key(r)) < 0.8 && sameColor(p.color, r.color)) {
      if (r.horiz && r.x0 <= p.x1 + 1.5) { p.x1 = Math.max(p.x1, r.x1); continue; }
      if (!r.horiz && r.y0 <= p.y1 + 1.5) { p.y1 = Math.max(p.y1, r.y1); continue; }
    }
    out.push({ ...r });
  }
  return out;
}

const sameColor = (a: Rgb, b: Rgb) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 12;
export const hex = (c: Rgb) => c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();

// ── QR a jiná husté vektorová grafika ────────────────────────────────────

/** Obdélníky v pořadí kreslení (i bílé: QR kreslí „díry“ poziční značky bílou výplní). */
export interface VectorCluster { x: number; y: number; w: number; h: number; rects: { x: number; y: number; w: number; h: number; color: Rgb }[]; color: Rgb }

/**
 * Shluky mnoha malých plných obdélníků (QR kód, čárový kód): v upravitelném režimu se
 * vykreslí do PNG bez převzorkování (přesně na mřížku modulů), aby zůstal čitelný.
 */
export function vectorClusters(paths: PathShape[]): { clusters: VectorCluster[]; used: Set<PathShape> } {
  const used = new Set<PathShape>();
  const rects: { x: number; y: number; w: number; h: number; color: Rgb; p: PathShape }[] = [];
  for (const p of paths) {
    if (!p.fill || p.stroke) continue;
    // Jedna cesta s mnoha obdélníkovými podcestami (Skia kreslí QR takhle).
    const sub = subRects(p);
    if (sub && sub.length >= 20) { for (const r of sub) rects.push({ ...r, color: p.fill, p }); continue; }
    if (p.rect && p.bbox.w < 12 && p.bbox.h < 12) rects.push({ ...p.bbox, color: p.fill, p });
  }
  const clusters: VectorCluster[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < rects.length; i++) {
    if (seen.has(i)) continue;
    const group = [i]; seen.add(i);
    for (let k = 0; k < group.length; k++) {
      const a = rects[group[k]];
      for (let j = 0; j < rects.length; j++) {
        if (seen.has(j)) continue;
        const b = rects[j];
        if (b.x <= a.x + a.w + 2 && b.x + b.w >= a.x - 2 && b.y <= a.y + a.h + 2 && b.y + b.h >= a.y - 2 && sameColor(a.color, b.color)) { seen.add(j); group.push(j); }
      }
    }
    if (group.length < 20) continue;
    const rs = group.map((g) => rects[g]);
    const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y));
    const w = Math.max(...rs.map((r) => r.x + r.w)) - x, h = Math.max(...rs.map((r) => r.y + r.h)) - y;
    if (w < 20 || h < 20) continue;
    // Všechny plné obdélníky uvnitř oblasti (i větší a bílé), v pořadí kreslení.
    const inside = (b: { x: number; y: number; w: number; h: number }) => b.x >= x - 1 && b.y >= y - 1 && b.x + b.w <= x + w + 1 && b.y + b.h <= y + h + 1;
    const ordered: VectorCluster["rects"] = [];
    for (const p of paths) {
      if (!p.fill || p.stroke || !inside(p.bbox)) continue;
      const sub = p.rect ? [p.bbox] : subRects(p);
      if (!sub) continue;
      used.add(p);
      for (const r of sub) ordered.push({ x: r.x, y: r.y, w: r.w, h: r.h, color: p.fill });
    }
    clusters.push({ x, y, w, h, rects: ordered, color: rs[0].color });
  }
  return { clusters, used };
}

function subRects(p: PathShape): { x: number; y: number; w: number; h: number }[] | null {
  const out: { x: number; y: number; w: number; h: number }[] = [];
  let pts: { x: number; y: number }[] = [];
  const flush = () => {
    if (!pts.length) return true;
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (!pts.every((q) => (Math.abs(q.x - x0) < 0.3 || Math.abs(q.x - x1) < 0.3) && (Math.abs(q.y - y0) < 0.3 || Math.abs(q.y - y1) < 0.3))) return false;
    out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    pts = [];
    return true;
  };
  for (const s of p.segs) {
    if (s.t === "C") return null;
    if (s.t === "M") { if (!flush()) return null; pts = [s]; }
    else if (s.t === "L") pts.push(s);
    else if (s.t === "Z") { if (!flush()) return null; }
  }
  if (!flush()) return null;
  return out;
}

// ── Tabulky ─────────────────────────────────────────────────────────────

interface TableRegion { x0: number; x1: number; y0: number; y1: number; rowYs: number[]; colXs: number[]; kind: "grid" | "rows" | "aligned" }

/**
 * Tabulky z čar. Mřížka = souvislá komponenta vodorovných a svislých čar, které se protínají
 * (i krátké čáry uvnitř sloučených buněk patří ke své tabulce). Zbylé vodorovné čáry se stejným
 * rozsahem nad sebou = tabulka „linky mezi řádky“ (faktury).
 */
function ruledRegions(rules: Rule[]): TableRegion[] {
  const hs = rules.filter((r) => r.horiz && r.x1 - r.x0 > 8).sort((a, b) => a.y0 - b.y0);
  const vs = rules.filter((r) => !r.horiz && r.y1 - r.y0 > 4);
  const touch = (h: Rule, v: Rule) => v.x0 >= h.x0 - 2.5 && v.x0 <= h.x1 + 2.5 && h.y0 >= v.y0 - 2.5 && h.y0 <= v.y1 + 2.5;
  // Union-find nad čarami.
  const all = [...hs, ...vs];
  const parent = all.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  hs.forEach((h, i) => vs.forEach((v, j) => { if (touch(h, v)) parent[find(i)] = find(hs.length + j); }));
  const comps = new Map<number, Rule[]>();
  all.forEach((r, i) => { const k = find(i); if (!comps.has(k)) comps.set(k, []); comps.get(k)!.push(r); });
  const regions: TableRegion[] = [];
  const inGrid = new Set<Rule>();
  for (const comp of comps.values()) {
    const ch = comp.filter((r) => r.horiz), cv = comp.filter((r) => !r.horiz);
    if (ch.length < 2 || cv.length < 2) continue;
    const x0 = Math.min(...comp.map((r) => r.x0)), x1 = Math.max(...comp.map((r) => r.x1));
    const y0 = Math.min(...comp.map((r) => r.y0)), y1 = Math.max(...comp.map((r) => r.y1));
    if (x1 - x0 < 30 || y1 - y0 < 8) continue;
    regions.push({ x0, x1, y0, y1, rowYs: dedupe(ch.map((r) => r.y0), 1.5), colXs: dedupe(cv.map((r) => r.x0), 2), kind: "grid" });
    for (const r of comp) inGrid.add(r);
  }
  // Linky mezi řádky: zbývající vodorovné čáry se stejným levým/pravým koncem nad sebou.
  const rest = hs.filter((h) => !inGrid.has(h) && h.x1 - h.x0 > 30);
  const used = new Set<Rule>();
  for (const h of rest) {
    if (used.has(h)) continue;
    const group = [h]; used.add(h);
    for (const o of rest) {
      if (used.has(o) || o.y0 < h.y0) continue;
      const last = group[group.length - 1];
      // Mezera výrazně větší než dosavadní řádky = další tabulka (nadpis, odstavec mezi nimi).
      const rowGaps = group.slice(1).map((r, k) => r.y0 - group[k].y0);
      const typical = rowGaps.length ? median(rowGaps) : 40;
      if (o.y0 - last.y0 > Math.max(30, typical * 1.6) || o.y0 - last.y0 > 120) break;
      if (Math.abs(o.x0 - h.x0) < 6 && Math.abs(o.x1 - h.x1) < 6) { group.push(o); used.add(o); }
    }
    const x0 = Math.min(...group.map((r) => r.x0)), x1 = Math.max(...group.map((r) => r.x1));
    const rowYs = dedupe(group.map((r) => r.y0), 1.5);
    if (rowYs.length >= 3 || (rowYs.length === 2 && rowYs[1] - rowYs[0] < 60)) {
      regions.push({ x0, x1, y0: rowYs[0], y1: rowYs[rowYs.length - 1], rowYs, colXs: [], kind: "rows" });
    }
  }
  return regions;
}

function dedupe(v: number[], tol: number): number[] {
  const s = [...v].sort((a, b) => a - b);
  const out: number[] = [];
  for (const x of s) if (!out.length || x - out[out.length - 1] > tol) out.push(x);
  return out;
}

/** Sloupce z promítnutí segmentů na osu x (sjednocení překrývajících se intervalů). */
function projectColumns(segs: Seg[], x0: number, x1: number): number[] {
  const iv = segs.map((s) => [s.x0, s.x1] as [number, number]).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [a, b] of iv) {
    const m = merged[merged.length - 1];
    if (m && a <= m[1] + 3) m[1] = Math.max(m[1], b);
    else merged.push([a, b]);
  }
  if (merged.length < 2) return [];
  const bounds = [x0];
  for (let i = 1; i < merged.length; i++) bounds.push((merged[i - 1][1] + merged[i][0]) / 2);
  bounds.push(x1);
  return bounds;
}

/** Tabulky bez čar: ≥3 po sobě jdoucí řádky s ≥2 segmenty zarovnanými do stejných sloupců. */
function alignedRegions(lines: Line[], taken: (l: Line) => boolean): TableRegion[] {
  const out: TableRegion[] = [];
  let run: Line[] = [];
  const flush = () => {
    if (run.length >= 3) {
      const segs = run.flatMap((l) => l.segs);
      const x0 = Math.min(...run.map((l) => l.x0)), x1 = Math.max(...run.map((l) => l.x1));
      const colXs = projectColumns(segs, x0, x1);
      const cols = colXs.length - 1;
      // Každý řádek musí mít obsah v aspoň 2 sloupcích a sloupce musí být ≥ 3 (jinak jde o odstavec vedle titulku).
      if (cols >= 3 && run.filter((l) => l.segs.length >= 2).length >= run.length * 0.7) {
        out.push({ x0, x1, y0: run[0].top - 2, y1: run[run.length - 1].bottom + 2, rowYs: [], colXs, kind: "aligned" });
      }
    }
    run = [];
  };
  for (const l of lines) {
    if (taken(l)) { flush(); continue; }
    const prev = run[run.length - 1];
    if (l.segs.length >= 2 && (!prev || l.top - prev.bottom < l.size * 1.6)) run.push(l);
    else { flush(); if (l.segs.length >= 2) run.push(l); }
  }
  flush();
  return out;
}

function borderOf(r: Rule): Border {
  return { color: hex(r.color), sz: Math.max(2, Math.min(96, Math.round(r.width * 8))) };
}

/** Postaví tabulku z oblasti: řádky podle čar nebo řádků textu, sloupce podle čar nebo textu. */
function buildTable(reg: TableRegion, lines: Line[], rules: Rule[], fills: FillBox[], fonts: Record<string, FontInfo>, ctx: LayoutCtx): Table | null {
  const inLines = lines.filter((l) => l.base > reg.y0 - 1 && l.top < reg.y1 + (reg.kind === "rows" || reg.kind === "grid" ? 0 : 2) && l.x1 > reg.x0 - 2 && l.x0 < reg.x1 + 2);
  // U tabulek „linky mezi řádky“ patří k tabulce i řádek záhlaví nad první čarou (je-li blízko).
  let extended = reg;
  if (reg.kind === "rows") {
    const above = lines.filter((l) => l.bottom <= reg.y0 + 1 && reg.y0 - l.bottom < l.size * 1.4 && l.segs.length >= 2 && l.x0 >= reg.x0 - 4 && l.x1 <= reg.x1 + 4);
    if (above.length) {
      const top = Math.min(...above.map((l) => l.top)) - 4;
      extended = { ...reg, y0: top, rowYs: [top, ...reg.rowYs] };
      inLines.unshift(...above.filter((l) => !inLines.includes(l)));
    }
  }
  if (!inLines.length) return null;
  const segs = inLines.flatMap((l) => l.segs.filter((s) => s.x1 > extended.x0 - 2 && s.x0 < extended.x1 + 2));
  let colXs = extended.colXs.length >= 2 ? extended.colXs : projectColumns(segs, extended.x0, extended.x1);
  if (colXs.length < 3) return null; // méně než 2 sloupce = není tabulka
  colXs = [extended.x0, ...colXs.slice(1, -1), extended.x1];

  // Hranice řádků: čáry; u „aligned“ a v rámci řádků víc řádků textu podle mezer.
  let rowYs = extended.rowYs.length >= 2 ? [...extended.rowYs] : [];
  if (extended.kind === "aligned") {
    rowYs = [extended.y0];
    const sorted = [...inLines].sort((a, b) => a.base - b.base);
    for (let i = 1; i < sorted.length; i++) {
      const p = sorted[i - 1], l = sorted[i];
      // Nový řádek tabulky začíná, když má obsah v prvním sloupci nebo je mezera větší než řádkování.
      const firstCol = l.segs.some((s) => s.x0 < colXs[1] - 1);
      if (firstCol || l.top - p.bottom > l.size * 0.6) rowYs.push((p.bottom + l.top) / 2);
    }
    rowYs.push(extended.y1);
  } else if (extended.kind === "rows" && rowYs[rowYs.length - 1] < Math.max(...inLines.map((l) => l.bottom)) - 1) {
    rowYs.push(Math.max(...inLines.map((l) => l.bottom)) + 4);
  }
  const nRows = rowYs.length - 1, nCols = colXs.length - 1;
  if (nRows < 1) return null;

  const rows: TableRow[] = [];
  const grid = extended.kind === "grid";
  const hRules = rules.filter((r) => r.horiz), vRules = rules.filter((r) => !r.horiz);
  const hAt = (y: number, xa: number, xb: number) => hRules.find((r) => Math.abs(r.y0 - y) < 2 && r.x0 <= xa + 2 && r.x1 >= xb - 2);
  const vAt = (x: number, ya: number, yb: number) => vRules.find((r) => Math.abs(r.x0 - x) < 2 && r.y0 <= ya + 2 && r.y1 >= yb - 2);
  // Text do buněk po glyfech (segment může přes hranici sloupce: „1 Položka…“ bez velké mezery).
  const cellLines = (r: number, c0: number, c1: number): Line[] => inLines
    .filter((l) => l.base > rowYs[r] && l.base <= rowYs[r + 1] + 1)
    .map((l) => {
      const segs = l.segs.map((sg) => sg.glyphs.filter((g) => { const cx = g.x + g.w / 2; return cx >= colXs[c0] - 0.5 && cx < colXs[c1 + 1] - 0.5; }))
        .map((gs) => trimSpaces(gs)).filter((gs) => gs.length).map((gs) => mkSeg(gs));
      return segs.length ? { ...l, segs, x0: segs[0].x0, x1: segs[segs.length - 1].x1 } : null;
    })
    .filter((l): l is Line => !!l);

  // Sloučené buňky: v mřížce chybí vnitřní čára mezi sousedními buňkami.
  const vMergeDown: boolean[][] = Array.from({ length: nRows }, () => Array(nCols).fill(false));
  for (let r = 0; r < nRows; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < nCols; c++) {
      let span = 1;
      if (grid) while (c + span < nCols && !vAt(colXs[c + span], rowYs[r], rowYs[r + 1])) span++;
      const top = grid ? hAt(rowYs[r], colXs[c], colXs[c + span]) : undefined;
      const mergedFromAbove = grid && r > 0 && !hAt(rowYs[r], colXs[c], colXs[c + span]) && !!rows[r - 1];
      if (mergedFromAbove) vMergeDown[r - 1][c] = true;
      const ls = cellLines(r, c, c + span - 1);
      const bx0 = colXs[c], bx1 = colXs[c + span];
      const borders: Borders = {};
      const tR = hAt(rowYs[r], bx0, bx1), bR = hAt(rowYs[r + 1], bx0, bx1);
      if (tR) borders.top = borderOf(tR);
      if (bR) borders.bottom = borderOf(bR);
      const lR = vAt(bx0, rowYs[r], rowYs[r + 1]), rR = vAt(bx1, rowYs[r], rowYs[r + 1]);
      if (lR) borders.left = borderOf(lR);
      if (rR) borders.right = borderOf(rR);
      void top;
      const cx = (bx0 + bx1) / 2, cy = (rowYs[r] + rowYs[r + 1]) / 2;
      const fill = fills.find((f) => cx > f.x && cx < f.x + f.w && cy > f.y && cy < f.y + f.h && f.w < (reg.x1 - reg.x0) * 1.05);
      const paras = paragraphs(ls, { x0: bx0 + 3, x1: bx1 - 3 }, fonts, ctx, true);
      cells.push({ blocks: paras.length ? paras : [emptyPara()], span, vMerge: mergedFromAbove ? "continue" : undefined, shade: fill ? hex(fill.color) : undefined, borders, valign: "top" });
      c += span - 1;
    }
    rows.push({ cells, height: rowYs[r + 1] - rowYs[r], top: rowYs[r] });
  }
  // vMerge restart tam, kde pokračování začíná.
  for (let r = 0; r < nRows - 1; r++) {
    let col = 0;
    for (const cell of rows[r].cells) {
      if (vMergeDown[r][col] && !cell.vMerge) cell.vMerge = "restart";
      col += cell.span;
    }
  }
  // Pokračující buňky nesmí nést text: svisle vystředěný text sloučené buňky (např. „Region“)
  // leží v pdf v dolním řádku, přesune se do první buňky sloučení, která dostane vAlign center.
  const restartAt = new Map<number, TableCell>();
  for (const row of rows) {
    let col = 0;
    for (const cell of row.cells) {
      if (cell.vMerge === "restart") restartAt.set(col, cell);
      else if (cell.vMerge === "continue") {
        const head = restartAt.get(col);
        const content = cell.blocks.filter((b) => b.kind !== "para" || b.runs.length);
        if (head && content.length) {
          head.blocks = [...head.blocks.filter((b) => b.kind !== "para" || b.runs.length), ...content];
          head.valign = "center";
        }
        cell.blocks = [emptyPara()];
      } else restartAt.delete(col);
      col += cell.span;
    }
  }

  return {
    kind: "table",
    x: colXs[0], colWidths: colXs.slice(1).map((x, i) => x - colXs[i]),
    rows, top: rowYs[0], bottom: rowYs[rowYs.length - 1],
    layout: false,
  };
}

function emptyPara(): Para {
  return { kind: "para", runs: [], align: "left", indLeft: 0, indRight: 0, indFirst: 0, before: 0, after: 0, line: null, top: 0, bottom: 0 };
}

// ── Odstavce ────────────────────────────────────────────────────────────

export interface LayoutCtx {
  bodySize: number;
  /** Velikosti nadpisů sestupně → úroveň 1..3. */
  headingSizes: number[];
  fontMap: (f: FontInfo | undefined) => { family: string; bold: boolean; italic: boolean };
  links: { x: number; y: number; w: number; h: number; url?: string }[];
}

const BULLETS = /^[•▪◦‣∙·●○■□–\-*]$/;
const NUMBERED = /^(\(?\d{1,3}[.)]|\(?[a-z][.)]|\(?[ivxlc]{1,5}[.)])$/i;

function segRuns(seg: Seg, fonts: Record<string, FontInfo>, ctx: LayoutCtx): Run[] {
  const runs: Run[] = [];
  for (const g of seg.glyphs) {
    const f = ctx.fontMap(fonts[g.font]);
    const color = hex(g.color);
    const link = ctx.links.find((l) => g.x + g.w / 2 >= l.x && g.x + g.w / 2 <= l.x + l.w && g.base >= l.y - 1 && g.base <= l.y + l.h + 2)?.url;
    const sizeHp = Math.round(g.size * 2) / 2;
    const last = runs[runs.length - 1];
    if (last && last.font === f.family && last.bold === f.bold && last.italic === f.italic && last.color === color && Math.abs(last.size - sizeHp) < 0.25 && last.link === link && last.spacing === (seg.tracking || undefined)) { last.text += g.ch; continue; }
    if (last && g.space && last.link === link) { last.text += " "; continue; }
    runs.push({ text: g.ch, font: f.family, bold: f.bold, italic: f.italic, size: sizeHp, color, link, rise: 0, spacing: seg.tracking || undefined });
  }
  return runs;
}

function lineRuns(l: Line, fonts: Record<string, FontInfo>, ctx: LayoutCtx): Run[] {
  const out: Run[] = [];
  l.segs.forEach((s, i) => {
    if (i) out.push({ ...(out[out.length - 1] ?? { font: "", bold: false, italic: false, size: s.size, color: "000000", rise: 0 }), text: "\t", link: undefined });
    out.push(...segRuns(s, fonts, ctx));
  });
  return out;
}

function appendRuns(target: Run[], add: Run[]) {
  for (const r of add) {
    const last = target[target.length - 1];
    if (last && last.font === r.font && last.bold === r.bold && last.italic === r.italic && last.color === r.color && last.size === r.size && last.link === r.link && last.spacing === r.spacing) last.text += r.text;
    else target.push({ ...r });
  }
}

/**
 * Řádky jedné oblasti (sloupec, buňka) → odstavce. `box` jsou hranice oblasti pro zarovnání
 * a odsazení. `inCell` = buňka tabulky (bez nadpisů a seznamů).
 */
export function paragraphs(lines: Line[], box: { x0: number; x1: number }, fonts: Record<string, FontInfo>, ctx: LayoutCtx, inCell = false): Para[] {
  const ls = [...lines].sort((a, b) => a.base - b.base || a.x0 - b.x0);
  const groups: Line[][] = [];
  for (const l of ls) {
    const g = groups[groups.length - 1];
    const p = g?.[g.length - 1];
    if (!g || !p) { groups.push([l]); continue; }
    const pitch = l.base - p.base;
    const prevPitch = g.length >= 2 ? p.base - g[g.length - 2].base : null;
    const sameSize = Math.abs(l.size - p.size) < 0.6;
    const first = firstToken(l);
    const startsItem = !inCell && (BULLETS.test(first) || NUMBERED.test(first)) && l.segs.length >= 1;
    const gapOk = pitch < l.size * 1.75 && (prevPitch == null || Math.abs(pitch - prevPitch) < l.size * 0.25);
    // Skutečné zalomení: první slovo řádku se nevešlo na konec předchozího (šířka oblasti).
    // Jinak předchozí řádek skončil záměrně (konec odstavce, řádky adresy, datumy vpravo).
    const width = box.x1 - box.x0;
    const wrapped = (p.x1 - p.x0) + firstWordWidth(l) + l.size * 0.25 > width - Math.max(2, l.size * 0.3);
    const multiSeg = l.segs.length > 1 || p.segs.length > 1;
    if (sameSize && gapOk && !startsItem && wrapped && !multiSeg) g.push(l);
    else groups.push([l]);
  }
  const paras: Para[] = [];
  let prevBottomBase: number | null = null;
  for (const g of groups) {
    const para = makePara(g, box, fonts, ctx, inCell);
    if (prevBottomBase != null) {
      const pitch = g.length >= 2 ? g[1].base - g[0].base : g[0].size * 1.17;
      para.before = Math.max(0, g[0].base - prevBottomBase - pitch);
    }
    prevBottomBase = g[g.length - 1].base;
    paras.push(para);
  }
  return joinLineBreaks(paras);
}

/**
 * Řádky oddělené ručním zalomením (Shift+Enter, `<w:br/>`) mají v PDF stejnou rozteč jako
 * řádky odstavce, ale nezalamují se. Jako samostatné jednořádkové odstavce by jejich výška
 * závisela na metrikách fontu v aplikaci, která DOCX zobrazí (posun ~0,3 pt na řádek), proto
 * se spojí do jednoho odstavce se zalomeními a roztečí z PDF.
 */
function joinLineBreaks(paras: Para[]): Para[] {
  const out: Para[] = [];
  for (const p of paras) {
    const prev = out[out.length - 1];
    const ok = prev && !prev.heading && !p.heading && !prev.list && !p.list && !prev.tabs && !p.tabs && p.runs.length && prev.runs.length &&
      prev.firstBase != null && prev.lastBase != null && p.firstBase != null && p.lastBase != null &&
      Math.abs((prev.size ?? 0) - (p.size ?? 0)) < 0.6 && prev.align === p.align && Math.abs(prev.indLeft - p.indLeft) < 1.5 && Math.abs(p.indFirst) < 1.5;
    if (ok) {
      const gap = p.firstBase! - prev.lastBase!;
      const size = p.size ?? 11;
      // Stejná rozteč jako uvnitř předchozího bloku (nebo běžné jednoduché řádkování).
      const inner = prev.line ?? null;
      const pitchOk = inner != null ? Math.abs(gap - inner) < 0.5 : gap < size * 1.45 && gap > size * 0.9;
      const innerOk = p.line == null || Math.abs(p.line - gap) < 0.5;
      // Rozteč menší než přirozený řádek by šla jen „přesně“, a to aplikace sázejí různě.
      const [asc, desc] = wordMetrics(prev.runs[0]?.font ?? "");
      const roomy = gap >= size * (asc + desc) * 0.98;
      if (pitchOk && innerOk && roomy) {
        prev.runs.push({ ...prev.runs[prev.runs.length - 1], text: "\n", link: undefined });
        prev.runs.push(...p.runs);
        prev.line = inner ?? gap;
        prev.lastBase = p.lastBase;
        prev.bottom = p.bottom;
        continue;
      }
    }
    out.push(p);
  }
  return out;
}

function firstWordWidth(l: Line): number {
  const gs = l.segs[0].glyphs;
  let end = gs.findIndex((g) => g.space);
  if (end < 0) end = gs.length;
  const w = end ? gs[end - 1].x + gs[end - 1].w - gs[0].x : 0;
  return Math.max(w, l.size * 0.5);
}

function firstToken(l: Line): string {
  const t = l.segs[0].glyphs.map((g) => g.ch).join("");
  return t.split(/\s/)[0] ?? "";
}

function makePara(g: Line[], box: { x0: number; x1: number }, fonts: Record<string, FontInfo>, ctx: LayoutCtx, inCell: boolean): Para {
  const runs: Run[] = [];
  let list: ListInfo | undefined;
  g.forEach((l, i) => {
    let lr = lineRuns(l, fonts, ctx);
    if (i === 0 && !inCell) {
      const tok = firstToken(l);
      if (BULLETS.test(tok) || NUMBERED.test(tok)) {
        // Odrážka nebo číslo: zbytek řádku je text položky (za značkou bývá mezera/tabulátor).
        const markerSeg = l.segs[0];
        const textX = l.segs.length > 1 ? l.segs[1].x0 : (markerSeg.glyphs.find((gl, k) => k > tok.length && !gl.space)?.x ?? markerSeg.x1);
        list = { kind: BULLETS.test(tok) ? "bullet" : "number", marker: tok, markerX: markerSeg.x0 - box.x0, textX: textX - box.x0, format: numberFormat(tok) };
        lr = stripMarker(lr, tok);
      }
    }
    if (i > 0) {
      const last = runs[runs.length - 1];
      if (last && !/[-‐­]$/.test(last.text)) last.text += " ";
    }
    appendRuns(runs, lr);
  });
  for (const r of runs) r.text = r.text.replace(/ {2,}/g, " ");
  const lefts = g.map((l) => l.x0 - box.x0), rights = g.map((l) => box.x1 - l.x1);
  const width = box.x1 - box.x0;
  const size = median(g.map((l) => l.size));
  const tol = Math.max(1.5, size * 0.25);
  const allEq = (v: number[]) => Math.max(...v) - Math.min(...v) < tol;
  let align: Align = "left";
  const centers = g.map((l) => (l.x0 + l.x1) / 2 - (box.x0 + box.x1) / 2);
  if (g.length >= 2) {
    const body = g.slice(0, -1);
    const bodyL = body.map((l) => l.x0 - box.x0), bodyR = body.map((l) => box.x1 - l.x1);
    if (allEq(bodyL.slice(1).concat(lefts.slice(-1))) && allEq(bodyR) && Math.min(...bodyR) < tol * 2) align = "both";
    else if (allEq(rights) && !allEq(lefts)) align = "right";
    else if (allEq(centers) && !allEq(lefts) && Math.abs(centers[0]) < tol * 2) align = "center";
  } else {
    if (rights[0] < tol && lefts[0] > tol * 2) align = "right";
    else if (Math.abs(centers[0]) < tol && lefts[0] > tol * 2) align = "center";
  }
  let indLeft = align === "left" || align === "both" ? Math.max(0, Math.min(...lefts.slice(g.length > 1 ? 1 : 0))) : 0;
  let indFirst = g.length > 1 && (align === "left" || align === "both") ? lefts[0] - indLeft : 0;
  if (g.length === 1 && (align === "left" || align === "both")) { indLeft = Math.max(0, lefts[0]); indFirst = 0; }
  if (list) { indLeft = list.textX; indFirst = -(list.textX - list.markerX); }
  // Víc segmentů na řádku (záhlaví „vlevo … vpravo“): zarážky podle skutečných pozic.
  let tabs: Para["tabs"];
  if (g.length === 1 && g[0].segs.length > 1) {
    tabs = g[0].segs.slice(1).map((sg) => (box.x1 - sg.x1 < tol * 2 ? { pos: sg.x1 - box.x0, val: "right" as const } : { pos: sg.x0 - box.x0, val: "left" as const }));
    align = "left"; indLeft = Math.max(0, lefts[0]); indFirst = 0;
  }
  const pitch = g.length >= 2 ? median(g.slice(1).map((l, i) => l.base - g[i].base)) : null;
  let heading: number | undefined;
  if (!inCell && !list && g.length <= 3) {
    const lvl = ctx.headingSizes.findIndex((s) => Math.abs(s - size) < 0.6);
    if (lvl >= 0) heading = lvl + 1;
  }
  void width;
  return {
    kind: "para", runs, align, indLeft, indRight: 0, indFirst, before: 0, after: 0,
    tabs, line: pitch, top: g[0].top, bottom: g[g.length - 1].bottom, firstBase: g[0].base, lastBase: g[g.length - 1].base, heading, list, size,
  };
}

function stripMarker(runs: Run[], marker: string): Run[] {
  const out = runs.map((r) => ({ ...r }));
  let rest = marker.length;
  while (out.length && rest > 0) {
    const r = out[0];
    const take = Math.min(rest, r.text.length);
    r.text = r.text.slice(take);
    rest -= take;
    if (!r.text) out.shift();
  }
  while (out.length && /^[\s\t]/.test(out[0].text)) { out[0].text = out[0].text.replace(/^[\s\t]+/, ""); if (!out[0].text) out.shift(); else break; }
  return out;
}

function numberFormat(tok: string): ListInfo["format"] {
  const t = tok.replace(/[().]/g, "");
  if (/^\d+$/.test(t)) return "decimal";
  if (/^[ivxlc]+$/.test(t) && t.length > 1) return "lowerRoman";
  if (/^[IVXLC]+$/.test(t) && t.length > 1) return "upperRoman";
  if (/^[a-z]$/.test(t)) return t === "i" ? "lowerRoman" : "lowerLetter";
  if (/^[A-Z]$/.test(t)) return "upperLetter";
  return "bullet";
}

// ── XY-cut ──────────────────────────────────────────────────────────────

interface Item { kind: "line"; line: Line; x0: number; x1: number; top: number; bottom: number }
interface ObjItem { kind: "obj"; block: Block; x0: number; x1: number; top: number; bottom: number }
type AnyItem = Item | ObjItem;

/** Rekurzivní dělení oblasti největší prázdnou mezerou (vodorovně, nebo svisle). */
function xyCut(items: AnyItem[], box: { x0: number; x1: number }, fonts: Record<string, FontInfo>, ctx: LayoutCtx, depth = 0): Block[] {
  if (!items.length) return [];
  // Svislý řez (sloupce vedle sebe): mezera v projekci na x přes celou výšku skupiny.
  const lineItems = items.filter((i) => i.kind === "line") as Item[];
  if (depth < 6 && items.length >= 2) {
    // Nejdřív sloupce přes celou skupinu (tekoucí text ve dvou sloupcích, i ze skenu, kde
    // mezery mezi řádky kolísají), pak vodorovné pásy oddělené prázdným místem.
    const whole = verticalCut(items, ctx.bodySize);
    if (whole) {
      const left = items.filter((i) => (i.x0 + i.x1) / 2 < whole), right = items.filter((i) => (i.x0 + i.x1) / 2 >= whole);
      if (isTextColumn(left) && isTextColumn(right)) {
        return [sideBySide([left, right], [{ x0: box.x0, x1: Math.max(...left.map((i) => i.x1)) }, { x0: Math.min(...right.map((i) => i.x0)), x1: box.x1 }], box, fonts, ctx, depth)];
      }
    }
    if (!whole) {
      const split = enablingHorizontalSplit(items, ctx.bodySize, true);
      if (split) return [...xyCut(split[0], box, fonts, ctx, depth + 1), ...xyCut(split[1], box, fonts, ctx, depth + 1)];
    }
    const bands = horizontalBands(items);
    if (bands.length > 1) return bands.flatMap((b) => xyCut(b, box, fonts, ctx, depth + 1));
    const cut = whole ?? verticalCut(items, ctx.bodySize);
    if (!cut) {
      // Nadpis přes celou šířku nad dvěma sloupci blokuje svislý řez: zkusíme vodorovné řezy
      // od největší mezery a vezmeme první, po kterém jde některá část rozdělit na sloupce.
      const split = enablingHorizontalSplit(items, ctx.bodySize);
      if (split) return [...xyCut(split[0], box, fonts, ctx, depth + 1), ...xyCut(split[1], box, fonts, ctx, depth + 1)];
    }
    if (cut) {
      const left = items.filter((i) => (i.x0 + i.x1) / 2 < cut), right = items.filter((i) => (i.x0 + i.x1) / 2 >= cut);
      if (left.length && right.length) {
        const lb = { x0: box.x0, x1: Math.max(...left.map((i) => i.x1)) };
        const rb = { x0: Math.min(...right.map((i) => i.x0)), x1: box.x1 };
        return [sideBySide([left, right], [lb, rb], box, fonts, ctx, depth)];
      }
    }
  }
  // List: odstavce z řádků, objekty (tabulky, obrázky) na své místo podle y.
  const out: Block[] = [];
  const objs = items.filter((i) => i.kind === "obj") as ObjItem[];
  const paras = paragraphs(lineItems.map((i) => i.line), box, fonts, ctx);
  const all: { y: number; b: Block }[] = [...paras.map((p) => ({ y: p.top, b: p as Block })), ...objs.map((o) => ({ y: o.top, b: o.block }))];
  all.sort((a, b) => a.y - b.y);
  for (const a of all) out.push(a.b);
  return out;
}

function horizontalBands(items: AnyItem[]): AnyItem[][] {
  const s = [...items].sort((a, b) => a.top - b.top);
  const bands: AnyItem[][] = [];
  let bottom = -Infinity;
  for (const it of s) {
    const size = it.kind === "line" ? it.line.size : 10;
    // Mezera alespoň ~0,9 řádku mezi bloky; řádky téhož odstavce jsou blíž.
    if (bands.length && it.top - bottom > size * 0.9) bands.push([it]);
    else if (bands.length) bands[bands.length - 1].push(it);
    else bands.push([it]);
    bottom = Math.max(bottom, it.bottom);
  }
  // Pás, který obsahuje vedle sebe ležící skupiny, necháme pohromadě (řeší ho svislý řez).
  return bands;
}

function enablingHorizontalSplit(items: AnyItem[], body: number, textColumnsOnly = false): [AnyItem[], AnyItem[]] | null {
  const s = [...items].sort((a, b) => a.top - b.top);
  const cands: { at: number; gap: number }[] = [];
  let bottom = s[0].bottom;
  for (let i = 1; i < s.length; i++) {
    if (s[i].top > bottom) cands.push({ at: i, gap: s[i].top - bottom });
    bottom = Math.max(bottom, s[i].bottom);
  }
  // Shora dolů: první řez, po kterém jde zbytek (nebo začátek) rozdělit na sloupce — tak
  // zůstanou sloupce v jednom bloku a odříznou se jen prvky přes celou šířku.
  for (const c of cands.slice(0, 40)) {
    const top = s.slice(0, c.at), rest = s.slice(c.at);
    // Jen řez, po kterém aspoň jedna část má sloupce s víc než jedním prvkem na každé straně.
    for (const part of [rest, top]) {
      if (part.length < 4) continue;
      const cut = verticalCut(part, body);
      if (!cut) continue;
      const l = part.filter((i) => i.x1 <= cut), r = part.filter((i) => i.x0 >= cut);
      if (textColumnsOnly ? isTextColumn(l) && isTextColumn(r) : l.length >= 2 && r.length >= 2) return [top, rest];
    }
  }
  return null;
}

function verticalCut(items: AnyItem[], body: number): number | null {
  const iv = items.map((i) => [i.x0, i.x1] as [number, number]).sort((a, b) => a[0] - b[0]);
  let end = iv[0][1], best: { gap: number; at: number } | null = null;
  for (let k = 1; k < iv.length; k++) {
    const [a, b] = iv[k];
    // Mezera přes celou výšku skupiny; slova jednoho řádku dělí jen mezery < 1,6 × písmo,
    // takže i užší sloupcová mezera (≈ 1 písmo) je spolehlivá.
    if (a > end && a - end > Math.max(body * 0.9, 9)) {
      if (!best || a - end > best.gap) best = { gap: a - end, at: (a + end) / 2 };
    }
    end = Math.max(end, b);
  }
  return best?.at ?? null;
}

/** Tekoucí text: hodně řádků a velká část z nich končí na stejném pravém okraji (do bloku / vlevo). */
function isTextColumn(g: AnyItem[]): boolean {
  const ls = g.filter((i) => i.kind === "line");
  if (ls.length < 6 || ls.length < g.length * 0.9) return false;
  const right = Math.max(...ls.map((i) => i.x1));
  // Tolerance i pro OCR (okraje slov ze skenu kolísají o víc než u textové vrstvy).
  const tol = Math.max(2.5, (ls[0].kind === "line" ? ls[0].line.size : 10) * 0.35);
  return ls.filter((i) => right - i.x1 < tol).length >= ls.length * 0.4;
}

/** Bloky vedle sebe → tabulka bez ohraničení (titulek | datumy), nebo sloupce textu. */
function sideBySide(groups: AnyItem[][], boxes: { x0: number; x1: number }[], box: { x0: number; x1: number }, fonts: Record<string, FontInfo>, ctx: LayoutCtx, depth: number): Block {
  if (groups.length === 2 && groups.every(isTextColumn)) {
    const ext = groups.map((g) => ({ x0: Math.min(...g.map((i) => i.x0)), x1: Math.max(...g.map((i) => i.x1)) }));
    const top = Math.min(...groups.flat().map((i) => i.top)), bottom = Math.max(...groups.flat().map((i) => i.bottom));
    const col: ColumnsBlock = {
      kind: "columns", x: ext[0].x0, widths: ext.map((e) => e.x1 - e.x0), gap: ext[1].x0 - ext[0].x1,
      cols: groups.map((g, i) => xyCut(g, ext[i], fonts, ctx, depth + 1)), top, bottom,
    };
    return col;
  }
  const cells: TableCell[] = groups.map((g, i) => ({ blocks: xyCut(g, boxes[i], fonts, ctx, depth + 1), span: 1, borders: {}, valign: "top" }));
  const bounds = [box.x0, ...boxes.slice(1).map((b, i) => (boxes[i].x1 + b.x0) / 2), box.x1];
  const top = Math.min(...groups.flat().map((i) => i.top)), bottom = Math.max(...groups.flat().map((i) => i.bottom));
  // Odstavce uvnitř buňky jsou zarovnané vůči hranicím buňky, ne vůči obsahu.
  groups.forEach((g, i) => { cells[i].blocks = xyCut(g, { x0: bounds[i] + (i ? 4 : 0), x1: bounds[i + 1] - (i < groups.length - 1 ? 4 : 0) }, fonts, ctx, depth + 1); });
  return { kind: "table", x: box.x0, colWidths: bounds.slice(1).map((x, i) => x - bounds[i]), rows: [{ cells, height: bottom - top, top }], top, bottom, layout: true };
}

// ── Stránka ─────────────────────────────────────────────────────────────

export interface PageInput { page: PageModel; headerLines: Set<Line>; lines: Line[] }

export function bodySizeOf(pages: PageModel[]): number {
  const count = new Map<number, number>();
  for (const p of pages) for (const g of p.glyphs) if (g.visible && g.ch.trim()) count.set(Math.round(g.size * 2) / 2, (count.get(Math.round(g.size * 2) / 2) ?? 0) + 1);
  let best = 11, n = 0;
  for (const [s, c] of count) if (c > n) { best = s; n = c; }
  return best;
}

/** Velikosti nadpisů: výrazně větší než text, max. 3 úrovně, jen u řádků s málo znaky. */
export function headingSizes(lines: Line[], body: number): number[] {
  const sizes = new Map<number, number>();
  for (const l of lines) {
    const s = Math.round(l.size * 2) / 2;
    if (s >= body * 1.18 && lineText(l).length < 120) sizes.set(s, (sizes.get(s) ?? 0) + 1);
  }
  return [...sizes.keys()].sort((a, b) => b - a).slice(0, 3);
}

export function layoutPage(page: PageModel, lines: Line[], margins: { left: number; right: number }, fonts: Record<string, FontInfo>, ctx: LayoutCtx, images: ImageBlock[]): Block[] {
  const { rules, fills } = rulesAndFills(page.paths);
  // 1) Tabulky z čar.
  const tables: Table[] = [];
  const takenLines = new Set<Line>();
  for (const reg of ruledRegions(rules)) {
    const t = buildTable(reg, lines, rules, fills, fonts, ctx);
    if (!t) continue;
    tables.push(t);
    for (const l of lines) if (l.base > t.top - 1 && l.base < t.bottom + 1 && l.x0 >= t.x - 4 && l.x1 <= t.x + t.colWidths.reduce((a, b) => a + b, 0) + 4) takenLines.add(l);
  }
  // 2) Tabulky bez čar.
  for (const reg of alignedRegions(lines, (l) => takenLines.has(l))) {
    const t = buildTable(reg, lines.filter((l) => !takenLines.has(l)), rules, fills, fonts, ctx);
    if (!t) continue;
    tables.push(t);
    for (const l of lines) if (l.base > t.top - 1 && l.base < t.bottom + 1) takenLines.add(l);
  }
  const usedRules = new Set<Rule>();
  for (const t of tables) for (const r of rules) if (r.horiz && r.y0 >= t.top - 2 && r.y0 <= t.bottom + 2 && r.x0 >= t.x - 4) usedRules.add(r);

  // 3) Samostatné vodorovné linky → ohraničení odstavce (dolní okraj předchozího bloku).
  const freeRules = rules.filter((r) => r.horiz && !usedRules.has(r) && r.x1 - r.x0 > (page.width - margins.left - margins.right) * 0.3);

  const items: AnyItem[] = [];
  // Položky XY-cutu jsou segmenty, ne celé řádky: titulek vlevo a datum vpravo sdílejí
  // účaří, ale patří do různých bloků.
  for (const l of lines) {
    if (takenLines.has(l)) continue;
    for (const sg of l.segs) {
      const one: Line = { segs: [sg], x0: sg.x0, x1: sg.x1, top: sg.top, bottom: sg.bottom, base: sg.base, size: sg.size };
      items.push({ kind: "line", line: one, x0: one.x0, x1: one.x1, top: one.top, bottom: one.bottom });
    }
  }
  for (const t of tables) items.push({ kind: "obj", block: t, x0: t.x, x1: t.x + t.colWidths.reduce((a, b) => a + b, 0), top: t.top, bottom: t.bottom });
  for (const im of images) items.push({ kind: "obj", block: im, x0: im.x, x1: im.x + im.w, top: im.y, bottom: im.y + im.h });
  for (const r of freeRules) items.push({ kind: "obj", block: { kind: "rule", color: hex(r.color), sz: Math.max(2, Math.round(r.width * 8)), x0: r.x0, x1: r.x1, y: r.y0 }, x0: r.x0, x1: r.x1, top: r.y0 - 0.5, bottom: r.y0 + 0.5 });

  const box = { x0: margins.left, x1: page.width - margins.right };
  return xyCut(items, box, fonts, ctx);
}

/** Opakující se řádky nahoře/dole na většině stran → záhlaví a zápatí (čísla stran jako pole). */
export function findHeaderFooter(pages: { page: PageModel; lines: Line[] }[]): { header: Set<Line>; footer: Set<Line>; headerText?: Line[]; footerText?: Line[] } {
  const header = new Set<Line>(), footer = new Set<Line>();
  if (pages.length < 2) return { header, footer };
  const norm = (l: Line) => lineText(l).replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
  const zone = (p: PageModel, l: Line) => (l.bottom < p.height * 0.1 ? "h" : l.top > p.height * 0.9 ? "f" : null);
  const counts = new Map<string, number>();
  for (const { page, lines } of pages) {
    const seen = new Set<string>();
    for (const l of lines) { const z = zone(page, l); if (!z) continue; const k = z + norm(l) + Math.round(l.x0 / 4); if (!seen.has(k)) { seen.add(k); counts.set(k, (counts.get(k) ?? 0) + 1); } }
  }
  const need = Math.max(2, Math.ceil(pages.length * 0.6));
  let headerText: Line[] | undefined, footerText: Line[] | undefined;
  for (const { page, lines } of pages) {
    const hs: Line[] = [], fs: Line[] = [];
    for (const l of lines) {
      const z = zone(page, l);
      if (!z) continue;
      if ((counts.get(z + norm(l) + Math.round(l.x0 / 4)) ?? 0) >= need) { (z === "h" ? header : footer).add(l); (z === "h" ? hs : fs).push(l); }
    }
    headerText ??= hs.length ? hs : undefined;
    footerText ??= fs.length ? fs : undefined;
  }
  return { header, footer, headerText, footerText };
}

/**
 * Okraje stránky z obsahu. Svisle podle řádků Wordu (účaří ± ascent/descent fontu), aby
 * první řádek stránky ležel na stejném účaří jako v originálu.
 */
export function marginsOf(page: PageModel, lines: Line[], fontMap?: (f: FontInfo | undefined) => { family: string }): { top: number; bottom: number; left: number; right: number } {
  const metric = (l: Line) => wordMetrics(fontMap ? fontMap(page.fonts[l.segs[0].glyphs[0]?.font]).family : "");
  const xs = lines.map((l) => l.x0), xe = lines.map((l) => l.x1);
  const ys = lines.map((l) => l.base - metric(l)[0] * l.size), ye = lines.map((l) => l.base + metric(l)[1] * l.size);
  for (const p of page.paths) { xs.push(p.bbox.x); xe.push(p.bbox.x + p.bbox.w); ys.push(p.bbox.y); ye.push(p.bbox.y + p.bbox.h); }
  for (const im of page.images) { xs.push(im.x); xe.push(im.x + im.w); ys.push(im.y); ye.push(im.y + im.h); }
  const clamp = (v: number) => Math.max(14, Math.min(144, v));
  if (!xs.length) return { top: 72, bottom: 72, left: 72, right: 72 };
  return {
    left: clamp(Math.min(...xs) - 1), right: clamp(page.width - Math.max(...xe) - 1),
    top: clamp(Math.min(...ys)), bottom: clamp(page.height - Math.max(...ye) - 2),
  };
}

export type { DocModel, PageLayout };
