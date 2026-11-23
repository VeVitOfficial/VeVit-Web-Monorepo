"use client";

// Podepsání PDF — podpis si uživatel nakreslí myší/dotykem do canvasu
// (~500×150, transparentní PNG), kliknutím umístí na náhled strany
// (pdf.js, scale 0.8, přepínání stran) a pdf-lib ho přes embedPng +
// drawImage natrvalo vetká do PDF. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfImg { width: number; height: number; }
interface PdfPageMod {
  getWidth(): number;
  getHeight(): number;
  drawImage(img: PdfImg, opts: unknown): void;
}
interface PdfDoc {
  getPages(): PdfPageMod[];
  embedPng(data: Uint8Array): Promise<PdfImg>;
  save(): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; }
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
const SIG_CANVAS_W = 500;
const SIG_CANVAS_H = 150;
/** poměr výšky ku šířce podpisu (canvas 150/500) */
const SIG_ASPECT = SIG_CANVAS_H / SIG_CANVAS_W;

/** umístění podpisu — x, yTop v PDF bodech (yTop měřeno od horní hrany strany) */
interface SigPos { page: number; x: number; yTop: number; }

export default function PdfSign({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [sigWidth, setSigWidth] = useState(160);
  const [pos, setPos] = useState<SigPos | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigRef = useRef<HTMLCanvasElement | null>(null);
  /** velikosti stran v PDF bodech (viewport scale 1) */
  const pageSizesRef = useRef<Map<number, { w: number; h: number }>>(new Map());
  const drawingRef = useRef(false);
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
    setFile(f); setError(""); setProgress(null); setBlobUrl(""); setPos(null); setPageNum(1); setPageCount(0);
    pageSizesRef.current = new Map();
    setState("ready");
    Promise.resolve().then(() => { void loadPdf(f, 1); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setBlobUrl(""); setPos(null); setPageNum(1); setPageCount(0); pageSizesRef.current = new Map(); clearSignature(); setState("idle"); };

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
      const pg = await doc.getPage(page);
      const vp = pg.getViewport({ scale: SCALE });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext("2d")!;
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    } catch (e) { setError((e as Error).message || "Náhled se nepodařilo načíst."); }
    finally { setLoading(false); }
  };

  const goToPage = (page: number) => {
    if (!file || page < 1 || page > pageCount || page === pageNum || loading) return;
    setPageNum(page);
    Promise.resolve().then(() => { void loadPdf(file, page); });
  };

  // ── kreslení podpisu do canvasu (myč/dotyk, pointer events) ───────────
  const sigPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigRef.current!;
    const rect = canvas.getBoundingClientRect();
    // přepočet přes CSS škálování (canvas má pevné vnitřní rozlišení)
    const k = canvas.width / Math.max(rect.width, 1);
    return { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
  };
  const onSigPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvas = sigRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = sigPoint(e);
    drawingRef.current = true;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setHasInk(true);
  };
  const onSigPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = sigRef.current!.getContext("2d")!;
    const p = sigPoint(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const onSigPointerUp = () => { drawingRef.current = false; };
  const clearSignature = () => {
    const canvas = sigRef.current;
    if (canvas) canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  // klik na náhled strany = umístit levý horní roh podpisu (s omezením do strany)
  const onPageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const size = pageSizesRef.current.get(pageNum);
    if (!size) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPdf = (e.clientX - rect.left) / SCALE;
    const yTopPdf = (e.clientY - rect.top) / SCALE;
    const sigH = sigWidth * SIG_ASPECT;
    setPos({
      page: pageNum,
      x: Math.max(0, Math.min(xPdf, size.w - sigWidth)),
      yTop: Math.max(0, Math.min(yTopPdf, size.h - sigH)),
    });
  };

  const run = async () => {
    if (!file) return;
    if (!hasInk) { setError("Nejprve nakreslete podpis."); return; }
    if (!pos) { setError("Klikněte na náhled strany a umístěte podpis."); return; }
    setError(""); setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      setProgress({ pct: 30, label: "Připravuji podpis…" });
      const pngData = sigRef.current!.toDataURL("image/png").split(",")[1];
      const pngBytes = Uint8Array.from(atob(pngData), (c) => c.charCodeAt(0));
      setProgress({ pct: 50, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const P = pdfLib();
      const doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const img = await doc.embedPng(pngBytes);
      const page = doc.getPages()[pos.page - 1];
      if (!page) throw new Error("Strana pro podpis neexistuje.");
      setProgress({ pct: 75, label: "Vkládám podpis…" });
      const size = pageSizesRef.current.get(pos.page) ?? { w: page.getWidth(), h: page.getHeight() };
      const sigH = sigWidth * SIG_ASPECT;
      // PDF počátek je vlevo dole — převod z horní hrany
      page.drawImage(img, { x: pos.x, y: size.h - pos.yTop - sigH, width: sigWidth, height: sigH });
      setProgress({ pct: 90, label: "Ukládám podepsané PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setState("success");
      toastSuccess("PDF bylo podepsáno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Podepsání selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "podepsano.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  // rozměry náhledu — kopie ref ve stavu (React Compiler: žádné čtení ref v renderu)
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
  const sigHPreview = sigWidth * SIG_ASPECT * SCALE;

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="sg-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      {file && (
        <div className="stack-sm" id="sg-work">
          <span className="field-label">1. Nakreslete podpis (myší nebo prstem)</span>
          <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ border: "1px solid var(--bd,#4b5563)", borderRadius: "0.5rem", background: "#fff", padding: "0.25rem" }}>
              <canvas
                ref={sigRef}
                width={SIG_CANVAS_W}
                height={SIG_CANVAS_H}
                role="img"
                aria-label="Podpisová plocha"
                style={{ display: "block", width: "100%", maxWidth: `${SIG_CANVAS_W}px`, touchAction: "none", cursor: "crosshair" }}
                onPointerDown={onSigPointerDown}
                onPointerMove={onSigPointerMove}
                onPointerUp={onSigPointerUp}
                onPointerCancel={onSigPointerUp}
              />
            </div>
            <button type="button" className="btn btn-ghost" onClick={clearSignature} disabled={!hasInk}>
              <Icon name="X" size={16} /> Smazat podpis
            </button>
          </div>

          <span className="field-label">2. Umístěte podpis — klikněte na náhled strany</span>
          <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-ghost btn-icon-sm" aria-label="Předchozí strana" disabled={pageNum <= 1} onClick={() => goToPage(pageNum - 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg></button>
            <span className="mono" style={{ fontSize: "0.85rem" }}>Strana {pageNum} / {pageCount}</span>
            <button type="button" className="btn btn-ghost btn-icon-sm" aria-label="Další strana" disabled={pageNum >= pageCount} onClick={() => goToPage(pageNum + 1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
          </div>
          <div>
            <label className="field-label" htmlFor="sg-size">Šířka podpisu: <span className="mono">{sigWidth}</span> pt</label>
            <input id="sg-size" type="range" min={80} max={300} step={5} value={sigWidth} onChange={(e) => setSigWidth(+e.target.value)} />
          </div>
          <p className="muted" style={{ fontSize: "0.85rem" }}>{pos ? `Podpis bude na straně ${pos.page}.` : "Zatím neumístěno — klikněte do náhledu."}</p>

          <div
            className="pdf-preview-frame"
            role="application"
            aria-label={`Náhled strany ${pageNum}, klikněte pro umístění podpisu`}
            style={{ position: "relative", display: "inline-block", maxWidth: "100%", cursor: hasInk ? "copy" : "default", userSelect: "none" }}
            onClick={onPageClick}
          >
            <canvas ref={canvasRef} aria-label={`Náhled strany ${pageNum}`} style={{ maxWidth: "100%", display: "block", boxShadow: "0 3px 12px rgba(0,0,0,.28)" }} />
            {pos && pos.page === pageNum && (
              <div aria-hidden="true" title="Umístění podpisu"
                style={{
                  position: "absolute",
                  left: pos.x * SCALE,
                  top: pos.yTop * SCALE,
                  width: sigWidth * SCALE,
                  height: sigHPreview,
                  border: "2px dashed var(--vv-green, #22c55e)",
                  background: "rgba(34,197,94,.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--vv-green, #22c55e)", fontSize: "0.75rem", fontWeight: 600, pointerEvents: "none",
                }}>
                podpis
              </div>
            )}
          </div>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Velikost strany náhledu: {Math.round(pageSize.w)}×{Math.round(pageSize.h)} pt.</p>
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="sg-run" type="button" disabled={!file || !hasInk || !pos} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg> Podepsat a uložit
        </button>
      </div>

      {loading && <p className="muted" aria-live="polite">Načítám náhled strany…</p>}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">podepsano.pdf</span><span className="rc-sub">{pos ? `Podpis na straně ${pos.page}` : ""}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Podepisování běží lokálně přes pdf-lib a pdf.js.</div>
    </div>
  );
}
