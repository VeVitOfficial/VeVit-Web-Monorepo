// DOCX → PDF z pohledu UI: worker, průběh, zrušení, Local Font Access.
import type { DownloadProgress } from "./assets.ts";
import { fontNeeds } from "./fonts.ts";
import { deviceProfile, limitsFor, type ConverterLimits } from "./limits.ts";
import type { DocxToPdfOptions, DocxToPdfResult, ConverterErrorCode, Phase, WorkerOut } from "./protocol.ts";

export interface ProgressEvent { phase: Phase; download?: DownloadProgress }

export class ConverterError extends Error {
  readonly code: ConverterErrorCode;
  readonly detail?: Record<string, string | number>;
  constructor(code: ConverterErrorCode, message: string, detail?: Record<string, string | number>) {
    super(message);
    this.name = "ConverterError";
    this.code = code;
    this.detail = detail;
  }
}

let worker: Worker | null = null;
let seq = 0;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./docx-pdf.worker.ts", import.meta.url), { type: "module", name: "vevit-docx-pdf" });
  return worker;
}

/** Ukončí worker (uvolní WASM paměť; další převod začne čistě, engine bude v Cache API). */
export function disposeDocxWorker() {
  worker?.terminate();
  worker = null;
}

export function defaultLimits(): ConverterLimits {
  return limitsFor(deviceProfile());
}

export async function convertDocxToPdf(
  file: Blob,
  options: DocxToPdfOptions,
  onProgress?: (e: ProgressEvent) => void,
  signal?: AbortSignal,
  limits: ConverterLimits = defaultLimits(),
): Promise<{ pdf: Blob; result: DocxToPdfResult }> {
  if (file.size > limits.maxFileBytes) throw new ConverterError("file_too_large", "file_too_large", { size: file.size, limit: limits.maxFileBytes });
  const docx = await file.arrayBuffer();
  const id = ++seq;
  const w = getWorker();
  return new Promise((resolve, reject) => {
    const cleanup = () => { w.removeEventListener("message", onMsg); w.removeEventListener("error", onErr); signal?.removeEventListener("abort", onAbort); };
    const onMsg = (ev: MessageEvent<WorkerOut>) => {
      const m = ev.data;
      if (m.id !== id) return;
      if (m.type === "progress") onProgress?.({ phase: m.phase, download: m.download });
      else if (m.type === "done") {
        cleanup();
        // Vložené fonty dokumentu zůstávají v databázi fontů enginu: další dokument
        // nesmí dostat cizí font jako „nalezený“, proto nový worker.
        if (m.result.embeddedFonts.length || m.result.localFonts.length) disposeDocxWorker();
        resolve({ pdf: new Blob([m.pdf], { type: "application/pdf" }), result: m.result });
      } else {
        cleanup();
        if (m.code === "out_of_memory" || m.code === "convert_failed") disposeDocxWorker();
        reject(new ConverterError(m.code, m.message, m.detail));
      }
    };
    const onErr = (ev: ErrorEvent) => { cleanup(); disposeDocxWorker(); reject(new ConverterError("engine_load", ev.message || "worker failed")); };
    const onAbort = () => { cleanup(); disposeDocxWorker(); reject(new DOMException("Aborted", "AbortError")); };
    w.addEventListener("message", onMsg);
    w.addEventListener("error", onErr);
    signal?.addEventListener("abort", onAbort, { once: true });
    w.postMessage({ type: "convert", id, docx, options, limits }, [docx]);
  });
}

// ── Local Font Access API (Chromium, jen se souhlasem uživatele) ───────────

interface LocalFontData { family: string; fullName: string; style: string; blob(): Promise<Blob> }
type QueryLocalFonts = (opts?: { postscriptNames?: string[] }) => Promise<LocalFontData[]>;

export function localFontsSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as unknown as { queryLocalFonts?: QueryLocalFonts }).queryLocalFonts === "function";
}

/** Rodiny, které dokument žádá (pro dotaz na lokální fonty a pro UI). */
export async function requestedFamilies(file: Blob): Promise<string[]> {
  try {
    return fontNeeds(new Uint8Array(await file.arrayBuffer())).families;
  } catch {
    return [];
  }
}

/**
 * Přečte ze systému fonty rodin `families`. Prohlížeč se zeptá uživatele na povolení;
 * odmítnutí není chyba (vrátí []). Max. 24 souborů a 64 MB.
 */
export async function readLocalFonts(families: string[]): Promise<{ family: string; data: ArrayBuffer }[]> {
  const q = (window as unknown as { queryLocalFonts?: QueryLocalFonts }).queryLocalFonts;
  if (!q || !families.length) return [];
  let fonts: LocalFontData[];
  try {
    fonts = await q();
  } catch {
    return [];
  }
  const want = new Set(families.map((f) => f.toLowerCase()));
  const out: { family: string; data: ArrayBuffer }[] = [];
  let budget = 64 * 1024 * 1024;
  for (const f of fonts) {
    if (!want.has(f.family.toLowerCase()) || out.length >= 24) continue;
    const blob = await f.blob();
    if (blob.size > budget) continue;
    budget -= blob.size;
    out.push({ family: f.family, data: await blob.arrayBuffer() });
  }
  return out;
}
