// PDF → model stránky: každý glyf s fontem, velikostí, barvou a pozicí, vektorové cesty
// (výplně, tahy, čáry) a obrázky v původním rozlišení. Prochází operator list pdf.js 6 se
// zásobníkem grafického stavu (CTM, barvy, textový stav) — getTextContent nedává barvy
// ani přesné pozice znaků.
//
// Souřadnice výstupu: body PDF (1/72"), počátek vlevo nahoře, y dolů (jako DOCX).
import type * as Pdfjs from "pdfjs-dist";

type Matrix = [number, number, number, number, number, number];
export type Rgb = [number, number, number];

export interface Glyph {
  ch: string;
  /** Levý horní roh a rozměry bboxu (výška = velikost písma). */
  x: number; y: number; w: number; h: number;
  /** Účaří (baseline) v souřadnicích stránky. */
  base: number;
  size: number;
  font: string;
  color: Rgb;
  /** Mezera z PDF (glyph.isSpace) — pro rozdělení slov. */
  space: boolean;
  /** Natočení textu (0 = vodorovně). */
  angle: number;
  /** MCID pro strukturní strom tagovaného PDF. */
  mcid?: number;
  /** Viditelný (Tr ≠ 3, tj. ne neviditelná OCR vrstva). */
  visible: boolean;
}

export interface FontInfo {
  id: string;
  /** PostScript jméno bez prefixu subsetu (ABCDEF+). */
  name: string;
  family: string;
  bold: boolean;
  italic: boolean;
  serif: boolean;
  mono: boolean;
}

export type PathSeg = { t: "M" | "L"; x: number; y: number } | { t: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number } | { t: "Z" };

export interface PathShape {
  segs: PathSeg[];
  fill?: Rgb;
  stroke?: Rgb;
  lineWidth: number;
  bbox: { x: number; y: number; w: number; h: number };
  /** Osově zarovnaný obdélník (re nebo 4 úsečky). */
  rect: boolean;
}

export interface ImageItem {
  id: string;
  x: number; y: number; w: number; h: number;
  /** Pixelová velikost původního obrázku. */
  pxW: number; pxH: number;
  /** PNG, bez převzorkování. */
  png?: Uint8Array;
  mask?: boolean;
}

export interface LinkItem { x: number; y: number; w: number; h: number; url?: string; dest?: string }

export interface PageModel {
  index: number;
  width: number;
  height: number;
  glyphs: Glyph[];
  paths: PathShape[];
  images: ImageItem[];
  links: LinkItem[];
  fonts: Record<string, FontInfo>;
  /** Strukturní strom (tagované PDF), jak ho vrací pdf.js. */
  struct?: unknown;
  /** Stránka nemá (viditelnou) textovou vrstvu, ale má obrázky → kandidát na OCR. */
  scanned: boolean;
}

