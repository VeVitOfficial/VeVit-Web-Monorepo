// OCR slova (tesseract) → glyfy pro rekonstrukci layoutu. Čistá funkce: prohlížeč (worker)
// i Node testy s tesseract CLI používají stejný kód.
import type { FontInfo, Glyph } from "./extract.ts";
import type { OcrWord } from "../protocol.ts";
import { CHARS, WIDTHS } from "./ocr-widths.ts";

const SERIF = new Set(["Liberation Serif", "Caladea"]);
/** Fonty pro text z OCR (id glyfu `ocr:<rodina>`); volající je přidá do `PageModel.fonts`. */
export const OCR_FONTS: Record<string, FontInfo> = Object.fromEntries(Object.keys(WIDTHS).map((family) => [`ocr:${family}`, { id: `ocr:${family}`, name: family, family, bold: false, italic: false, serif: SERIF.has(family), mono: false }]));
export const isOcrFont = (id: string | undefined) => !!id?.startsWith("ocr");

const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const charIndex = new Map([...CHARS].map((c, i) => [c, i]));
const emWidth = (text: string, w: number[]) => { let s = 0; for (const c of text) s += w[charIndex.get(c) ?? charIndex.get("n")!]; return s / 1000; };

/**
 * Rodina a velikost písma podle šířek slov: pro správný font vyjde „šířková velikost“
 * (šířka slova / šířka textu v em) u všech slov skoro stejně, u cizího fontu se rozptyluje podle
 * toho, která písmena slovo obsahuje. Vybere se rodina s nejmenším mezikvartilovým rozpětím.
 */
export function fitOcrFont(words: { text: string; width: number; confidence: number }[]): { family: string; size: number; spread: number } | null {
  const sample = words.filter((w) => w.confidence > 0.8 && [...w.text].length >= 4 && [...w.text].every((c) => charIndex.has(c)));
  if (sample.length < 20) return null;
  let best: { family: string; size: number; spread: number } | null = null;
  for (const [family, table] of Object.entries(WIDTHS)) {
    const v = sample.map((w) => w.width / emWidth(w.text, table)).sort((a, b) => a - b);
    const q = (f: number) => v[Math.floor((v.length - 1) * f)];
    const spread = (q(0.75) - q(0.25)) / q(0.5);
    if (!best || spread < best.spread) best = { family, size: q(0.5), spread };
  }
  return best;
}

/**
 * Slova z OCR → glyfy. Výška boxu slova kolísá (diakritika nad, dotahy pod), proto velikost
 * písma = výška typického slova / 0,85 a slova podobné výšky dostanou stejnou velikost; účaří
 * = spodní hrana boxu, u slov s dotahy (p, y, j, g, q) zvednutá o descent.
 */
