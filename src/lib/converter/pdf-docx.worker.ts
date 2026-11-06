/// <reference lib="webworker" />
// PDF → DOCX ve web workeru: pdf.js 6 (vendorovaný, D7) → extrakce → rekonstrukce → OOXML.
// OCR skenovaných stran běží v okně (tesseract.js má vlastní worker): worker pošle obrázek
// stránky, okno vrátí slova s pozicemi. Soubor neopouští prohlížeč.
import { importStatic } from "./assets.ts";
import { LimitError, isOutOfMemory } from "./limits.ts";
import { pdfjsDocumentParams } from "./pdfjs-params.ts";
import { pdfToDocx, type RawImage } from "./pdf/convert.ts";
import type { Glyph, PageModel } from "./pdf/extract.ts";
import { ocrGlyphs } from "./pdf/ocr.ts";
import type { PdfWorkerIn, PdfWorkerOut, ConverterErrorCode, OcrWord } from "./protocol.ts";
import type * as Pdfjs from "pdfjs-dist";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const post = (m: PdfWorkerOut, transfer: Transferable[] = []) => ctx.postMessage(m, transfer);
let lib: Promise<typeof Pdfjs> | null = null;
const ocrWaiters = new Map<string, (r: { words: OcrWord[] | null; confidence: number }) => void>();

function pdfjs(): Promise<typeof Pdfjs> {
  lib ??= importStatic<typeof Pdfjs>("pdfjs/pdf.min.mjs").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("/tools/assets/js/lib/converter/pdfjs/pdf.worker.min.mjs", self.location.origin).toString();
    return m;
  }).catch((e) => { lib = null; throw e; });
  return lib;
}

