/// <reference lib="webworker" />
// DOCX → PDF ve web workeru: engine vetext (WASM, D6), fonty z manifestu + vložené + lokální.
// Soubor neopouští prohlížeč: jediné síťové požadavky jsou statické soubory enginu a fontů
// ze stejného originu (ověřuje e2e test soukromí).
import { fetchAsset, fetchFreshJson, importStatic, type DownloadProgress } from "./assets.ts";
import { fontNeeds, filesFor, substitutionWarnings, type FontManifest, type FontResolution } from "./fonts.ts";
import { LimitError, isOutOfMemory } from "./limits.ts";
import { checkDocx } from "./zip-guard.ts";
import type { WorkerIn, WorkerOut, ConverterErrorCode } from "./protocol.ts";

interface Engine {
  initSync(opts: { module: BufferSource }): unknown;
  add_font(bytes: Uint8Array, family: string): number;
  inspect(docx: Uint8Array): string;
  resolve_fonts(requests: string): string;
  convert(docx: Uint8Array, password: string, tagged: boolean, pdfa: boolean): Uint8Array;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let engine: Promise<Engine> | null = null;
const loadedFonts = new Set<string>();
let downloaded = 0;

const post = (m: WorkerOut, transfer: Transferable[] = []) => ctx.postMessage(m, transfer);

function loadEngine(id: number): Promise<Engine> {
  engine ??= (async () => {
    const build = await fetchFreshJson<{ version: string }>("docx-pdf/build.json");
    const onProgress = (d: DownloadProgress) => {
      if (!d.cached) downloaded = Math.max(downloaded, d.loaded);
      post({ type: "progress", id, phase: "download", download: d });
    };
    const [mod, wasm] = await Promise.all([
      importStatic<Engine>(`docx-pdf/vevit_docx_pdf.js?v=${build.version}`),
      fetchAsset(`docx-pdf/vevit_docx_pdf_bg.wasm?v=${build.version}`, "engine", onProgress),
    ]);
    mod.initSync({ module: wasm });
    return mod;
  })().catch((e) => { engine = null; throw e; });
  return engine;
}

async function convert(msg: WorkerIn) {
  const { id, options, limits } = msg;
  const docx = new Uint8Array(msg.docx);
  const report = checkDocx(docx, limits);
  if (!report.isDocx) throw new LimitError("invalid_file", { reason: "not a Word document" });

  const t0 = performance.now();
  let eng: Engine;
  try {
    eng = await loadEngine(id);
  } catch (e) {
    throw Object.assign(new Error(String((e as Error)?.message ?? e)), { code: "engine_load" as ConverterErrorCode });
  }
  const t1 = performance.now();
  post({ type: "progress", id, phase: "prepare" });

  const info = JSON.parse(eng.inspect(docx)) as { embedded: string[]; encrypted: boolean };
  if (info.encrypted && !options.password) throw new LimitError("encrypted");

  const needs = info.encrypted ? { families: ["Calibri", "Times New Roman"], bold: true, italic: true } : fontNeeds(docx);
  const manifest = await fetchAsset("fonts/manifest.json", "fonts").then((b) => JSON.parse(new TextDecoder().decode(b)) as FontManifest);
  const files = filesFor(needs, manifest).filter((f) => !loadedFonts.has(f.file));
  const total = files.reduce((s, f) => s + f.bytes, 0);
  let done = 0;
  await Promise.all(files.map(async (f) => {
    const bytes = await fetchAsset(`fonts/${f.file}`, "fonts", (d) => {
      if (!d.cached && d.loaded === d.total) downloaded += d.loaded;
      if (d.loaded === d.total) { done += f.bytes; post({ type: "progress", id, phase: "download", download: { label: "fonts", loaded: done, total, cached: d.cached } }); }
    });
    eng.add_font(bytes, f.family);
    loadedFonts.add(f.file);
  }));
  const local: string[] = [];
  for (const lf of options.localFonts ?? []) {
    try { if (eng.add_font(new Uint8Array(lf.data), lf.family) > 0) local.push(lf.family); } catch { /* nečitelný soubor fontu přeskočíme */ }
  }
  const t2 = performance.now();

  post({ type: "progress", id, phase: "convert" });
  let pdf: Uint8Array;
  try {
    pdf = eng.convert(docx, options.password ?? "", options.tagged, options.pdfa);
  } catch (e) {
    const m = String((e as Error)?.message ?? e);
    if (/protected with a password/.test(m)) throw new LimitError("encrypted");
    if (/password is incorrect/.test(m)) throw Object.assign(new Error(m), { code: "wrong_password" as ConverterErrorCode });
    throw e;
  }
  const t3 = performance.now();

  const requests: [string, boolean, boolean][] = [];
  for (const fam of needs.families) {
    requests.push([fam, false, false]);
    if (needs.bold) requests.push([fam, true, false]);
    if (needs.italic) requests.push([fam, false, true]);
  }
  const resolved = JSON.parse(eng.resolve_fonts(JSON.stringify(requests))) as FontResolution[];
  const fontWarnings = substitutionWarnings(resolved, [...info.embedded, ...local]);

  const buf = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  post({
    type: "done", id, pdf: buf,
    result: {
      fontWarnings, embeddedFonts: info.embedded, localFonts: local, macrosIgnored: report.hasMacros, pdfa: options.pdfa,
      timings: { engineMs: Math.round(t1 - t0), fontsMs: Math.round(t2 - t1), convertMs: Math.round(t3 - t2) },
      downloadedBytes: downloaded,
    },
  }, [buf]);
  downloaded = 0;
}

ctx.onmessage = (ev: MessageEvent<WorkerIn>) => {
  const msg = ev.data;
  if (msg?.type !== "convert") return;
  convert(msg).catch((e: unknown) => {
    const code: ConverterErrorCode = e instanceof LimitError ? e.code : isOutOfMemory(e) ? "out_of_memory" : ((e as { code?: ConverterErrorCode })?.code ?? "convert_failed");
    post({ type: "error", id: msg.id, code, message: String((e as Error)?.message ?? e), detail: e instanceof LimitError ? e.detail : undefined });
    // WASM po panice/oom není v definovaném stavu: další převod dostane nový worker.
    if (code === "out_of_memory" || code === "convert_failed") ctx.close();
  });
};
