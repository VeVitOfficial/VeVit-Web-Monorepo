"use client";

// Komprese PDF — React port legacy tools/assets/js/tools/pdf-compress.js.
// lossless: pdf-lib re-save (useObjectStreams). raster: pdf.js render → JPEG →
// pdf-lib. Čistě client-side, 1:1 s legacy. Renderuje POUZE vnitřní tělo (.stack).
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

type PdfPage = unknown;
interface PdfDoc {
  getPageCount(): number;
  embedJpg(data: ArrayBuffer): Promise<PdfImg>;
  addPage(size?: [number, number]): PdfPage;
  drawImage(img: PdfImg, opts: unknown): void;
  save(opts?: { useObjectStreams?: boolean }): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
  create(): Promise<PdfDoc>;
}
type PdfImg = unknown;
interface PdfLib {
  PDFDocument: PdfDocCtor;
}
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
const HINTS: Record<string, string> = {
  lossless: "Přeuloží PDF beze ztráty — text zůstává výběratelný. Redukce je obvykle malá.",
  raster: "Strany se vyrenderují jako JPEG v daném rozlišení. Větší redukce, ale text přestane být výběratelný.",
};

export default function PdfCompress({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"lossless" | "raster">("lossless");
  const [dpi, setDpi] = useState(120);
  const [q, setQ] = useState(0.72);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<{ sub: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const blobUrlRef = useRef<string>("");
  const origFrameRef = useRef<HTMLDivElement | null>(null);
  const newFrameRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const origSizeRef = useRef(0);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }; }, [rootRef]);
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
    setFile(f); origSizeRef.current = f.size; setError(""); setResult(null); setShowPreview(false); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setResult(null); setProgress(null); setShowPreview(false); if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; } setState("idle"); };

  const pct = (o: number, n: number) => { if (o <= 0) return "—"; const d = Math.round((1 - n / o) * 100); return d >= 0 ? `−${d} %` : `+${-d} %`; };

  const appendThumb = (frame: HTMLDivElement, canvas: HTMLCanvasElement) => {
    while (frame.firstChild) frame.removeChild(frame.firstChild);
    const img = document.createElement("canvas");
    img.width = canvas.width; img.height = canvas.height;
    img.getContext("2d")!.drawImage(canvas, 0, 0);
    img.style.maxWidth = "100%"; img.style.maxHeight = "24rem"; img.style.objectFit = "contain";
    frame.appendChild(img);
  };

  const run = async () => {
    if (!file) return;
    setError(""); setResult(null); setShowPreview(false);
    if (origFrameRef.current) while (origFrameRef.current.firstChild) origFrameRef.current.removeChild(origFrameRef.current.firstChild);
    if (newFrameRef.current) while (newFrameRef.current.firstChild) newFrameRef.current.removeChild(newFrameRef.current.firstChild);
    setState("processing");
    setProgress({ pct: 5, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const blob = mode === "lossless" ? await lossless() : await raster();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(blob);
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setResult({ sub: `${fmtSize(origSizeRef.current)} → ${fmtSize(blob.size)} · ${pct(origSizeRef.current, blob.size)}` });
      setState("success");
      toastSuccess("PDF bylo komprimováno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Komprese selhala.";
      setError(m); setState("error", m);
    }
  };

  const lossless = async (): Promise<Blob> => {
    setProgress({ pct: 30, label: "Načítám PDF…" });
    const P = pdfLib();
    const buf = await file!.arrayBuffer();
    const doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
    setProgress({ pct: 70, label: "Optimalizuji a ukládám…" });
    const bytes = await doc.save({ useObjectStreams: true });
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  };

  const raster = async (): Promise<Blob> => {
    const DPI = dpi; const QUAL = q;
    await ensurePdfjs();
    setProgress({ pct: 10, label: "Načítám PDF…" });
    const buf = await file!.arrayBuffer();
    const bufView = new Uint8Array(buf);
    const pdfDoc = await pdfjs().getDocument({ data: bufView }).promise;
    const total = pdfDoc.numPages;
    const P = pdfLib();
    const newDoc = await P.PDFDocument.create();
    const step = async (i: number): Promise<Uint8Array> => {
      if (i > total) { setProgress({ pct: 92, label: "Ukládám komprimované PDF…" }); return newDoc.save(); }
      setProgress({ pct: 10 + Math.round((78 * (i - 1)) / total), label: `Renderuji stranu ${i}/${total}` });
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: DPI / 72 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob: Blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Rasterizace stránky selhala.")), "image/jpeg", QUAL));
      const jpgBuf = await blob.arrayBuffer();
      const img = await newDoc.embedJpg(jpgBuf);
      const wPt = (viewport.width / DPI) * 72; const hPt = (viewport.height / DPI) * 72;
      const pg = newDoc.addPage([wPt, hPt]);
      (pg as unknown as { drawImage: (i: PdfImg, o: unknown) => void }).drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
      if (i === 1 && origFrameRef.current && newFrameRef.current) { appendThumb(origFrameRef.current, canvas); appendThumb(newFrameRef.current, canvas); setShowPreview(true); }
      return step(i + 1);
    };
    const bytes = await step(1);
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  };

  const download = () => { if (blobUrlRef.current) { const a = document.createElement("a"); a.href = blobUrlRef.current; a.download = "komprimovano.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pc-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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
            <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: file.name })} onClick={() => { setFile(null); setState("idle"); }}><Icon name="X" size={16} /></button>
          </div>
        </div>
      )}

      <div className="stack-sm">
        <span className="field-label">Režim komprese</span>
        <div className="seg" id="pc-mode" role="tablist">
          <button type="button" className={mode === "lossless" ? "active" : ""} data-mode="lossless" role="tab" aria-selected={mode === "lossless"} onClick={() => setMode("lossless")}>Optimalizovat (bezztrátové)</button>
          <button type="button" className={mode === "raster" ? "active" : ""} data-mode="raster" role="tab" aria-selected={mode === "raster"} onClick={() => setMode("raster")}>Silná komprese (rastr)</button>
        </div>
        <p className="muted" id="pc-mode-hint" style={{ fontSize: "0.8rem" }}>{HINTS[mode]}</p>
      </div>

      {mode === "raster" && (
        <details className="accordion" id="pc-raster-opt">
          <summary>Pokročilé nastavení rastru <span className="acc-chev"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></span></summary>
          <div className="acc-body">
            <div className="stack-sm">
              <div>
                <label className="field-label">Rozlišení: <span id="pc-dpi-val" className="mono">{dpi}</span> DPI</label>
                <div className="range-row"><input type="range" id="pc-dpi" min={72} max={200} step={6} value={dpi} onChange={(e) => setDpi(+e.target.value)} /><span className="range-val">72–200</span></div>
              </div>
              <div>
                <label className="field-label">Kvalita JPEG: <span id="pc-q-val" className="mono">{q.toLocaleString(document.documentElement.lang || "cs")}</span></label>
                <div className="range-row"><input type="range" id="pc-q" min={0.4} max={0.95} step={0.01} value={q} onChange={(e) => setQ(+e.target.value)} /><span className="range-val">0,4–0,95</span></div>
              </div>
              <p className="muted" style={{ fontSize: "0.78rem" }}>Strany se vyrenderují jako obrázky v daném DPI a uloží se jako JPEG. Text přestane být výběratelný — vhodné pro skeny a grafiku, ne pro dokumenty k editaci.</p>
            </div>
          </div>
        </details>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="pc-run" type="button" disabled={!file} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" /><path d="M9 19.8V15m0 0H4.2M9 15l-6 6" /><path d="M15 4.2V9m0 0h4.8M15 9l6-6" /><path d="M9 4.2V9m0 0H4.2M9 9 3 3" /></svg> Komprimovat
        </button>
        <button className="btn btn-ghost" id="pc-clear" type="button" disabled={!file} onClick={clearAll}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Vyčistit
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {showPreview && (
        <div className="before-after" id="pc-preview">
          <div className="ba-pane"><span className="ba-label">Původní (1. strana)</span><div className="ba-frame" ref={origFrameRef} /></div>
          <div className="ba-pane"><span className="ba-label">Komprimované (1. strana)</span><div className="ba-frame" ref={newFrameRef} /></div>
        </div>
      )}

      {result && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg></span>
          <div className="rc-meta"><span className="rc-title">komprimovano.pdf</span><span className="rc-sub">{result.sub}</span></div>
          <button className="btn btn-primary" id="pc-download" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Komprese běží lokálně přes pdf-lib a pdf.js. Soubor se neodesílá na server.</div>
    </div>
  );
}