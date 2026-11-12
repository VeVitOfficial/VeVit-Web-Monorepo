// Zprávy mezi UI a workery převodníku. Soubory a výsledky se předávají jako
// transferable ArrayBuffer (bez kopie), nikdy přes síť.
import type { DownloadProgress } from "./assets.ts";
import type { FontWarning } from "./fonts.ts";
import type { ConverterLimits } from "./limits.ts";

export interface DocxToPdfOptions {
  tagged: boolean;
  /** PDF/A-2b (archivace). */
  pdfa: boolean;
  password?: string;
  /** Fonty ze systému uživatele (Local Font Access API), už přečtené v okně. */
  localFonts?: { family: string; data: ArrayBuffer }[];
}

export type Phase = "download" | "prepare" | "convert" | "finish";

export type WorkerOut =
  | { type: "progress"; id: number; phase: Phase; download?: DownloadProgress; ratio?: number }
  | { type: "done"; id: number; pdf: ArrayBuffer; result: DocxToPdfResult }
  | { type: "error"; id: number; code: ConverterErrorCode; message: string; detail?: Record<string, string | number> };

export type WorkerIn = { type: "convert"; id: number; docx: ArrayBuffer; options: DocxToPdfOptions; limits: ConverterLimits };

export interface DocxToPdfResult {
  fontWarnings: FontWarning[];
  embeddedFonts: string[];
  /** Fonty dodané ze systému uživatele (Local Font Access). */
  localFonts: string[];
  macrosIgnored: boolean;
  pdfa: boolean;
  timings: { engineMs: number; fontsMs: number; convertMs: number };
  /** Kolik bajtů se stáhlo ze sítě (0 = vše z cache). */
  downloadedBytes: number;
}

export type ConverterErrorCode =
  | "file_too_large" | "too_many_pages" | "zip_bomb" | "out_of_memory" | "encrypted" | "wrong_password"
  | "invalid_file" | "engine_load" | "convert_failed";

// ── PDF → DOCX ──────────────────────────────────────────────────────────

export interface PdfToDocxOptions {
  mode: "editable" | "exact";
  password?: string;
  /** Nabídnout OCR stránek bez textové vrstvy (UI se zeptá okna). */
  ocr: boolean;
}

/** Slovo z OCR v pixelech obrázku stránky. */
/** `base` = účaří řádku pod slovem, `rowHeight` = výška řádku z tesseractu (px obrázku). */
export interface OcrWord { text: string; x0: number; y0: number; x1: number; y1: number; confidence: number; base?: number; rowHeight?: number; /** Sklon účaří řádku (dy/dx). */ slope?: number; /** Pořadí řádku OCR na stránce. */ line?: number }

export type PdfWorkerIn =
  | { type: "convert"; id: number; pdf: ArrayBuffer; options: PdfToDocxOptions; limits: ConverterLimits }
  | { type: "ocr-result"; id: number; page: number; words: OcrWord[] | null; confidence: number };

export type PdfWorkerOut =
  | { type: "progress"; id: number; phase: Phase | "ocr"; download?: DownloadProgress; page?: number; pages?: number }
  | { type: "ocr-request"; id: number; page: number; image: { data: Uint8ClampedArray; width: number; height: number } }
  | { type: "done"; id: number; docx: ArrayBuffer; result: PdfToDocxResult }
  | { type: "error"; id: number; code: ConverterErrorCode; message: string; detail?: Record<string, string | number> };

export interface PdfToDocxResult {
  pages: number;
  mode: "editable" | "exact";
  fonts: { source: string; used: string; note: "metric" | "name" | "uncommon" }[];
  ocrPages: number[];
  lowConfidencePages: number[];
  scannedWithoutOcr: number[];
  /** Strany vícesloupcových skenů (OCR): pořadí textu ke kontrole. */
  multiColumnOcrPages: number[];
  tables: number;
  images: number;
  tagged: boolean;
  timings: { engineMs: number; convertMs: number };
}