/** Pixely obrázku z page.objs: ImageBitmap (OffscreenCanvas) nebo surová data pdf.js. */
async function imagePixels(page: Pdfjs.PDFPageProxy, id: string): Promise<RawImage | null> {
  const obj = await new Promise<{ bitmap?: ImageBitmap; data?: Uint8ClampedArray; width?: number; height?: number; kind?: number } | null>((res) => {
    try { page.objs.get(id, (o: never) => res(o)); } catch { res(null); }
    setTimeout(() => res(null), 15_000);
  });
  if (!obj) return null;
  const width = Number(obj.width ?? obj.bitmap?.width ?? 0), height = Number(obj.height ?? obj.bitmap?.height ?? 0);
  if (!(width > 0 && height > 0)) return null;
  if (obj.bitmap) {
    const c = new OffscreenCanvas(width, height);
    const g = c.getContext("2d");
    if (!g) return null;
    g.drawImage(obj.bitmap, 0, 0, width, height);
    return { data: g.getImageData(0, 0, width, height).data, width, height, channels: 4 };
  }
  if (!obj.data) return null;
  const px = width * height;
  // ImageKind 1 = 1 bit na pixel (řádky zarovnané na bajty) → rozbalit na šedotón.
  if (obj.kind === 1 || obj.data.length === Math.ceil(width / 8) * height) {
    const stride = Math.ceil(width / 8), out = new Uint8ClampedArray(px);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) out[y * width + x] = (obj.data[y * stride + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0;
    return { data: out, width, height, channels: 1 };
  }
  return { data: obj.data, width, height, channels: obj.data.length === px ? 1 : obj.data.length === px * 3 ? 3 : 4 };
}

/** Stránka bez textu: největší obrázek → OCR v okně → glyfy po znacích v souřadnicích stránky. */
async function ocrPage(id: number, page: Pdfjs.PDFPageProxy, m: PageModel): Promise<{ glyphs: Glyph[]; confidence: number } | null> {
  const im = [...m.images].sort((a, b) => b.w * b.h - a.w * a.h)[0];
  if (!im) return null;
  const raw = await imagePixels(page, im.id);
  if (!raw) return null;
  let rgba: Uint8ClampedArray;
  if (raw.channels === 4) rgba = new Uint8ClampedArray(raw.data);
  else {
    rgba = new Uint8ClampedArray(raw.width * raw.height * 4);
    for (let i = 0; i < raw.width * raw.height; i++) {
      const o = i * raw.channels;
      rgba[i * 4] = raw.data[o]; rgba[i * 4 + 1] = raw.data[raw.channels === 1 ? o : o + 1]; rgba[i * 4 + 2] = raw.data[raw.channels === 1 ? o : o + 2]; rgba[i * 4 + 3] = 255;
    }
  }
  post({ type: "progress", id, phase: "ocr", page: m.index + 1 });
  const key = `${id}:${m.index}`;
  const res = await new Promise<{ words: OcrWord[] | null; confidence: number }>((resolve) => {
    ocrWaiters.set(key, resolve);
    post({ type: "ocr-request", id, page: m.index, image: { data: rgba, width: raw.width, height: raw.height } }, [rgba.buffer]);
  });
  if (!res.words?.length) return null;
  const sx = im.w / raw.width, sy = im.h / raw.height;
  m.fonts.ocr = { id: "ocr", name: "Liberation Serif", family: "Liberation Serif", bold: false, italic: false, serif: true, mono: false };
  return { glyphs: ocrGlyphs(res.words, im, sx, sy), confidence: res.confidence };
}

async function convert(msg: Extract<PdfWorkerIn, { type: "convert" }>) {
  const { id, options, limits } = msg;
  if (msg.pdf.byteLength > limits.maxFileBytes) throw new LimitError("file_too_large", { size: msg.pdf.byteLength, limit: limits.maxFileBytes });
  const bytes = new Uint8Array(msg.pdf);
  // Hlavička %PDF- smí být až v prvním kilobajtu (specifikace toleruje balast před ní).
  if (!new TextDecoder("latin1").decode(bytes.subarray(0, 1024)).includes("%PDF-")) throw new LimitError("invalid_file");
  const t0 = performance.now();
  let pdf: typeof Pdfjs;
  try { pdf = await pdfjs(); } catch (e) { throw Object.assign(new Error(String((e as Error)?.message ?? e)), { code: "engine_load" as ConverterErrorCode }); }
  const t1 = performance.now();
  post({ type: "progress", id, phase: "prepare" });
  let doc: Pdfjs.PDFDocumentProxy;
  const task = pdf.getDocument(pdfjsDocumentParams(bytes, options.password, { worker: true }));
  try {
    doc = await task.promise;
  } catch (e) {
    const name = (e as { name?: string })?.name, code = (e as { code?: number })?.code;
    if (name === "PasswordException") throw Object.assign(new Error("password"), { code: (code === 2 ? "wrong_password" : "encrypted") as ConverterErrorCode });
    throw new LimitError("invalid_file", { reason: String((e as Error)?.message ?? e).slice(0, 200) });
  }
  if (doc.numPages > limits.maxPages) throw new LimitError("too_many_pages", { pages: doc.numPages, limit: limits.maxPages });
  const { docx, report } = await pdfToDocx(pdf, doc, options.mode, {
    imagePixels,
    ocr: options.ocr ? (page, m) => ocrPage(id, page, m) : undefined,
    onPage: (done, total) => post({ type: "progress", id, phase: "convert", page: done, pages: total }),
  });
  const t2 = performance.now();
  await task.destroy();
  const buf = docx.buffer.slice(docx.byteOffset, docx.byteOffset + docx.byteLength) as ArrayBuffer;
  post({
    type: "done", id, docx: buf,
    result: {
      pages: report.pages.length, mode: report.mode, fonts: report.fonts,
      ocrPages: report.pages.filter((p) => p.ocr).map((p) => p.index + 1),
      lowConfidencePages: report.pages.filter((p) => p.lowConfidence).map((p) => p.index + 1),
      scannedWithoutOcr: report.pages.filter((p) => p.scanned && !p.ocr).map((p) => p.index + 1),
      tables: report.pages.reduce((s, p) => s + p.tables, 0), images: report.pages.reduce((s, p) => s + p.images, 0),
      tagged: report.tagged,
      timings: { engineMs: Math.round(t1 - t0), convertMs: Math.round(t2 - t1) },
    },
  }, [buf]);
}

ctx.onmessage = (ev: MessageEvent<PdfWorkerIn>) => {
  const msg = ev.data;
  if (msg?.type === "ocr-result") { ocrWaiters.get(`${msg.id}:${msg.page}`)?.({ words: msg.words, confidence: msg.confidence }); ocrWaiters.delete(`${msg.id}:${msg.page}`); return; }
  if (msg?.type !== "convert") return;
  convert(msg).catch((e: unknown) => {
    const code: ConverterErrorCode = e instanceof LimitError ? e.code : isOutOfMemory(e) ? "out_of_memory" : ((e as { code?: ConverterErrorCode })?.code ?? "convert_failed");
    post({ type: "error", id: msg.id, code, message: String((e as Error)?.message ?? e).slice(0, 500), detail: e instanceof LimitError ? e.detail : undefined });
  });
};