const mul = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
  a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5],
];
const apply = (m: Matrix, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

function parseColor(args: unknown[]): Rgb {
  const a = args[0];
  if (typeof a === "string" && /^#[0-9a-f]{6}$/i.test(a)) return [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  if (args.length >= 3 && typeof args[0] === "number") return [Number(args[0]), Number(args[1]), Number(args[2])].map((v) => Math.round(v <= 1 && args.every((x) => Number(x) <= 1) ? v * 255 : v)) as Rgb;
  return [0, 0, 0];
}

/** "ABCDEF+LiberationSans-BoldItalic" → rodina "Liberation Sans", bold, italic. */
export function parseFontName(raw: string, flags: { bold?: boolean; italic?: boolean; serif?: boolean; mono?: boolean } = {}): Omit<FontInfo, "id"> {
  const name = raw.replace(/^[A-Z]{6}\+/, "");
  const [fam0, style0 = ""] = name.split(/[-,]/);
  const style = style0.toLowerCase() + " " + name.toLowerCase();
  const bold = !!flags.bold || /bold|black|heavy|semibold|demi/.test(style);
  const italic = !!flags.italic || /italic|oblique|it$/.test(style0.toLowerCase());
  // CamelCase → slova ("LiberationSans" → "Liberation Sans", "TimesNewRomanPSMT" → "Times New Roman").
  let family = fam0.replace(/(PS)?MT$/, "").replace(/PS$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").trim();
  if (!family) family = "Liberation Sans";
  return { name, family, bold, italic, serif: !!flags.serif, mono: !!flags.mono || /mono|courier|consol/i.test(name) };
}

interface TextState {
  font: string; size: number; charSpacing: number; wordSpacing: number; hScale: number; leading: number; rise: number;
  tm: Matrix; tlm: Matrix; render: number; fontMatrix: number[]; vertical: boolean;
}
interface GState { ctm: Matrix; fill: Rgb; stroke: Rgb; lineWidth: number; text: TextState }

const IDENT: Matrix = [1, 0, 0, 1, 0, 0];

export async function extractPage(pdfjs: typeof Pdfjs, page: Pdfjs.PDFPageProxy, index: number): Promise<PageModel> {
  const vp = page.getViewport({ scale: 1 });
  const width = vp.width, height = vp.height;
  // Viewport transform: PDF (y nahoru, MediaBox/CropBox, rotace) → stránka (y dolů).
  const view = vp.transform as Matrix;
  const ops = await page.getOperatorList();
  const OPS = pdfjs.OPS as unknown as Record<string, number>;
  const name: Record<number, string> = {};
  for (const [k, v] of Object.entries(OPS)) name[v] = k;

  const fonts: Record<string, FontInfo> = {};
  const fontObj = (id: string): { name?: string; bold?: boolean; italic?: boolean; black?: boolean; isSerifFont?: boolean; isMonospace?: boolean; fontMatrix?: number[]; vertical?: boolean } | null => {
    try { return page.commonObjs.get(id) as never; } catch { return null; }
  };

  const glyphs: Glyph[] = [];
  const paths: PathShape[] = [];
  const images: ImageItem[] = [];
  const stack: GState[] = [];
  let g: GState = {
    ctm: IDENT, fill: [0, 0, 0], stroke: [0, 0, 0], lineWidth: 1,
    text: { font: "", size: 0, charSpacing: 0, wordSpacing: 0, hScale: 1, leading: 0, rise: 0, tm: IDENT, tlm: IDENT, render: 0, fontMatrix: [0.001, 0, 0, 0.001, 0, 0], vertical: false },
  };
  const mcids: (number | undefined)[] = [];
  const clone = (s: GState): GState => ({ ...s, text: { ...s.text } });
  const pageMatrix = () => mul(g.ctm, view);

  const showGlyphs = (items: unknown[]) => {
    const t = g.text;
    const fm = t.fontMatrix;
    const mcid = mcids.findLast((m) => m !== undefined);
    for (const it of items) {
      if (typeof it === "number") {
        // TJ posun v tisícinách jednotky textového prostoru.
        const dx = (-it / 1000) * t.size * t.hScale;
        t.tm = mul([1, 0, 0, 1, dx, 0], t.tm);
        continue;
      }
      const gl = it as { unicode?: string; width?: number; isSpace?: boolean; vmetric?: number[] } | null;
      if (!gl) continue;
      const advance = (gl.width ?? 0) * fm[0] * t.size;
      const spacing = t.charSpacing + (gl.isSpace ? t.wordSpacing : 0);
      const trm = mul(mul([t.size * t.hScale, 0, 0, t.size, 0, t.rise], t.tm), pageMatrix());
      const [x0, y0] = apply(trm, 0, 0);
      const [x1, y1] = apply(trm, advance / t.size, 0);
      const [xt, yt] = apply(trm, 0, 1);
      const size = Math.hypot(xt - x0, yt - y0);
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const w = Math.hypot(x1 - x0, y1 - y0);
      const ch = gl.unicode ?? "";
      if (ch && size > 0.1) {
        glyphs.push({
          ch, x: Math.min(x0, x1), y: y0 - size * 0.8, w, h: size, base: y0, size, font: t.font, color: g.fill,
          // isSpace z pdf.js = kód znaku 32 v kódování fontu, v subsetech to bývá i čárka.
          space: /^\s+$/.test(ch), angle: Math.abs(angle) < 0.01 ? 0 : angle, mcid, visible: t.render !== 3 && t.render !== 7,
        });
      }
      t.tm = mul([1, 0, 0, 1, (advance + spacing) * t.hScale, 0], t.tm);
    }
  };

  const fnArray = ops.fnArray, argsArray = ops.argsArray;
  for (let i = 0; i < fnArray.length; i++) {
    const op = name[fnArray[i]];
    const args = (argsArray[i] ?? []) as unknown[];
    const t = g.text;
    switch (op) {
      case "save": stack.push(clone(g)); break;
      case "restore": g = stack.pop() ?? g; break;
      case "transform": g.ctm = mul(args as Matrix, g.ctm); break;
      case "setFillRGBColor": g.fill = parseColor(args); break;
      case "setStrokeRGBColor": g.stroke = parseColor(args); break;
      case "setFillGray": { const v = Math.round(Number(args[0]) * 255); g.fill = [v, v, v]; break; }
      case "setStrokeGray": { const v = Math.round(Number(args[0]) * 255); g.stroke = [v, v, v]; break; }
      case "setLineWidth": g.lineWidth = Number(args[0]); break;
      case "beginText": t.tm = IDENT; t.tlm = IDENT; break;
      case "setFont": {
        const id = String(args[0]);
        t.font = id; t.size = Number(args[1]);
        const fo = fontObj(id);
        if (fo) {
          t.fontMatrix = fo.fontMatrix ?? [0.001, 0, 0, 0.001, 0, 0];
          t.vertical = !!fo.vertical;
          if (!fonts[id]) fonts[id] = { id, ...parseFontName(fo.name ?? "Unknown", { bold: fo.bold || fo.black, italic: fo.italic, serif: fo.isSerifFont, mono: fo.isMonospace }) };
        }
        break;
      }
      case "setCharSpacing": t.charSpacing = Number(args[0]); break;
      case "setWordSpacing": t.wordSpacing = Number(args[0]); break;
      case "setHScale": t.hScale = Number(args[0]) / 100; break;
      case "setLeading": t.leading = Number(args[0]); break;
      case "setTextRise": t.rise = Number(args[0]); break;
      case "setTextRenderingMode": t.render = Number(args[0]); break;
      case "setTextMatrix": t.tm = t.tlm = args.length >= 6 ? (args.slice(0, 6) as Matrix) : (args[0] as Matrix); break;
      case "moveText": t.tlm = t.tm = mul([1, 0, 0, 1, Number(args[0]), Number(args[1])], t.tlm); break;
      case "setLeadingMoveText": t.leading = -Number(args[1]); t.tlm = t.tm = mul([1, 0, 0, 1, Number(args[0]), Number(args[1])], t.tlm); break;
      case "nextLine": t.tlm = t.tm = mul([1, 0, 0, 1, 0, -t.leading], t.tlm); break;
      case "showText": case "showSpacedText": showGlyphs((args[0] as unknown[]) ?? []); break;
      case "nextLineShowText": t.tlm = t.tm = mul([1, 0, 0, 1, 0, -t.leading], t.tlm); showGlyphs((args[0] as unknown[]) ?? []); break;
      case "nextLineSetSpacingShowText": t.wordSpacing = Number(args[0]); t.charSpacing = Number(args[1]); t.tlm = t.tm = mul([1, 0, 0, 1, 0, -t.leading], t.tlm); showGlyphs((args[2] as unknown[]) ?? []); break;
      case "beginMarkedContentProps": {
        const props = args[1] as { mcid?: number } | null;
        mcids.push(typeof props?.mcid === "number" ? props.mcid : undefined);
        break;
      }
      case "beginMarkedContent": mcids.push(undefined); break;
      case "endMarkedContent": mcids.pop(); break;
      case "constructPath": {
        const paintOp = name[Number(args[0])] ?? "";
        const data = (args[1] as unknown[])?.[0] as ArrayLike<number> | null;
        if (!data || /^endPath|clip/i.test(paintOp)) break;
        const shape = pathShape(data, pageMatrix(), paintOp, g);
        if (shape) paths.push(shape);
        break;
      }
      case "paintImageXObject": case "paintInlineImageXObject": case "paintImageMaskXObject": {
        // Obrázek zabírá jednotkový čtverec v CTM.
        const m = pageMatrix();
        const pts = [apply(m, 0, 0), apply(m, 1, 0), apply(m, 0, 1), apply(m, 1, 1)];
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        const x = Math.min(...xs), y = Math.min(...ys);
        const id = typeof args[0] === "string" ? args[0] : `inline-${i}`;
        const inline = typeof args[0] === "object" ? (args[0] as { width?: number; height?: number }) : null;
        images.push({ id, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, pxW: Number(inline?.width ?? args[1] ?? 0), pxH: Number(inline?.height ?? args[2] ?? 0), mask: op === "paintImageMaskXObject" });
        break;
      }
      default: break;
    }
  }

  const links: LinkItem[] = [];
  try {
    for (const a of (await page.getAnnotations()) as { subtype?: string; rect?: number[]; url?: string; unsafeUrl?: string; dest?: unknown }[]) {
      if (a.subtype !== "Link" || !a.rect) continue;
      const [x1, y1] = apply(view, a.rect[0], a.rect[1]), [x2, y2] = apply(view, a.rect[2], a.rect[3]);
      const url = a.url ?? a.unsafeUrl;
      links.push({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), url: url && /^(https?|mailto):/i.test(url) ? url : undefined, dest: typeof a.dest === "string" ? a.dest : undefined });
    }
  } catch { /* poškozené anotace: odkazy vynecháme */ }

  let struct: unknown;
  try { struct = await page.getStructTree(); } catch { struct = undefined; }

  const visibleText = glyphs.some((gl) => gl.visible && gl.ch.trim());
  const imageArea = images.reduce((s, im) => s + im.w * im.h, 0);
  return { index, width, height, glyphs, paths, images, links, fonts, struct, scanned: !visibleText && imageArea > width * height * 0.3 };
}

function pathShape(data: ArrayLike<number>, m: Matrix, paintOp: string, g: GState): PathShape | null {
  const segs: PathSeg[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const pt = (x: number, y: number) => {
    const [px, py] = apply(m, x, y);
    minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    return [px, py];
  };
  for (let i = 0; i < data.length;) {
    const op = data[i++];
    if (op === 0 || op === 1) { const [x, y] = pt(data[i++], data[i++]); segs.push({ t: op === 0 ? "M" : "L", x, y }); }
    else if (op === 2) { const [x1, y1] = pt(data[i++], data[i++]); const [x2, y2] = pt(data[i++], data[i++]); const [x, y] = pt(data[i++], data[i++]); segs.push({ t: "C", x1, y1, x2, y2, x, y }); }
    else if (op === 3) { const [x1, y1] = pt(data[i++], data[i++]); const [x, y] = pt(data[i++], data[i++]); segs.push({ t: "C", x1, y1, x2: x1, y2: y1, x, y }); }
    else if (op === 4) segs.push({ t: "Z" });
    else break;
  }
  if (!segs.length || !Number.isFinite(minX)) return null;
  const fill = /fill|eoFill/i.test(paintOp) ? g.fill : undefined;
  const stroke = /stroke/i.test(paintOp) ? g.stroke : undefined;
  if (!fill && !stroke) return null;
  const scale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  const lines = segs.filter((s) => s.t !== "Z");
  const rect = lines.length >= 4 && lines.length <= 5 && !segs.some((s) => s.t === "C") &&
    lines.every((s) => "x" in s && (Math.abs(s.x - minX) < 0.5 || Math.abs(s.x - maxX) < 0.5) && (Math.abs(s.y - minY) < 0.5 || Math.abs(s.y - maxY) < 0.5));
  return { segs, fill, stroke, lineWidth: g.lineWidth * scale, bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }, rect };
}
