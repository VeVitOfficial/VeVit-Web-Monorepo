"use client";

// Odstranění stran PDF — klik na náhled strany ji označí k odstranění
// (červený rámeček), volitelně výběr rozsahem "1-3,5". pdf-lib pak složí
// nový dokument jen z ponechaných stran. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

type PdfPageMod = unknown;
interface PdfDoc {
  getPageCount(): number;
  copyPages(src: PdfDoc, indices: number[]): Promise<PdfPageMod[]>;
  addPage(page: PdfPageMod): void;
  save(): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; }
interface PdfDocCtor { create(): Promise<PdfDoc>; load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>; }
interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage { getViewport(opts: { scale: number }): PdfjsViewport; render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }

const ACCEPT = ".pdf,application/pdf";

/** "1-3,5" → [1,2,3,5] (1-based), nevalidní části přeskočí. */
function parseRanges(input: string, max: number): number[] {
  const out = new Set<number>();
  for (const part of input.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(p);
    if (m) {
      const a = +m[1], b = +m[2];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= max) out.add(i);
      continue;
    }
    if (/^\d+$/.test(p)) { const n = +p; if (n >= 1 && n <= max) out.add(n); }
  }
  return [...out].sort((a, b) => a - b);
}

export default function PdfRemovePages({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  /** strany označené k odstranění (1-based) */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const [keptCount, setKeptCount] = useState(0);
  const thumbsRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const ensurePdfjs = async () => {
    if ((window as unknown as { pdfjsLib?: unknown }).pdfjsLib) return;
    await loadScript("/tools/assets/js/lib/pdf.min.js");
    pdfjs().GlobalWorkerOptions.workerSrc = "/tools/assets/js/lib/pdf.worker.min.js";
  };

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setProgress(null); setBlobUrl(""); setSelected(new Set());
    setPageCount(0); thumbsRef.current = new Map();
    setState("ready");
    Promise.resolve().then(() => { void renderThumbs(f); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setBlobUrl(""); setSelected(new Set()); setPageCount(0); thumbsRef.current = new Map(); setState("idle"); };

  const renderThumbs = async (f: File) => {
    try {
      setLoading(true); await ensurePdfjs();
      const buf = await f.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = doc.numPages;
      setPageCount(total);
      thumbsRef.current = new Map();
      for (let i = 1; i <= total; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        thumbsRef.current.set(i, canvas);
      }
    } catch (e) { setError((e as Error).message || "Náhledy se nepodařilo načíst."); }
    finally { setLoading(false); }
  };

  // klik na náhled = označit/odznačit stranu k odstranění
  const togglePage = (page: number) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(page)) n.delete(page); else n.add(page); return n; });
  };
  const applyRange = () => {
    const pages = parseRanges(rangeInput, pageCount);
    if (!pages.length) { setError("Neplatný rozsah. Použijte formát např. 1-3,5."); return; }
    setError("");
    setSelected((prev) => { const n = new Set(prev); pages.forEach((p) => n.add(p)); return n; });
  };
  const clearSelection = () => setSelected(new Set());

  const selectedCount = selected.size;
  const remaining = pageCount - selectedCount;

  const run = async () => {
    if (!file || !pageCount) return;
    if (selectedCount === 0) return;
    if (remaining < 1) { const m = "Musí zůstat alespoň jedna strana."; setError(m); setState("error", m); return; }
    setError(""); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      setProgress({ pct: 30, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const P = pdfLib();
      const src = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      setProgress({ pct: 60, label: `Skládám ${remaining} stran…` });
      const out = await P.PDFDocument.create();
      // ponechat indexy (0-based), které NEjsou v výběru k odstranění
      const keep: number[] = [];
      for (let i = 0; i < src.getPageCount(); i++) if (!selected.has(i + 1)) keep.push(i);
      const copied = await out.copyPages(src, keep);
      copied.forEach((p) => out.addPage(p));
      setProgress({ pct: 85, label: "Ukládám upravené PDF…" });
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setKeptCount(keep.length);
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setState("success");
      toastSuccess(`Odstraněno ${selectedCount} stran`);
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Odstranění stran selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "upraveno.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="rr-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem PDF soubor</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .pdf · jeden soubor</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} aria-hidden="true" onChange={onInputChange} />
      </div>

      {file && (
        <div className="file-list" aria-label="Vybraný soubor">
          <div className="file-item">
            <span className="fi-ico"><Icon name="File" size={18} /></span>
            <span className="fi-meta"><span className="fi-name">{file.name}</span><span className="fi-size">{fmtSize(file.size)}</span></span>
            <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: file.name })} onClick={clearAll}><Icon name="X" size={16} /></button>
          </div>
        </div>
      )}

      {pageCount > 0 && (
        <div className="stack-sm" id="rr-work">
          <p className="muted" style={{ fontSize: "0.85rem" }}>Klikněte na náhled strany, kterou chcete odstranit (červeně orámované strany se vymažou). Zůstane {remaining} z {pageCount} stran.</p>
          <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flexGrow: 1, minWidth: "12rem" }}>
              <label className="field-label" htmlFor="rr-range">Vybrat rozsahem (např. 1-3,5)</label>
              <input id="rr-range" className="input" type="text" inputMode="numeric" placeholder="1-3,5" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyRange(); } }} />
            </div>
            <button type="button" className="btn btn-outline" onClick={applyRange} disabled={!rangeInput.trim()}>Označit rozsah</button>
            <button type="button" className="btn btn-ghost" onClick={clearSelection} disabled={selectedCount === 0}>Zrušit výběr</button>
          </div>
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="rr-run" type="button" disabled={!file || selectedCount === 0 || remaining < 1} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg> Odstranit vybrané{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>
      </div>

      {loading && <p className="muted" aria-live="polite">Načítám náhledy stran…</p>}

      {pageCount > 0 && (
        <div className="pdf-page-grid pdf-page-grid-organize" id="rr-preview" role="list" aria-label="Strany PDF, klikněte pro označení k odstranění">
          {pages.map((page) => (
            <RemoveThumb key={page} page={page} marked={selected.has(page)} thumbsRef={thumbsRef} onClick={() => togglePage(page)} />
          ))}
        </div>
      )}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">upraveno.pdf</span><span className="rc-sub">Odstraněno {selectedCount} stran · zůstalo {keptCount}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Odstranění stran běží lokálně přes pdf-lib a pdf.js.</div>
    </div>
  );
}

