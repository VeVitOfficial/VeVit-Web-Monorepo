// PDF fonty → fonty pro DOCX. Vložené fonty v PDF jsou subsety (jen použité znaky), takže
// je do DOCX vložit nejde; mapujeme je na plný font podle názvu a rodiny. Metricky
// kompatibilní klony vracíme na jména, která Word zná (Liberation Sans → Arial), protože
// je Word nahradí správně a v LibreOffice platí totéž opačně.
import type { FontInfo } from "./extract.ts";

const TO_WORD: Record<string, string> = {
  "liberation sans": "Arial", arimo: "Arial", helvetica: "Arial", "helvetica neue": "Arial", "arial mt": "Arial", arial: "Arial",
  "liberation serif": "Times New Roman", tinos: "Times New Roman", times: "Times New Roman", "times roman": "Times New Roman", "times new roman": "Times New Roman",
  "liberation mono": "Courier New", cousine: "Courier New", courier: "Courier New", "courier new": "Courier New",
  carlito: "Calibri", calibri: "Calibri", caladea: "Cambria", cambria: "Cambria",
};

/** Fonty, které má prakticky každý Word (Windows/macOS) — u nich substituci nehlásíme. */
const COMMON = new Set(["Arial", "Times New Roman", "Courier New", "Calibri", "Cambria", "Georgia", "Verdana", "Tahoma", "Segoe UI", "Trebuchet MS", "Garamond", "Consolas", "Symbol", "Wingdings"]);

export interface FontMapping { family: string; bold: boolean; italic: boolean; source: string; mapped: boolean }

export function mapFont(f: FontInfo | undefined): FontMapping {
  if (!f) return { family: "Arial", bold: false, italic: false, source: "?", mapped: true };
  const key = f.family.toLowerCase().replace(/\s+/g, " ").trim();
  const known = TO_WORD[key] ?? TO_WORD[key.replace(/ (std|pro|lt|mt)$/, "")];
  if (known) return { family: known, bold: f.bold, italic: f.italic, source: f.family, mapped: known.toLowerCase() !== key };
  // Standardní 14 fonty PDF a obecné názvy.
  if (/^(helv|arial|sans)/i.test(f.family)) return { family: "Arial", bold: f.bold, italic: f.italic, source: f.family, mapped: true };
  if (/^(times|serif|roman)/i.test(f.family)) return { family: "Times New Roman", bold: f.bold, italic: f.italic, source: f.family, mapped: true };
  if (f.mono) return { family: "Courier New", bold: f.bold, italic: f.italic, source: f.family, mapped: !/courier/i.test(f.family) };
  return { family: f.family, bold: f.bold, italic: f.italic, source: f.family, mapped: false };
}

export interface FontReport { source: string; used: string; note: "metric" | "name" | "uncommon" }

/** Hlášení pro uživatele: které PDF fonty se jak namapovaly. */
export function fontReport(fonts: FontInfo[]): FontReport[] {
  const out = new Map<string, FontReport>();
  for (const f of fonts) {
    const m = mapFont(f);
    if (out.has(f.family)) continue;
    if (m.mapped) out.set(f.family, { source: f.family, used: m.family, note: TO_WORD[f.family.toLowerCase()] ? "metric" : "name" });
    else if (!COMMON.has(m.family)) out.set(f.family, { source: f.family, used: m.family, note: "uncommon" });
  }
  return [...out.values()];
}