export function ocrGlyphs(words: OcrWord[], im: { x: number; y: number }, sx: number, sy: number): Glyph[] {
  const hs = words.map((w) => (w.y1 - w.y0) * sy).sort((a, b) => a - b);
  const typical = hs[hs.length >> 1] || 10;
  // Narovnání (deskew): sken bývá pootočený, účaří by se přes šířku stránky posunulo o víc
  // než toleranci řádku. Pozice se otočí zpět podle převládajícího sklonu řádků.
  const slopes = words.map((w) => w.slope).filter((v): v is number => v != null && Math.abs(v) < 0.1).sort((a, b) => a - b);
  const slope = slopes.length ? slopes[slopes.length >> 1] : 0;
  const cx0 = Math.min(...words.map((w) => w.x0)), cx1 = Math.max(...words.map((w) => w.x1));
  const mid = (cx0 + cx1) / 2, midY = (Math.min(...words.map((w) => w.y0)) + Math.max(...words.map((w) => w.y1))) / 2;
  const full = words.filter((w) => /[bdfhklt]/.test(w.text) && /[gjpqy]/.test(w.text)).map((w) => (w.y1 - w.y0) * sy).sort((a, b) => a - b);
  const bodySize = full.length >= 3 ? full[full.length >> 1] / 0.97 : typical / 0.85;
  const rows = words.map((w) => w.rowHeight).filter((v): v is number => !!v).sort((a, b) => a - b);
  const medRow = rows.length ? rows[rows.length >> 1] : 0;
  // Font z šířek slov: stejná rodina a velikost jako v originále = stejné zalomení řádků. Šířková
  // velikost je přesnější než výšková (box slova závisí na diakritice a dotazích); výšková zůstává,
  // když fit selže nebo se od ní šířková liší o víc než čtvrtinu (např. prostrkaný text).
  const fit = fitOcrFont(words.filter((w) => !w.rowHeight || !medRow || Math.abs(w.rowHeight / medRow - 1) < 0.35).map((w) => ({ text: w.text, width: (w.x1 - w.x0) * sx, confidence: w.confidence })));
  const family = fit && fit.spread < 0.04 ? fit.family : "Liberation Serif";
  const fitted = fit && fit.spread < 0.04 && Math.abs(fit.size / bodySize - 1) < 0.25 ? fit.size : 0;
  const text = words.map((w) => w.text).join("");
  const meanEm = emWidth(text, WIDTHS[family]) / Math.max(1, [...text].length);
  // Velikost nadpisů (řádky jiné výšky než tělo) taky ze šířky slov celého řádku: výška řádku
  // z OCR zahrnuje diakritiku a dotahy, u krátkých nadpisů ji nadsadí o čtvrtinu i víc.
  const lineSize = new Map<number, number>();
  if (fitted) {
    const byLine = new Map<number, number[]>();
    for (const w of words) if (w.line != null && [...w.text].length >= 2) byLine.set(w.line, [...(byLine.get(w.line) ?? []), ((w.x1 - w.x0) * sx) / emWidth(w.text, WIDTHS[family])]);
    for (const [k, v] of byLine) lineSize.set(k, median(v));
  }
  const glyphs: Glyph[] = [];
  for (const w0 of words) {
    // Šum skenu: jednoznakové „slovo“ z interpunkce s nízkou jistotou, nebo drobná tečka (box
    // menší než třetina typické výšky slova), kterou OCR přečte jako písmeno.
    if (w0.text.length === 1 && w0.confidence < 0.6 && (/[^\p{L}\p{N}]/u.test(w0.text) || (w0.y1 - w0.y0) * sy < typical / 3)) continue;
    // Otočení kolem středu: svislé okraje sloupců ujíždějí o sklon × výška stejně jako účaří.
    const dy = slope * ((w0.x0 + w0.x1) / 2 - mid), dx = slope * ((w0.y0 + w0.y1) / 2 - midY);
    const w = { ...w0, x0: w0.x0 + dx, x1: w0.x1 + dx, y0: w0.y0 - dy, y1: w0.y1 - dy, base: w0.base != null ? w0.base - dy : undefined };
    const x0 = im.x + w.x0 * sx, x1 = im.x + w.x1 * sx, bottom = im.y + w.y1 * sy;
    const h = (w.y1 - w.y0) * sy;
    // Velikost písma: slova s horním i dolním dotahem (např. „plynulá“) mají box ≈ 0,97 velikosti;
    // řádky vyšší/nižší než typický řádek (nadpisy) se škálují poměrem výšky řádku.
    const rel = w.rowHeight && medRow ? w.rowHeight / medRow : 1;
    const body = fitted || bodySize;
    const heading = w.line != null ? lineSize.get(w.line) : undefined;
    let size = Math.abs(rel - 1) < 0.35 ? body : heading && Math.abs(heading / (body * rel) - 1) < 0.4 ? heading : body * rel;
    if (!w.rowHeight && Math.abs(h - typical) > typical * 0.3) size = h / 0.85;
    const exact = size;
    size = Math.max(4, Math.round(size * 2) / 2);
    // Zaokrouhlení na půl bodu (víc Word neumí) mění šířku řádku až o 2–5 %; zbytek dorovná
    // prostrkání, aby řádky v DOCX zalomily stejně jako ve skenu.
    const tracking = fitted && Math.abs(rel - 1) < 0.35 ? (exact - size) * meanEm : 0;
    const base = w.base != null ? im.y + w.base * sy : /[gjpqyQ,;]/.test(w.text) ? bottom - size * 0.21 : bottom;
    // Slovo rozdělíme na znaky rovnoměrně: stačí pro řádky, odstavce a mezery mezi slovy.
    const chars = [...w.text];
    const cw = (x1 - x0) / Math.max(1, chars.length);
    chars.forEach((ch, k) => glyphs.push({ ch, x: x0 + k * cw, y: base - size * 0.78, w: cw, h: size, base, size, font: `ocr:${family}`, color: [0, 0, 0], space: false, angle: 0, visible: true, ...(tracking ? { tracking } : {}) }));
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
