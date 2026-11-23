"use client";

// Zakrytí citlivých částí PDF — uživatel na náhledu strany (pdf.js, scale 0.8,
// přepínání stran) myší nakreslí černé obdélníky; pdf-lib je pak natrvalo
// vykreslí (drawRectangle černě) na příslušné strany. Pozor: jde o vizuální
// zakrytí — text pod obdélníkem zůstává v souboru vybratelný.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfPageMod {
  getWidth(): number;
  getHeight(): number;
  drawRectangle(opts: { x: number; y: number; width: number; height: number; color: unknown }): void;
}
interface PdfDoc {
  getPages(): PdfPageMod[];
  save(): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; rgb(r: number, g: number, b: number): unknown; }
interface PdfDocCtor { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>; }
interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage { getViewport(opts: { scale: number }): PdfjsViewport; render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }

const ACCEPT = ".pdf,application/pdf";
const SCALE = 0.8;

/** jeden nakreslený obdélník — souřadnice v PDF bodech, počátek vlevo dole */
interface RedactBox { id: number; page: number; x: number; y: number; w: number; h: number; }
/** roztažený obdélník během kreslení — souřadnice v px náhledu */
interface DragRect { x0: number; y0: number; x1: number; y1: number; }

let boxSeq = 1;

export default function PdfRedact({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [drag, setDrag] = useState<DragRect | null>(null);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /** velikosti stran v PDF bodech (viewport scale 1) */
  const pageSizesRef = useRef<Map<number, { w: number; h: number }>>(new Map());
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
    setFile(f); setError(""); setProgress(null); setBlobUrl(""); setBoxes([]); setPageNum(1); setPageCount(0);
    pageSizesRef.current = new Map();
    setState("ready");
    Promise.resolve().then(() => { void loadPdf(f, 1); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setBlobUrl(""); setBoxes([]); setPageNum(1); setPageCount(0); pageSizesRef.current = new Map(); setState("idle"); };

  // načtení PDF do pdf.js (velikosti stran) + vykreslení požadované strany
  const loadPdf = async (f: File, page: number) => {
    try {
      setLoading(true); await ensurePdfjs();
      const buf = await f.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      setPageCount(doc.numPages);
      if (!pageSizesRef.current.size) {
        for (let i = 1; i <= doc.numPages; i++) {
          const pg = await doc.getPage(i);
          const vp1 = pg.getViewport({ scale: 1 });
          pageSizesRef.current.set(i, { w: vp1.width, h: vp1.height });
        }
      }
      await drawPage(doc, page);
    } catch (e) { setError((e as Error).message || "Náhled se nepodařilo načíst."); }
    finally { setLoading(false); }
  };

  const drawPage = async (doc: PdfjsDoc, page: number) => {
    const pg = await doc.getPage(page);
    const vp = pg.getViewport({ scale: SCALE });
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext("2d")!;
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;
  };

  const goToPage = (page: number) => {
    if (!file || page < 1 || page > pageCount || page === pageNum || loading) return;
    setPageNum(page);
    Promise.resolve().then(() => { void loadPdf(file, page); });
  };

  // ── kreslení obdélníků myší/dotykem na overlay ─────────────────────────
  const localPoint = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = localPoint(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const p = localPoint(e);
    setDrag((d) => (d ? { ...d, x1: p.x, y1: p.y } : d));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const p = localPoint(e);
    const size = pageSizesRef.current.get(pageNum);
    const canvas = canvasRef.current;
    setDrag(null);
    if (!size || !canvas) return;
    const x = Math.min(drag.x0, p.x), y = Math.min(drag.y0, p.y);
    const w = Math.abs(p.x - drag.x0), h = Math.abs(p.y - drag.y0);
    if (w < 4 || h < 4) return; // klik/škrtnutí ignorujeme
    // px náhledu → PDF body (děleno scale); osa Y je v PDF zdola
    const xPdf = x / SCALE;
    const wPdf = w / SCALE;
    const hPdf = h / SCALE;
    const yPdf = size.h - y / SCALE - hPdf;
    setBoxes((prev) => [...prev, { id: boxSeq++, page: pageNum, x: xPdf, y: yPdf, w: wPdf, h: hPdf }]);
  };

  const removeBox = (id: number) => setBoxes((prev) => prev.filter((b) => b.id !== id));

  const run = async () => {
    if (!file || !boxes.length) return;
    setError(""); setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      setProgress({ pct: 30, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const pages = doc.getPages();
      const black = P.rgb(0, 0, 0);
      setProgress({ pct: 60, label: `Kreslím ${boxes.length} obdélníků…` });
      for (const b of boxes) {
        const page = pages[b.page - 1];
        if (!page) continue;
        page.drawRectangle({ x: b.x, y: b.y, width: b.w, height: b.h, color: black });
      }
      setProgress({ pct: 88, label: "Ukládám zakryté PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setState("success");
      toastSuccess("Citlivé části byly zakryty");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Zakrytí selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "zakryto.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  // rozměry náhledu pro přepočet boxů (PDF pt → px) — kopie ref ve stavu,
  // čtení přímo během renderu React Compiler zakazuje
  const [pageSizes, setPageSizes] = useState<Record<number, { w: number; h: number }>>({});
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const entries: Record<number, { w: number; h: number }> = {};
      pageSizesRef.current.forEach((v, k) => { entries[k] = v; });
      setPageSizes(entries);
    });
    return () => { cancelled = true; };
  }, [pageNum]);
  const pageSize = pageSizes[pageNum] ?? { w: 0, h: 0 };
  const pageBoxes = boxes.filter((b) => b.page === pageNum);
  const dragStyle = drag ? (() => {
    const x = Math.min(drag.x0, drag.x1), y = Math.min(drag.y0, drag.y1);
    return { left: x, top: y, width: Math.abs(drag.x1 - drag.x0), height: Math.abs(drag.y1 - drag.y0) };
  })() : null;

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="rd-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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
        <div className="stack-sm" id="rd-work">
          <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost btn-icon-sm" aria-label="Předchozí strana" disabled={pageNum <= 1} onClick={() => goToPage(pageNum - 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
            <span className="mono" style={{ fontSize: "0.85rem" }}>Strana {pageNum} / {pageCount}</span>
            <button type="button" className="btn btn-ghost btn-icon-sm" aria-label="Další strana" disabled={pageNum >= pageCount} onClick={() => goToPage(pageNum + 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
            <span className="muted" style={{ fontSize: "0.85rem" }}>· {boxes.length} obdélníků celkem</span>
          </div>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Táhněte myší přes náhled a nakreslete černý obdélník přes citlivou část. Strany přepínáte šipkami. Pozor: zakrytí je vizuální, text zůstává v souboru vybratelný.</p>

          <div className="pdf-preview-frame" style={{ position: "relative", display: "inline-block", maxWidth: "100%", userSelect: "none" }}>
            <canvas ref={canvasRef} aria-label={`Náhled strany ${pageNum}`} style={{ maxWidth: "100%", display: "block", boxShadow: "0 3px 12px rgba(0,0,0,.28)" }} />
            <div
              role="application"
              aria-label={`Oblast kreslení na straně ${pageNum}`}
              style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {pageBoxes.map((b) => (
                <div key={b.id} aria-hidden="true" title={`Zakrýt ${Math.round(b.w)}×${Math.round(b.h)} pt`}
                  style={{ position: "absolute", left: b.x * SCALE, top: (pageSize.h - b.y - b.h) * SCALE, width: b.w * SCALE, height: b.h * SCALE, background: "#000", outline: "1px dashed rgba(255,255,255,.6)" }} />
              ))}
              {dragStyle && (
                <div aria-hidden="true" style={{ position: "absolute", left: dragStyle.left, top: dragStyle.top, width: dragStyle.width, height: dragStyle.height, background: "rgba(0,0,0,.85)", outline: "1px dashed rgba(255,255,255,.8)" }} />
              )}
            </div>
          </div>

          {boxes.length > 0 && (
            <div className="file-list" aria-label="Nakreslené obdélníky">
              {boxes.map((b) => (
                <div className="file-item" key={b.id}>
                  <span className="fi-ico" style={{ background: "#000", borderRadius: ".375rem" }} aria-hidden="true" />
                  <span className="fi-meta"><span className="fi-name">Obdélník #{b.id}</span><span className="fi-size">strana {b.page} · {Math.round(b.w)}×{Math.round(b.h)} pt</span></span>
                  <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={`Odebrat obdélník ${b.id}`} onClick={() => removeBox(b.id)}><Icon name="X" size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="rd-run" type="button" disabled={!file || boxes.length === 0} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Zakrýt a uložit{boxes.length ? ` (${boxes.length})` : ""}
        </button>
      </div>

      {loading && <p className="muted" aria-live="polite">Načítám náhled strany…</p>}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">zakryto.pdf</span><span className="rc-sub">Zakryto {boxes.length} obdélníků</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Zakrytí běží lokálně přes pdf-lib a pdf.js.</div>
    </div>
  );
}