// Náhled strany — označená strana má červené orámování (bude odstraněna).
function RemoveThumb({ page, marked, thumbsRef, onClick }: {
  page: number;
  marked: boolean;
  thumbsRef: React.MutableRefObject<Map<number, HTMLCanvasElement>>;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    const c = thumbsRef.current.get(page);
    if (c) { const clone = document.createElement("canvas"); clone.width = c.width; clone.height = c.height; clone.getContext("2d")!.drawImage(c, 0, 0); clone.style.maxWidth = "100%"; clone.style.maxHeight = "12rem"; el.appendChild(clone); }
  }, [page, thumbsRef]);
  return (
    <button type="button" className={`pdf-thumb pdf-thumb-rotate${marked ? " rotated" : ""}`} role="listitem" onClick={onClick}
      style={marked ? { borderColor: "rgba(235,75,75,.6)" } : undefined}
      aria-label={`Strana ${page}${marked ? ": označena k odstranění" : ""}, klikněte pro ${marked ? "zrušení" : "označení"}`}
      title={`Strana ${page} — klik pro ${marked ? "zrušení označení" : "označení k odstranění"}`}>
      <span className="pdf-thumb-canvas-wrap" style={{ display: "block" }}>
        <span ref={ref} className="pdf-thumb-canvas" />
      </span>
      <span className="pdf-thumb-num">{page}{marked ? " · smazat" : ""}</span>
    </button>
  );
}
