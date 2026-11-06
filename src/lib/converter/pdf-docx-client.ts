// PDF → DOCX z pohledu UI: worker, průběh, zrušení a OCR skenovaných stran (tesseract.js
// běží ve vlastním workeru; okno jen předává obrázky stránek a vrací slova).
import type { DownloadProgress } from "./assets.ts";
import { ConverterError, defaultLimits } from "./docx-pdf-client.ts";
import type { ConverterLimits } from "./limits.ts";
import type { OcrWord, PdfToDocxOptions, PdfToDocxResult, PdfWorkerOut } from "./protocol.ts";

export { ConverterError };

export interface PdfProgress { phase: "download" | "prepare" | "convert" | "finish" | "ocr" | "ocr-load"; page?: number; pages?: number; download?: DownloadProgress }

interface TessWord { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }
interface TessLine { words: TessWord[]; bbox: { x0: number; y0: number; x1: number; y1: number }; baseline?: { x0: number; y0: number; x1: number; y1: number; has_baseline?: boolean }; rowAttributes?: { row_height?: number; descenders?: number; ascenders?: number } }
interface TesseractWorker {
  recognize(img: HTMLCanvasElement): Promise<{ data: { confidence: number; words: TessWord[]; lines?: TessLine[] } }>;
  terminate(): Promise<void>;
}
interface TesseractLib { createWorker(lang: string, oem: number, opts: Record<string, unknown>): Promise<TesseractWorker> }

const TESS_BASE = "/tools/assets/js/lib/tesseract";
let tess: Promise<TesseractWorker> | null = null;

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true; s.dataset.src = src;
    s.onload = () => resolve(); s.onerror = () => reject(new Error(`load ${src}`));
    document.head.appendChild(s);
  });
}

/** Tesseract s češtinou a angličtinou, data jen z našeho serveru (lazy, při prvním skenu). */
function tesseract(onProgress?: (p: PdfProgress) => void): Promise<TesseractWorker> {
  tess ??= (async () => {
    onProgress?.({ phase: "ocr-load" });
    await loadScriptOnce(`${TESS_BASE}/tesseract.min.js`);
    const T = (window as unknown as { Tesseract: TesseractLib }).Tesseract;
    // corePath přímo na JS glue: jinak tesseract.js chce 3,9MB `.wasm.js` s wasm v base64.
    return T.createWorker("ces+eng", 1, { workerPath: `${TESS_BASE}/worker.min.js`, corePath: `${TESS_BASE}/tesseract-core-simd-lstm.js`, langPath: `${TESS_BASE}/`, gzip: false, workerBlobURL: false });
  })().catch((e) => { tess = null; throw e; });
  return tess;
}

async function runOcr(image: { data: Uint8ClampedArray; width: number; height: number }, onProgress?: (p: PdfProgress) => void): Promise<{ words: OcrWord[]; confidence: number }> {
  const w = await tesseract(onProgress);
  const canvas = document.createElement("canvas");
  canvas.width = image.width; canvas.height = image.height;
  canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  const { data } = await w.recognize(canvas);
  // Účaří a výška řádku z tesseractu: slova jednoho řádku pak sdílejí účaří i velikost písma.
  const words: OcrWord[] = [];
  const lines = data.lines?.length ? data.lines : [{ words: data.words, bbox: { x0: 0, y0: 0, x1: 0, y1: 0 } } as TessLine];
  for (const line of lines) {
    const bl = line.baseline?.has_baseline !== false ? line.baseline : undefined;
    for (const x of line.words) {
      if (!x.text.trim()) continue;
      const cx = (x.bbox.x0 + x.bbox.x1) / 2;
      const base = bl && bl.x1 !== bl.x0 ? bl.y0 + ((bl.y1 - bl.y0) * (cx - bl.x0)) / (bl.x1 - bl.x0) : undefined;
      const slope = bl && bl.x1 !== bl.x0 ? (bl.y1 - bl.y0) / (bl.x1 - bl.x0) : undefined;
      words.push({ text: x.text, x0: x.bbox.x0, y0: x.bbox.y0, x1: x.bbox.x1, y1: x.bbox.y1, confidence: x.confidence / 100, base, rowHeight: line.rowAttributes?.row_height, slope });
    }
  }
  return { words, confidence: data.confidence / 100 };
}

let worker: Worker | null = null;
let seq = 0;

export function disposePdfWorker() { worker?.terminate(); worker = null; }

export async function convertPdfToDocx(file: Blob, options: PdfToDocxOptions, onProgress?: (p: PdfProgress) => void, signal?: AbortSignal, limits: ConverterLimits = defaultLimits()): Promise<{ docx: Blob; result: PdfToDocxResult }> {
  if (file.size > limits.maxFileBytes) throw new ConverterError("file_too_large", "file_too_large", { size: file.size, limit: limits.maxFileBytes });
  const pdf = await file.arrayBuffer();
  const id = ++seq;
  worker ??= new Worker(new URL("./pdf-docx.worker.ts", import.meta.url), { type: "module", name: "vevit-pdf-docx" });
  const w = worker;
  return new Promise((resolve, reject) => {
    const cleanup = () => { w.removeEventListener("message", onMsg); w.removeEventListener("error", onErr); signal?.removeEventListener("abort", onAbort); };
    const onMsg = (ev: MessageEvent<PdfWorkerOut>) => {
      const m = ev.data;
      if (m.id !== id) return;
      if (m.type === "progress") onProgress?.({ phase: m.phase, page: m.page, pages: m.pages, download: m.download });
      else if (m.type === "ocr-request") {
        runOcr(m.image, onProgress)
          .then((r) => w.postMessage({ type: "ocr-result", id, page: m.page, words: r.words, confidence: r.confidence }))
          .catch(() => w.postMessage({ type: "ocr-result", id, page: m.page, words: null, confidence: 0 }));
      } else if (m.type === "done") { cleanup(); resolve({ docx: new Blob([m.docx], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), result: m.result }); }
      else { cleanup(); if (m.code === "out_of_memory" || m.code === "convert_failed") disposePdfWorker(); reject(new ConverterError(m.code, m.message, m.detail)); }
    };
    const onErr = (ev: ErrorEvent) => { cleanup(); disposePdfWorker(); reject(new ConverterError("engine_load", ev.message || "worker failed")); };
    const onAbort = () => { cleanup(); disposePdfWorker(); reject(new DOMException("Aborted", "AbortError")); };
    w.addEventListener("message", onMsg);
    w.addEventListener("error", onErr);
    signal?.addEventListener("abort", onAbort, { once: true });
    w.postMessage({ type: "convert", id, pdf, options, limits }, [pdf]);
  });
}
