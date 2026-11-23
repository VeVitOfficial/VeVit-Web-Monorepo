// Fonty pro DOCX → PDF. Prohlížeč nevidí systémové fonty uživatele, proto:
//  1. zjistíme, které rodiny dokument žádá (rFonts v XML + motiv dokumentu),
//  2. stáhneme jen potřebné metricky kompatibilní náhrady z manifestu (Carlito ↔ Calibri…),
//  3. fonty vložené v DOCX načte engine sám (deobfuskace .odttf ve vetext-docx),
//  4. volitelně přidáme fonty ze systému přes Local Font Access API (Chromium, se souhlasem).
// Každou substituci pak hlásíme uživateli (engine `resolve_fonts`).
import { unzipSync, strFromU8 } from "fflate";

export type FaceStyle = "Regular" | "Bold" | "Italic" | "BoldItalic";

export interface FontManifest {
  version: number;
  families: Record<string, { license: string; faces: Partial<Record<FaceStyle, { file: string; bytes: number }>> }>;
}

/** Metricky kompatibilní náhrady (stejné šířky znaků → stejné zalomení řádků). */
export const METRIC_ALIASES: Record<string, string> = {
  calibri: "Carlito",
  "calibri light": "Carlito",
  cambria: "Caladea",
  "cambria math": "Caladea",
  arial: "Liberation Sans",
  "arial mt": "Liberation Sans",
  helvetica: "Liberation Sans",
  "helvetica neue": "Liberation Sans",
  arimo: "Liberation Sans",
  "times new roman": "Liberation Serif",
  times: "Liberation Serif",
  tinos: "Liberation Serif",
  "courier new": "Liberation Mono",
  courier: "Liberation Mono",
  cousine: "Liberation Mono",
};

const MONO = /mono|courier|consol|menlo|code|typewriter|lucida console/i;
const SERIF = /serif|times|roman|georgia|garamond|palatino|book|cambria|minion|baskerville|bodoni|caslon|century|didot|caladea|libre baskerville|merriweather|charter|constantia/i;

/** Bundlovaná rodina, která poslouží pro `family` (náhrada nebo nejbližší třída písma). */
export function bundledFor(family: string): string {
  const key = family.trim().toLowerCase();
  if (METRIC_ALIASES[key]) return METRIC_ALIASES[key];
  for (const f of ["Carlito", "Caladea", "Liberation Sans", "Liberation Serif", "Liberation Mono"]) if (key === f.toLowerCase()) return f;
  if (MONO.test(key)) return "Liberation Mono";
  // „Sans Serif“ je bezpatkové, i když obsahuje „serif“.
  if (SERIF.test(key) && !/sans/i.test(key)) return "Caladea";
  // Neznámé bezpatkové písmo: vetext zkouší Carlito jako první náhradu (word.rs SANS).
  return "Carlito";
}

export interface FontNeeds {
  /** Rodiny tak, jak je dokument žádá (bez duplicit, v pořadí výskytu). */
  families: string[];
  bold: boolean;
  italic: boolean;
}

const XML_PARTS = /^word\/(document|styles|numbering|header\d*|footer\d*|footnotes|endnotes|fontTable)\.xml$|^word\/theme\/theme\d*\.xml$/;
const MAX_XML_BYTES = 64 * 1024 * 1024;

/**
 * Zjistí, které fonty dokument žádá. XML se čte regulárními výrazy (ne DOMParserem — ten
 * ve workeru není a navíc by zbytečně zpracoval DTD), takže XXE tu nehrozí.
 */
