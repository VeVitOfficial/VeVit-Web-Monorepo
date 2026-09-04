"use client";

// Rozdělení PDF — React port legacy tools/assets/js/tools/pdf-split.js.
// Čistě client-side přes pdf-lib + JSZip (líně načtené z public URL). Markup
// i logika 1:1 s legacy. Komponenta renderuje POUZE vnitřní tělo (.stack).
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

type PdfPage = unknown;
interface PdfDoc {
  getPageCount(): number;
  getPageIndices(): number[];
  copyPages(src: PdfDoc, indices: number[]): Promise<PdfPage[]>;
  addPage(p?: PdfPage): PdfPage;
  save(opts?: { useObjectStreams?: boolean }): Promise<Uint8Array>;
}
interface PdfLib {
  PDFDocument: {
    create(): Promise<PdfDoc>;
    load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
  };
}
interface JSZip {
  file(name: string, data: Uint8Array | Blob): unknown;
  generateAsync(opts: { type: string }): Promise<Blob>;
}
function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function jszip(): { new (): JSZip } { return (window as unknown as { JSZip: { new (): JSZip } }).JSZip; }

const ACCEPT = ".pdf,application/pdf";

function parseRanges(text: string, pageCount: number): number[][] {
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error("Zadejte alespoň jeden rozsah.");
  const out: number[][] = [];
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = +m[1], b = +m[2];
      if (a < 1 || b > pageCount || a > b) throw new Error(`Neplatný rozsah "${p}".`);
      out.push([a, b]);
    } else if (/^\d+$/.test(p)) {
      const n = +p;
      if (n < 1 || n > pageCount) throw new Error(`Strana ${n} neexistuje (dokument má ${pageCount} stran).`);
      out.push([n, n]);
    } else {
      throw new Error(`Neplatný zápis "${p}". Použijte tvar 1-3 nebo 4.`);
    }
  }
  return out;
}

export default function PdfSplit({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"each" | "chunk" | "ranges">("each");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<{ sub: string } | null>(null);
  const blobUrlRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }; }, [rootRef]);

  const announce = useCallback((msg: string) => {
    const live = document.getElementById("tool-live-status");
    if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20);
  }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => {
    setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n));
  }, [setToolState, announce, t]);

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setResult(null); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };

  const clearAll = () => {
    setFile(null); setError(""); setResult(null); setProgress(null);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; }
    setState("idle");
  };

  const run = async () => {
    if (!file) return;
    setError(""); setResult(null); setState("processing");
    setProgress({ pct: 5, label: "Načítám knihovny…" });
    try {
      await Promise.all([
        loadScript("/tools/assets/js/lib/pdf-lib.min.js"),
        loadScript("/tools/assets/js/lib/jszip.min.js"),
      ]);
      const P = pdfLib();
      const buf = await file.arrayBuffer();
      const src = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const pageCount = src.getPageCount();
      let groups: number[][];
      if (mode === "each") {
        groups = []; for (let i = 0; i < pageCount; i++) groups.push([i]);
      } else if (mode === "chunk") {
        const nEl = document.getElementById("ps-n") as HTMLInputElement | null;
        const n = Math.max(1, parseInt(nEl?.value ?? "1", 10) || 1);
        groups = []; for (let j = 0; j < pageCount; j += n) { const g: number[] = []; for (let k = j; k < Math.min(j + n, pageCount); k++) g.push(k); groups.push(g); }
      } else {
        const rEl = document.getElementById("ps-ranges") as HTMLInputElement | null;
        const ranges = parseRanges(rEl?.value ?? "", pageCount);
        groups = ranges.map((r) => { const g: number[] = []; for (let p = r[0]; p <= r[1]; p++) g.push(p - 1); return g; });
      }
      const zip = new (jszip())();
      let done = 0;
      const step = async (i: number): Promise<Blob> => {
        if (i >= groups.length) { setProgress({ pct: 92, label: "Balím ZIP…" }); return zip.generateAsync({ type: "blob" }); }
        setProgress({ pct: 10 + Math.round((80 * done) / groups.length), label: `Vytvářím soubor ${i + 1}/${groups.length}` });
        const idxs = groups[i];
        const ndoc = await P.PDFDocument.create();
        const copied = await ndoc.copyPages(src, idxs);
        copied.forEach((pg) => ndoc.addPage(pg));
        const bytes = await ndoc.save();
        const name = idxs.length === 1 ? `strana-${idxs[0] + 1}.pdf` : `strany-${idxs[0] + 1}-${idxs[idxs.length - 1] + 1}.pdf`;
        zip.file(name, bytes);
        done += 1;
        return step(i + 1);
      };
      const blob = await step(0);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(blob);
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setResult({ sub: fmtSize(blob.size) });
      setState("success");
      toastSuccess("PDF bylo rozděleno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Rozdělení selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => {
    if (blobUrlRef.current) { const a = document.createElement("a"); a.href = blobUrlRef.current; a.download = "pdf-split.zip"; document.body.appendChild(a); a.click(); a.remove(); }
  };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div
        className={`dropzone${dragOver ? " dragover" : ""}`} id="ps-drop" role="button" tabIndex={0}
        aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}
      >
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
        <span className="field-label">Režim rozdělení</span>
        <div className="seg" id="ps-mode" role="tablist">
          {(["each", "chunk", "ranges"] as const).map((m) => (
            <button key={m} type="button" className={mode === m ? "active" : ""} data-mode={m} role="tab" aria-selected={mode === m}
              onClick={() => setMode(m)}>
              {m === "each" ? "Každá stránka zvlášť" : m === "chunk" ? "Po N stranách" : "Vlastní rozsahy"}
            </button>
          ))}
        </div>
      </div>

      {mode === "chunk" && (
        <div className="stack-sm">
          <label className="field-label" htmlFor="ps-n">Počet stránek v jednom souboru</label>
          <input className="input" type="number" id="ps-n" min={1} defaultValue={1} style={{ width: "8rem" }} inputMode="numeric" />
        </div>
      )}
      {mode === "ranges" && (
        <div className="stack-sm">
          <label className="field-label" htmlFor="ps-ranges">Rozsahy stránek (např. 1-3, 4, 5-8)</label>
          <input className="input" type="text" id="ps-ranges" placeholder="1-3, 4, 5-8" style={{ width: "100%" }} />
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="ps-run" type="button" disabled={!file} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" /></svg> Rozdělit a zabalit (ZIP)
        </button>
        <button className="btn btn-ghost" id="ps-clear" type="button" disabled={!file} onClick={clearAll}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Vyčistit
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {result && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg></span>
          <div className="rc-meta"><span className="rc-title">pdf-split.zip</span><span className="rc-sub">{result.sub}</span></div>
          <button className="btn btn-primary" id="ps-download" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout ZIP</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> PDF se rozděluje lokálně přes pdf-lib a JSZip. Soubor se neodesílá na server.</div>
    </div>
  );
}