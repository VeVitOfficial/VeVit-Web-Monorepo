"use client";

// Přeuspořádání stran PDF — React port legacy tools/assets/js/tools/pdf-organize.js.
// pdf.js náhledy + drag&drop reorder + undo + pdf-lib copyPages. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

type PdfPageMod = unknown;
interface PdfDoc {
  getPageIndices(): number[];
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

export default function PdfOrganize({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const [historyLen, setHistoryLen] = useState(0);
  const thumbsRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const historyRef = useRef<{ order: number[]; removed: number[] }[]>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const dragIdxRef = useRef<number | null>(null);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const ensurePdfjs = async () => {
    if ((window as unknown as { pdfjsLib?: unknown }).pdfjsLib) return;
    await loadScript("/tools/assets/js/lib/pdf.min.js");
    pdfjs().GlobalWorkerOptions.workerSrc = "/tools/assets/js/lib/pdf.worker.min.js";
  };

  const pushHistory = () => { historyRef.current.push({ order: [...order], removed: [...removed] }); if (historyRef.current.length > 50) historyRef.current.shift(); setHistoryLen(historyRef.current.length); };
  const undo = () => { const h = historyRef.current.pop(); setHistoryLen(historyRef.current.length); if (!h) return; setOrder(h.order); setRemoved(new Set(h.removed)); };

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setProgress(null); setRemoved(new Set()); setOrder([]); historyRef.current = []; setHistoryLen(0); thumbsRef.current = new Map(); setBlobUrl("");
    setState("ready");
    Promise.resolve().then(() => { void renderThumbs(f); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setOrder([]); setRemoved(new Set()); setError(""); setProgress(null); thumbsRef.current = new Map(); historyRef.current = []; setHistoryLen(0); setBlobUrl(""); if (gridRef.current) while (gridRef.current.firstChild) gridRef.current.removeChild(gridRef.current.firstChild); setState("idle"); };

  const renderThumbs = async (f: File) => {
    try {
      setLoading(true); await ensurePdfjs();
      const buf = await f.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = doc.numPages;
      thumbsRef.current = new Map();
      const grid = gridRef.current; if (!grid) return;
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      const indices: number[] = [];
      for (let i = 1; i <= total; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        thumbsRef.current.set(i, canvas);
        indices.push(i);
      }
      setOrder(indices);
    } catch (e) { setError((e as Error).message || "Náhledy se nepodařilo načíst."); }
    finally { setLoading(false); }
  };

  const removePage = (page: number) => { pushHistory(); setRemoved((prev) => { const n = new Set(prev); n.add(page); return n; }); };
  const movePage = (from: number, to: number) => {
    if (from === to) return;
    pushHistory();
    setOrder((prev) => { const next = [...prev]; const [it] = next.splice(from, 1); next.splice(to, 0, it); return next; });
  };

  // Drag&drop na gridu pomocí dataTransfer s indexem řádku.
  const onGridDragStart = (e: React.DragEvent, idx: number) => { dragIdxRef.current = idx; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(idx)); };
  const onGridDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onGridDrop = (e: React.DragEvent, idx: number) => { e.preventDefault(); const from = dragIdxRef.current; dragIdxRef.current = null; if (from === null || from === idx) return; movePage(from, idx); };

  const run = async () => {
    if (!file || !order.length) return;
    setError(""); setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      setProgress({ pct: 30, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const P = pdfLib();
      const src = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const kept = order.filter((p) => !removed.has(p));
      if (!kept.length) throw new Error("Nezůstala žádná strana — přidejte alespoň jednu.");
      setProgress({ pct: 60, label: `Skládám ${kept.length} stran…` });
      const out = await P.PDFDocument.create();
      // copyPages očekává indexy v původním dokumentu (0-based); mapujeme 1-based číslo strany.
      const srcIndices = kept.map((p) => p - 1);
      const copied = await out.copyPages(src, srcIndices);
      copied.forEach((p) => out.addPage(p));
      setProgress({ pct: 85, label: "Ukládám PDF…" });
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setState("success");
      toastSuccess("PDF bylo přeuspořádáno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Uspořádání selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "organizovano.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  const visible = order.filter((p) => !removed.has(p));

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="po-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="po-run" type="button" disabled={!file || visible.length === 0} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg> Uložit uspořádání
        </button>
        <button className="btn btn-ghost" id="po-undo" type="button" disabled={historyLen === 0} onClick={undo}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg> Zpět
        </button>
      </div>

      {loading && <p className="muted" aria-live="polite">Načítám náhledy stran…</p>}

      {visible.length > 0 && (
        <div className="pdf-page-grid pdf-page-grid-organize" id="po-list" ref={gridRef} role="list" aria-label="Strany PDF — přetáhněte pro změnu pořadí">
          {visible.map((page, idx) => (
            <div className="pdf-thumb pdf-thumb-organize" key={page} role="listitem" draggable onDragStart={(e) => onGridDragStart(e, idx)} onDragOver={(e) => onGridDragOver(e)} onDrop={(e) => onGridDrop(e, idx)}>
              <ThumbCanvas page={page} thumbsRef={thumbsRef} />
              <span className="pdf-thumb-num">{page}</span>
              <button type="button" className="btn btn-ghost btn-icon-sm pdf-thumb-remove" aria-label={`Odstranit stranu ${page}`} onClick={() => removePage(page)}><Icon name="X" size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">organizovano.pdf</span><span className="rc-sub">{visible.length} stran</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Uspořádání běží lokálně přes pdf-lib a pdf.js.</div>
    </div>
  );
}

// Komponenta vykreslí uložený canvas náhledu z ref mapy do buňky (čtení ref v effectu).
function ThumbCanvas({ page, thumbsRef }: { page: number; thumbsRef: React.MutableRefObject<Map<number, HTMLCanvasElement>> }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    const c = thumbsRef.current.get(page);
    if (c) { const clone = document.createElement("canvas"); clone.width = c.width; clone.height = c.height; clone.getContext("2d")!.drawImage(c, 0, 0); clone.style.maxWidth = "100%"; clone.style.maxHeight = "12rem"; el.appendChild(clone); }
  }, [page, thumbsRef]);
  return <div ref={ref} className="pdf-thumb-canvas" />;
}