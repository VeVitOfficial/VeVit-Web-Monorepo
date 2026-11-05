"use client";

// Oříznutí PDF okrajů — 4 posuvníky (levý/pravý/horní/dolní, 0-30 %)
// s živým náhledem na 1. straně (tmavý overlay mimo oblast ořezu).
// setCropBox se aplikuje na VŠECHNY strany podle jejich velikosti —
// ořez mění jen viditelnou oblast, obsah zůstává zachovaný.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfPageMod {
  getWidth(): number;
  getHeight(): number;
  setCropBox(x: number, y: number, w: number, h: number): void;
}
interface PdfDoc {
  getPages(): PdfPageMod[];
  save(): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; }
interface PdfDocCtor { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>; }
interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage { getViewport(opts: { scale: number }): PdfjsViewport; render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask; }
interface PdfjsDoc { getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }

const ACCEPT = ".pdf,application/pdf";

export default function PdfCrop({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [marginL, setMarginL] = useState(0);
  const [marginR, setMarginR] = useState(0);
  const [marginT, setMarginT] = useState(0);
  const [marginB, setMarginB] = useState(0);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState("");
  const [done, setDone] = useState(false);
  /** canvas náhledu 1. strany (pdf.js, scale 0.8) */
  const page1Ref = useRef<HTMLCanvasElement | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
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
    setFile(f); setError(""); setDone(false); setBlobUrl(""); setPreviewReady(false);
    setMarginL(0); setMarginR(0); setMarginT(0); setMarginB(0);
    setState("ready");
    Promise.resolve().then(() => { void renderPreview(f); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setDone(false); setBlobUrl(""); setPreviewReady(false); setState("idle"); };

  // Náhled 1. strany (scale 0.8) — podklad živého náhledu ořezu
  const renderPreview = async (f: File) => {
    try {
      await ensurePdfjs();
      const buf = await f.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 0.8 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
      page1Ref.current = canvas;
      setPreviewReady(true);
    } catch (e) { setError((e as Error).message || "Náhled se nepodařilo načíst."); }
  };

  const isCropping = marginL > 0 || marginR > 0 || marginT > 0 || marginB > 0;

  const run = async () => {
    if (!file) return;
    if (!isCropping) { setError("Nastavte alespoň jeden okraj větší než 0 %."); return; }
    setError(""); setDone(false); setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      setProgress({ pct: 25, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const pages = doc.getPages();
      setProgress({ pct: 55, label: `Ořezávám ${pages.length} stran…` });
      pages.forEach((page) => {
        const pw = page.getWidth(), ph = page.getHeight();
        // CropBox relativně k velikosti konkrétní strany (počátek vlevo dole).
        const x = (pw * marginL) / 100;
        const w = pw * (1 - (marginL + marginR) / 100);
        const y = (ph * marginB) / 100;
        const h = ph * (1 - (marginT + marginB) / 100);
        page.setCropBox(x, y, w, h);
      });
      setProgress({ pct: 88, label: "Ukládám ořezané PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("PDF bylo oříznuto");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Ořez selhal.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "orezane.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  const slider = (id: string, label: string, value: number, set: (v: number) => void) => (
    <div>
      <label className="field-label" htmlFor={id}>{label}: <span className="mono">{value}</span> %</label>
      <input id={id} type="range" min={0} max={30} step={1} value={value} onChange={(e) => set(+e.target.value)} />
    </div>
  );

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="cr-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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
        <div className="stack-sm" id="cr-work">
          <p className="muted" style={{ fontSize: "0.85rem" }}>Ořez se aplikuje na všechny strany. Ořezává se viditelná oblast (CropBox) — obsah stran zůstává v souboru zachovaný.</p>
          <div className="grid-2">
            {slider("cr-l", "Levý okraj", marginL, setMarginL)}
            {slider("cr-r", "Pravý okraj", marginR, setMarginR)}
            {slider("cr-t", "Horní okraj", marginT, setMarginT)}
            {slider("cr-b", "Dolní okraj", marginB, setMarginB)}
          </div>
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="cr-run" type="button" disabled={!file || !isCropping} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg> Oříznout PDF
        </button>
      </div>

      {previewReady && (
        <div className="stack-sm">
          <span className="field-label">Živý náhled ořezu (strana 1) — tmavé oblasti se oříznou</span>
          <CropPreview base={page1Ref} ready={previewReady} marginL={marginL} marginR={marginR} marginT={marginT} marginB={marginB} />
        </div>
      )}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">orezane.pdf</span><span className="rc-sub">Okraje: {marginL}/{marginR}/{marginT}/{marginB} %</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Ořez běží lokálně přes pdf-lib a pdf.js.</div>
    </div>
  );
}

// Živý náhled — canvas 1. strany + poloprůhledný černý overlay mimo oblast ořezu.
function CropPreview({ base, ready, marginL, marginR, marginT, marginB }: {
  base: React.MutableRefObject<HTMLCanvasElement | null>;
  ready: boolean;
  marginL: number; marginR: number; marginT: number; marginB: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current; const b = base.current;
    if (!c || !b) return;
    c.width = b.width; c.height = b.height;
    c.getContext("2d")!.drawImage(b, 0, 0);
  }, [base, ready]);
  const shade = "rgba(0,0,0,.55)";
  return (
    <div className="pdf-preview-frame" style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <canvas ref={ref} aria-label="Náhled ořezu" style={{ maxWidth: "100%", boxShadow: "0 3px 12px rgba(0,0,0,.28)", display: "block" }} />
      {marginT > 0 && <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${marginT}%`, background: shade }} />}
      {marginB > 0 && <div aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${marginB}%`, background: shade }} />}
      {marginL > 0 && <div aria-hidden="true" style={{ position: "absolute", top: `${marginT}%`, bottom: `${marginB}%`, left: 0, width: `${marginL}%`, background: shade }} />}
      {marginR > 0 && <div aria-hidden="true" style={{ position: "absolute", top: `${marginT}%`, bottom: `${marginB}%`, right: 0, width: `${marginR}%`, background: shade }} />}
    </div>
  );
}
