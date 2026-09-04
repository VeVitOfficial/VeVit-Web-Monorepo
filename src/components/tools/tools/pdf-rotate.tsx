"use client";

// Otáčení stran PDF — React port legacy tools/assets/js/tools/pdf-rotate.js.
// pdf.js náhledy + pdf-lib copyPages s nastavením rotace. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfPageMod { setRotation(deg: 90 | 180 | 270): void; }
interface PdfDoc {
  getPageCount(): number;
  getPageIndices(): number[];
  getPages(): PdfPageMod[];
  copyPages(src: PdfDoc, indices: number[]): Promise<PdfPageMod[]>;
  addPage(page: PdfPageMod): void;
  removePage(page: PdfPageMod): void;
  save(): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; degrees: (d: number) => unknown; }
interface PdfDocCtor { create(): Promise<PdfDoc>; load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>; }
interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage {
  getViewport(opts: { scale: number }): PdfjsViewport;
  render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask;
}
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }

const ACCEPT = ".pdf,application/pdf";

// Parsování rozsahů stran (1-based, čárka, pomlčka). Vrací pole indexů (0-based).
function parseRanges(text: string, pageCount: number): number[] {
  const s = text.trim();
  if (!s) throw new Error("Zadejte alespoň jeden rozsah.");
  const out = new Set<number>();
  const parts = s.split(/[,;]\s*/);
  for (const part of parts) {
    const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(part);
    if (m) {
      let a = +m[1], b = +m[2]; if (a > b) [a, b] = [b, a];
      if (a < 1 || b > pageCount) throw new Error(`Strana ${b > pageCount ? b : a} neexistuje (dokument má ${pageCount} stran).`);
      for (let i = a; i <= b; i++) out.add(i - 1);
    } else if (/^\d+$/.test(part)) {
      const n = +part;
      if (n < 1 || n > pageCount) throw new Error(`Strana ${n} neexistuje (dokument má ${pageCount} stran).`);
      out.add(n - 1);
    } else {
      throw new Error(`Neplatný zápis „${part}„.`);
    }
  }
  const arr = Array.from(out).sort((a, b) => a - b);
  if (!arr.length) throw new Error("Zadejte alespoň jeden rozsah.");
  return arr;
}

export default function PdfRotate({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [pagesText, setPagesText] = useState("");
  const [selection, setSelection] = useState<"all" | "custom">("all");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const gridRef = useRef<HTMLDivElement | null>(null);
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
    setFile(f); setError(""); setProgress(null); setBlobUrl("");
    if (gridRef.current) while (gridRef.current.firstChild) gridRef.current.removeChild(gridRef.current.firstChild);
    setState("ready");
    Promise.resolve().then(() => { void renderPreview(f); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setPreviewing(false); setBlobUrl(""); if (gridRef.current) while (gridRef.current.firstChild) gridRef.current.removeChild(gridRef.current.firstChild); setState("idle"); };

  const renderPreview = async (f: File) => {
    try { setPreviewing(true); await ensurePdfjs(); const buf = await f.arrayBuffer(); const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise; const grid = gridRef.current; if (!grid) return; while (grid.firstChild) grid.removeChild(grid.firstChild); const total = Math.min(doc.numPages, 30);
      for (let i = 1; i <= total; i++) { const page = await doc.getPage(i); const vp = page.getViewport({ scale: 0.4 }); const canvas = document.createElement("canvas"); canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height); const ctx = canvas.getContext("2d")!; await page.render({ canvasContext: ctx, viewport: vp }).promise; const cell = document.createElement("div"); cell.className = "pdf-thumb"; const lbl = document.createElement("span"); lbl.className = "pdf-thumb-num"; lbl.textContent = String(i); cell.appendChild(canvas); cell.appendChild(lbl); grid.appendChild(cell); }
    } catch { /* náhled je doplňkový */ } finally { setPreviewing(false); }
  };

  const run = async () => {
    if (!file) return;
    setError(""); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      await ensurePdfjs();
      setProgress({ pct: 15, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const pdfDoc = await pdfjs().getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
      const total = pdfDoc.numPages;
      const indices = selection === "all" ? Array.from({ length: total }, (_, i) => i) : parseRanges(pagesText, total);
      const P = pdfLib();
      const src = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const out = await P.PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((p) => out.addPage(p));
      const rot = P.degrees(angle);
      const outPages = out.getPages();
      for (const idx of indices) { (outPages[idx] as unknown as { setRotation(r: unknown): void }).setRotation(rot); }
      setProgress({ pct: 85, label: "Ukládám otočené PDF…" });
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setState("success");
      toastSuccess("PDF bylo otočeno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Otáčení selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "otoceno.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pr-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      <div className="stack-sm" id="pr-work">
        <div>
          <label className="field-label" htmlFor="pr-angle">Úhel otočení</label>
          <select id="pr-angle" className="select" value={angle} onChange={(e) => setAngle(+e.target.value as 90 | 180 | 270)}>
            <option value={90}>90° vpravo</option>
            <option value={180}>180°</option>
            <option value={270}>90° vlevo (270°)</option>
          </select>
        </div>
        <div>
          <span className="field-label">Které strany otočit</span>
          <div className="seg" id="pr-selection" role="tablist">
            <button type="button" className={selection === "all" ? "active" : ""} role="tab" aria-selected={selection === "all"} onClick={() => setSelection("all")}>Všechny strany</button>
            <button type="button" className={selection === "custom" ? "active" : ""} role="tab" aria-selected={selection === "custom"} onClick={() => setSelection("custom")}>Vlastní výběr</button>
          </div>
        </div>
        {selection === "custom" && (
          <div>
            <label className="field-label" htmlFor="pr-pages">Rozsahy stran (např. 1-3, 5, 8-10)</label>
            <input id="pr-pages" className="input" type="text" placeholder="1-3, 5, 8-10" value={pagesText} onChange={(e) => setPagesText(e.target.value)} />
          </div>
        )}
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="pr-run" type="button" disabled={!file} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg> Otočit PDF
        </button>
      </div>

      {previewing && <p className="muted" aria-live="polite">Načítám náhledy…</p>}
      <div className="pdf-page-grid" id="pr-preview" ref={gridRef} />

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">otoceno.pdf</span><span className="rc-sub">Otočeno {angle}°</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Otáčení běží lokálně přes pdf-lib a pdf.js.</div>
    </div>
  );
}