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
