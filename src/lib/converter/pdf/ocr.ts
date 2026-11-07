// OCR slova (tesseract) → glyfy pro rekonstrukci layoutu. Čistá funkce: prohlížeč (worker)
// i Node testy s tesseract CLI používají stejný kód.
import type { Glyph } from "./extract.ts";
import type { OcrWord } from "../protocol.ts";

/**
 * Slova z OCR → glyfy. Výška boxu slova kolísá (diakritika nad, dotahy pod), proto velikost
 * písma = výška typického slova / 0,85 a slova podobné výšky dostanou stejnou velikost; účaří
 * = spodní hrana boxu, u slov s dotahy (p, y, j, g, q) zvednutá o descent.
 */
export function ocrGlyphs(words: OcrWord[], im: { x: number; y: number }, sx: number, sy: number): Glyph[] {
  const hs = words.map((w) => (w.y1 - w.y0) * sy).sort((a, b) => a - b);
  const typical = hs[hs.length >> 1] || 10;
  // Narovnání (deskew): sken bývá pootočený, účaří by se přes šířku stránky posunulo o víc
  // než toleranci řádku. Svislé pozice se srovnají podle převládajícího sklonu řádků.
  const slopes = words.map((w) => w.slope).filter((v): v is number => v != null && Math.abs(v) < 0.1).sort((a, b) => a - b);
  const slope = slopes.length ? slopes[slopes.length >> 1] : 0;
  const cx0 = Math.min(...words.map((w) => w.x0)), cx1 = Math.max(...words.map((w) => w.x1));
  const mid = (cx0 + cx1) / 2;
  const full = words.filter((w) => /[bdfhklt]/.test(w.text) && /[gjpqy]/.test(w.text)).map((w) => (w.y1 - w.y0) * sy).sort((a, b) => a - b);
  const bodySize = full.length >= 3 ? full[full.length >> 1] / 0.97 : typical / 0.85;
  const rows = words.map((w) => w.rowHeight).filter((v): v is number => !!v).sort((a, b) => a - b);
  const medRow = rows.length ? rows[rows.length >> 1] : 0;
  const glyphs: Glyph[] = [];
  for (const w0 of words) {
    // Šum skenu: jednoznakové „slovo“ z interpunkce s nízkou jistotou.
    if (w0.text.length === 1 && /[^\p{L}\p{N}]/u.test(w0.text) && w0.confidence < 0.6) continue;
    const dy = slope * ((w0.x0 + w0.x1) / 2 - mid);
    const w = { ...w0, y0: w0.y0 - dy, y1: w0.y1 - dy, base: w0.base != null ? w0.base - dy : undefined };
    const x0 = im.x + w.x0 * sx, x1 = im.x + w.x1 * sx, bottom = im.y + w.y1 * sy;
    const h = (w.y1 - w.y0) * sy;
    // Velikost písma: slova s horním i dolním dotahem (např. „plynulá“) mají box ≈ 0,97 velikosti;
    // řádky vyšší/nižší než typický řádek (nadpisy) se škálují poměrem výšky řádku.
    const rel = w.rowHeight && medRow ? w.rowHeight / medRow : 1;
    let size = Math.abs(rel - 1) < 0.35 ? bodySize : bodySize * rel;
    if (!w.rowHeight && Math.abs(h - typical) > typical * 0.3) size = h / 0.85;
    size = Math.max(4, Math.round(size * 2) / 2);
    const base = w.base != null ? im.y + w.base * sy : /[gjpqyQ,;]/.test(w.text) ? bottom - size * 0.21 : bottom;
    // Slovo rozdělíme na znaky rovnoměrně: stačí pro řádky, odstavce a mezery mezi slovy.
    const chars = [...w.text];
    const cw = (x1 - x0) / Math.max(1, chars.length);
    chars.forEach((ch, k) => glyphs.push({ ch, x: x0 + k * cw, y: base - size * 0.78, w: cw, h: size, base, size, font: "ocr", color: [0, 0, 0], space: false, angle: 0, visible: true }));
  }
  return glyphs;
}




/**
 * Vícesloupcový sken: ve střední části šířky stránky je svislý pruh bez slov a vlevo i vpravo
 * od něj je text přes velkou část výšky. Nezávislé na rekonstrukci layoutu, aby uživatel dostal
 * varování o pořadí textu i tehdy, když rekonstrukce sloupce nepozná.
 */
export function isMultiColumn(glyphs: Glyph[], pageWidth: number): boolean {
  if (glyphs.length < 200) return false;
  const bins = 100, occ = new Array<number>(bins).fill(0);
  for (const g of glyphs) {
    const a = Math.max(0, Math.floor((g.x / pageWidth) * bins)), b = Math.min(bins - 1, Math.floor(((g.x + g.w) / pageWidth) * bins));
    for (let i = a; i <= b; i++) occ[i]++;
  }
  const busy = Math.max(...occ);
  for (let i = 30; i <= 70; i++) {
    if (occ[i] > busy * 0.02) continue;
    const left = occ.slice(0, i).some((v) => v > busy * 0.3), right = occ.slice(i + 1).some((v) => v > busy * 0.3);
    if (!left || !right) continue;
    // Text vlevo i vpravo od pruhu na velké části výšky stránky (ne jen podpis vedle razítka).
    const x = (i / bins) * pageWidth;
    const ys = (side: (g: Glyph) => boolean) => { const v = glyphs.filter(side).map((g) => g.base); return v.length ? Math.max(...v) - Math.min(...v) : 0; };
    const h = Math.max(...glyphs.map((g) => g.base)) - Math.min(...glyphs.map((g) => g.base));
    if (ys((g) => g.x + g.w < x) > h * 0.4 && ys((g) => g.x > x) > h * 0.4) return true;
  }
  return false;
}