export function fontNeeds(docx: Uint8Array): FontNeeds {
  let budget = MAX_XML_BYTES;
  const parts = unzipSync(docx, {
    filter: (f) => {
      if (!XML_PARTS.test(f.name)) return false;
      budget -= f.originalSize;
      return budget >= 0;
    },
  });
  const families: string[] = [];
  const add = (f: string | undefined) => {
    const v = f?.trim();
    if (v && !families.some((x) => x.toLowerCase() === v.toLowerCase())) families.push(v);
  };
  let theme = { major: "", minor: "" };
  for (const [name, data] of Object.entries(parts)) {
    if (!name.startsWith("word/theme/")) continue;
    const xml = strFromU8(data);
    theme = {
      major: /<a:majorFont>[\s\S]*?<a:latin typeface="([^"]*)"/.exec(xml)?.[1] ?? theme.major,
      minor: /<a:minorFont>[\s\S]*?<a:latin typeface="([^"]*)"/.exec(xml)?.[1] ?? theme.minor,
    };
  }
  let bold = false, italic = false;
  for (const [name, data] of Object.entries(parts)) {
    if (name.startsWith("word/theme/") || name === "word/fontTable.xml") continue;
    const xml = strFromU8(data);
    for (const m of xml.matchAll(/<w:rFonts\b([^>]*)\/?>/g)) {
      const attrs = m[1];
      add(/w:ascii="([^"]*)"/.exec(attrs)?.[1]);
      add(/w:hAnsi="([^"]*)"/.exec(attrs)?.[1]);
      const th = /w:(?:ascii|hAnsi)Theme="([^"]*)"/.exec(attrs)?.[1];
      if (th) add(/^major/.test(th) ? theme.major : theme.minor);
    }
    if (/<w:b(?:\s+w:val="(?:1|true|on)")?\s*\/>/.test(xml)) bold = true;
    if (/<w:i(?:\s+w:val="(?:1|true|on)")?\s*\/>/.test(xml)) italic = true;
    // Nadpisové styly bývají tučné i bez <w:b/> v textu.
    if (name === "word/styles.xml" && /w:styleId="Heading/.test(xml)) bold = true;
  }
  // Bez rFonts i bez motivu je výchozí písmo Wordu Calibri (od 2007) / Times New Roman (starší).
  if (!families.length) add(theme.minor || "Calibri");
  return { families, bold, italic };
}

export interface FontFile {
  family: string;
  style: FaceStyle;
  file: string;
  bytes: number;
}

/** Soubory z manifestu, které je potřeba stáhnout pro `needs`. */
export function filesFor(needs: FontNeeds, manifest: FontManifest): FontFile[] {
  const styles: FaceStyle[] = ["Regular"];
  if (needs.bold) styles.push("Bold");
  if (needs.italic) styles.push("Italic");
  if (needs.bold && needs.italic) styles.push("BoldItalic");
  const out: FontFile[] = [];
  const seen = new Set<string>();
  for (const fam of needs.families.map(bundledFor)) {
    const entry = manifest.families[fam];
    if (!entry) continue;
    for (const s of styles) {
      const face = entry.faces[s];
      if (face && !seen.has(face.file)) { seen.add(face.file); out.push({ family: fam, style: s, file: face.file, bytes: face.bytes }); }
    }
  }
  return out;
}

export interface FontResolution {
  family: string;
  bold: boolean;
  italic: boolean;
  face: string;
  style: string;
  substituted: boolean;
  synthBold: boolean;
  synthItalic: boolean;
}

export interface FontWarning {
  requested: string;
  used: string;
  /** Náhrada se stejnými šířkami znaků (zalomení řádků zůstane). */
  metricCompatible: boolean;
}

/** Z výsledků `resolve_fonts` udělá varování pro uživatele (jedno na rodinu). */
export function substitutionWarnings(res: FontResolution[], embedded: string[]): FontWarning[] {
  const emb = new Set(embedded.map((e) => e.toLowerCase()));
  const out = new Map<string, FontWarning>();
  for (const r of res) {
    if (!r.substituted || emb.has(r.family.toLowerCase())) continue;
    const key = r.family.toLowerCase();
    if (out.has(key)) continue;
    out.set(key, { requested: r.family, used: r.face, metricCompatible: METRIC_ALIASES[key]?.toLowerCase() === r.face.toLowerCase() });
  }
  return [...out.values()];
}
