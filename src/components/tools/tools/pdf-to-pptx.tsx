"use client";

// PDF do PPTX — každá strana PDF se vyrenderuje přes pdf.js (scale 1,5) na
// canvas → PNG data URL → obrázek na slide 10×7,5 in (PptxGenJS, vlastní
// layout). Přenáší se vzhled strany jako obrázek (ne editovatelný text).
// Limit 100 stran. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage { getViewport(opts: { scale: number }): PdfjsViewport; render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }
interface PptxSlide { addImage(opts: { data: string; x: number; y: number; w: string; h: string }): void; }
interface PptxPresentation {
  defineLayout(opts: { name: string; width: number; height: number }): void;
  layout: string;
  addSlide(): PptxSlide;
  write(opts: { outputType: "blob" }): Promise<Blob>;
}
interface PptxGenCtor { new (): PptxPresentation; }

function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }
function pptxGen(): PptxGenCtor { return (window as unknown as { PptxGenJS: PptxGenCtor }).PptxGenJS; }

const ACCEPT = ".pdf,application/pdf";
const MAX_PAGES = 100;

export default function PdfToPptx({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
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
    setFile(f); setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setInfo(""); setDone(false); setBlobUrl(""); setState("idle"); };

  const run = async () => {
    if (!file) return;
    setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    try {
      await ensurePdfjs();
      await loadScript("/tools/assets/js/lib/pptxgenjs.bundle.min.js");
      setProgress({ pct: 15, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = Math.min(doc.numPages, MAX_PAGES);
      if (doc.numPages > MAX_PAGES) setInfo(`Dokument má ${doc.numPages} stran — převádím prvních ${MAX_PAGES}.`);

      const pptx = new (pptxGen())();
      // slide 10×7,5 in (4:3), obrázek přes celou plochu
      pptx.defineLayout({ name: "VEVIT_PDF", width: 10, height: 7.5 });
      pptx.layout = "VEVIT_PDF";

      for (let i = 1; i <= total; i++) {
        setProgress({ pct: 15 + Math.round((75 * i) / total), label: `Renderuji stranu ${i}/${total}` });
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); // průhledné PDF pozadí → bílé
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl.replace(/^data:/, ""), x: 0, y: 0, w: "100%", h: "100%" });
      }
      if (!total) throw new Error("PDF neobsahuje žádné strany.");
      setProgress({ pct: 95, label: "Balím PPTX…" });
      const blob = await pptx.write({ outputType: "blob" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("PDF bylo převedeno na prezentaci");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Převod na PPTX selhal.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "prezentace.pptx"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pt-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem PDF soubor</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .pdf · max 100 stran</span>
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

      <div className="stack-sm" id="pt-work">
        <p className="muted" id="pt-info" style={{ fontSize: "0.85rem" }}>{info || "Každá strana PDF se stane slidem 10×7,5 in jako obrázek — vzhled zůstane 1:1, text ale nebude editovatelný. Velká PDF převádíme na prvních 100 stran."}</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="pt-run" type="button" disabled={!file} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20v13H2z" /><path d="M8 21h8" /><path d="M12 16v5" /></svg> Převést na PPTX
          </button>
        </div>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20v13H2z" /><path d="M8 21h8" /><path d="M12 16v5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">prezentace.pptx</span><span className="rc-sub">Slide 10×7,5 in · strany jako obrázky</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Převod běží lokálně přes pdf.js a PptxGenJS — soubor neopustí váš počítač.</div>
    </div>
  );
}
