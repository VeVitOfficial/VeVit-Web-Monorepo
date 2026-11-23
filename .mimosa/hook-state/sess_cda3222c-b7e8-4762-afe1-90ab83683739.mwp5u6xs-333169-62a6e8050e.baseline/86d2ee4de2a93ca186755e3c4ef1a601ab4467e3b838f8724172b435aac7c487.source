"use client";

// OCR PDF — pdf.js vyrenderuje každou stranu (150/300 DPI) na canvas a
// Tesseract.js (wasm, kompletně lokálně) z ní rozpozná text. Worker se
// vytváří jednou per běh a v finally ukončuje. Jazyková data (ces/eng)
// se při prvním použití stáhnou (~4 MB).
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState, useCopy,
} from "@/components/tools/tool-runtime";

interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage { getViewport(opts: { scale: number }): PdfjsViewport; render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }
interface TesseractWorker {
  recognize(image: HTMLCanvasElement | File): Promise<{ data: { text: string } }>;
  terminate(): Promise<unknown>;
}
interface TesseractLib { createWorker(langs: string, oem: number, opts: Record<string, unknown>): Promise<TesseractWorker>; }

function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }
function tesseract(): TesseractLib { return (window as unknown as { Tesseract: TesseractLib }).Tesseract; }

const ACCEPT = ".pdf,application/pdf";
const TESS_BASE = "/tools/assets/js/lib/tesseract";

export default function OcrPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<"ces" | "eng" | "ces+eng">("ces");
  const [dpi, setDpi] = useState<150 | 300>(150);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const blobUrlRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const copy = useCopy(locale);

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
    setFile(f); setError(""); setText(""); setInfo(""); setDone(false); if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; } setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setInfo(""); setText(""); setDone(false); if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; } setState("idle"); };

  const run = async () => {
    if (!file) return;
    setError(""); setText(""); setInfo(""); setDone(false); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    let worker: TesseractWorker | null = null;
    try {
      await ensurePdfjs();
      await loadScript(`${TESS_BASE}/tesseract.min.js`);
      setProgress({ pct: 10, label: "Připravuji OCR engine…" });
      // data load status — první použití stáhne jazyková data (~4 MB)
      setInfo("Stahuji jazyková data (při prvním použití ~4 MB)…");
      worker = await tesseract().createWorker(lang, 1, {
        workerPath: `${TESS_BASE}/worker.min.js`,
        corePath: `${TESS_BASE}/`,
        langPath: `${TESS_BASE}/`,
        workerBlobURL: false,
      });
      setInfo("Jazyková data připravena — spouštím OCR.");
      setProgress({ pct: 20, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = doc.numPages;
      const pageTexts: string[] = [];
      const scale = dpi / 72;
      for (let i = 1; i <= total; i++) {
        setProgress({ pct: 20 + Math.round((75 * (i - 1)) / total), label: `OCR strana ${i}/${total}` });
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const res = await worker.recognize(canvas);
        pageTexts.push(`--- Strana ${i} ---\n${(res.data.text || "").trim()}`);
      }
      const out = pageTexts.join("\n\n");
      setText(out);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(new Blob([out], { type: "text/plain;charset=utf-8" }));
      setInfo(`OCR dokončen — ${total} ${total === 1 ? "strana" : "stran"}, ${out.length} znaků.`);
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("OCR byl dokončen");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "OCR selhal.";
      setError(m); setState("error", m);
    } finally {
      // worker ukončit vždy (i po chybě) — uvolní wasm/workery
      if (worker) { try { await worker.terminate(); } catch { /* ignoruj */ } }
    }
  };

  const download = () => { if (blobUrlRef.current) { const a = document.createElement("a"); a.href = blobUrlRef.current; a.download = "ocr-text.txt"; document.body.appendChild(a); a.click(); a.remove(); } };
  const onCopy = async () => { await copy.copy(text); };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="oc-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      <div className="stack-sm" id="oc-work">
        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="oc-lang">Jazyk dokumentu</label>
            <select id="oc-lang" className="select" value={lang} onChange={(e) => setLang(e.target.value as "ces" | "eng" | "ces+eng")}>
              <option value="ces">Čeština</option>
              <option value="eng">Angličtina</option>
              <option value="ces+eng">Obojí (česky + anglicky)</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="oc-dpi">Rozlišení renderu</label>
            <select id="oc-dpi" className="select" value={dpi} onChange={(e) => setDpi(+e.target.value === 300 ? 300 : 150)}>
              <option value={150}>150 DPI (rychlejší)</option>
              <option value={300}>300 DPI (přesnější)</option>
            </select>
          </div>
        </div>
        <p className="muted" id="oc-note" style={{ fontSize: "0.85rem" }}>{info || "OCR běží zcela lokálně (tesseract.wasm). Při prvním použití se stáhnou jazyková data (~4 MB)."}</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="oc-run" type="button" disabled={!file} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg> Spustit OCR
          </button>
        </div>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && (
        <div className="stack-sm">
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-ghost" id="oc-copy" type="button" onClick={onCopy}>
              {copy.copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} {copy.copied ? t("copied") : t("copy")}
            </button>
            <button className="btn btn-primary" id="oc-dl" type="button" onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout .txt
            </button>
          </div>
          <textarea id="oc-out" className="textarea" readOnly value={text} aria-label={t("result_ready")} rows={14} style={{ fontFamily: "var(--mono, monospace)", fontSize: "0.85rem" }} />
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> OCR běží zcela lokálně (tesseract.wasm) — soubor neopustí váš počítač, stahují se jen jazyková data z našeho serveru.</div>
    </div>
  );
}
