"use client";

// Oprava poškozeného PDF — postupná eskalace: 1) běžné načtení
// (ignoreEncryption) + uložení bez objektových streamů (čistý xref),
// 2) tolerantnější načtení (updateMetadata: false) + stejný způsob uložení.
// Výsledkem je přepsaná, znovu serializovaná kopie souboru. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfDoc {
  getPageCount(): number;
  save(opts?: { useObjectStreams?: boolean }): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean; updateMetadata?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; }
interface PdfDocCtor { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean; updateMetadata?: boolean }): Promise<PdfDoc>; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = ".pdf,application/pdf";

export default function PdfRepair({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<{ pages: number; sizeBefore: number; sizeAfter: number; attempt: number } | null>(null);
  const blobUrlRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setResult(null);
    setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setResult(null); setProgress(null); if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; } setState("idle"); };

  const run = async () => {
    if (!file) return;
    setError(""); setResult(null); setRunning(true);
    setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      const buf = await file.arrayBuffer();
      let doc: PdfDoc | null = null;
      let attempt = 1;
      setProgress({ pct: 30, label: "Pokus 1: standardní načtení…" });
      try {
        doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      } catch {
        doc = null;
      }
      if (!doc) {
        attempt = 2;
        setProgress({ pct: 55, label: "Pokus 2: tolerantní načtení…" });
        doc = await P.PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
      }
      setProgress({ pct: 75, label: "Přepisuji strukturu PDF…" });
      const pages = doc.getPageCount();
      // useObjectStreams:false = obyčejná xref tabulka, nejkompatibilnější výstup
      const bytes = await doc.save({ useObjectStreams: false });
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(blob);
      setResult({ pages, sizeBefore: file.size, sizeAfter: blob.size, attempt });
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setRunning(false);
      setState("success");
      toastSuccess("PDF bylo opraveno");
    } catch {
      setProgress(null); setRunning(false);
      const m = "PDF je poškozeno natolik, že se nedá opravit.";
      setError(m); setState("error", m);
    }
  };

  const download = () => {
    if (blobUrlRef.current && result) {
      const a = document.createElement("a");
      a.href = blobUrlRef.current; a.download = "opraveno.pdf";
      document.body.appendChild(a); a.click(); a.remove();
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="rp-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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
        <p className="muted" style={{ fontSize: "0.85rem" }}>Nástroj zkusí PDF načíst dvěma způsoby a znovu ho serializuje s nejkompatibilnější strukturou (bez objektových streamů). Neopraví úplně ztracená data — ze souboru vytěží, co zbývá.</p>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="rp-run" type="button" disabled={!file || running} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" /></svg> Opravit PDF
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {result && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta">
            <span className="rc-title">opraveno.pdf</span>
            <span className="rc-sub">{result.pages} stran · {fmtSize(result.sizeBefore)} → {fmtSize(result.sizeAfter)} · {result.attempt}. pokus</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Oprava běží lokálně přes pdf-lib.</div>
    </div>
  );
}
