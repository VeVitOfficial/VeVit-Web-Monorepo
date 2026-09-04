"use client";

// Sloučení PDF — React port legacy tools/assets/js/tools/pdf-merge.js.
// Čistě client-side přes pdf-lib (líně načtený z public URL). Markup i logika
// 1:1 s legacy (identické classNames, aby public/tools/assets/css/style.css
// fungoval). Komponenta renderuje POUZE vnitřní tělo (.stack) — shell dodává
// stránka src/app/tools/[tool]/page.tsx.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

// ── Typy UMD knihovny pdf-lib (líně načítané) ────────────────────────────
interface PdfPage { getWidth(): number; getHeight(): number; }
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
function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = ".pdf,application/pdf";

function matchesAccept(file: File, accept: string[]): boolean {
  const name = file.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return file.type === a || (a.endsWith("/*") && file.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

export default function PdfMerge({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<{ name: string; sub: string } | null>(null);
  const blobUrlRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }; }, [rootRef]);

  const announce = useCallback((msg: string) => {
    const live = document.getElementById("tool-live-status");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(() => { live.textContent = msg; }, 20);
  }, []);

  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => {
    setToolState(s);
    announce(msg ?? t(`state_${s}` as keyof ToolUiI18n));
  }, [setToolState, announce, t]);

  const addFiles = useCallback((arr: File[]) => {
    const valid = arr.filter((f) => matchesAccept(f, [ACCEPT]));
    if (valid.length < arr.length) setError(t("invalid_type"));
    if (valid.length) { setFiles((prev) => [...prev, ...valid]); setError(""); setState("ready"); }
  }, [t, setState]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0;
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  };

  const removeAt = (i: number) => {
    setFiles((prev) => { const next = prev.slice(); next.splice(i, 1); return next; });
  };
  const move = (i: number, dir: number) => {
    setFiles((prev) => {
      const j = i + dir; if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice(); const t2 = next[i]; next[i] = next[j]; next[j] = t2; return next;
    });
  };
  const clearAll = () => {
    setFiles([]); setError(""); setResult(null); setProgress(null);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; }
    setState("idle");
  };

  const run = async () => {
    if (files.length < 2) return;
    setError(""); setResult(null);
    setState("processing");
    setProgress({ pct: 5, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      const out = await P.PDFDocument.create();
      const done = { n: 0 };
      const step = async (i: number): Promise<void> => {
        if (i >= files.length) {
          setProgress({ pct: 95, label: "Ukládám sloučené PDF…" });
          const bytes = await out.save();
          const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = URL.createObjectURL(blob);
          setProgress({ pct: 100, label: "Hotovo" });
          setProgress(null);
          setResult({ name: "slouceno.pdf", sub: `${files.length} souborů · ${fmtSize(blob.size)}` });
          setState("success");
          toastSuccess("PDF bylo sloučeno");
          return;
        }
        setProgress({ pct: 10 + Math.round((80 * done.n) / files.length), label: `Zpracovávám ${i + 1}/${files.length}: ${files[i].name}` });
        const buf = await files[i].arrayBuffer();
        let src: PdfDoc;
        try { src = await P.PDFDocument.load(buf, { ignoreEncryption: true }); }
        catch (e) { throw new Error(`Nelze načíst ${files[i].name}: ${(e as Error).message || e}`); }
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        done.n += 1;
        return step(i + 1);
      };
      await step(0);
    } catch (e) {
      setProgress(null);
      setError((e as Error).message || "Sloučení selhalo.");
      setState("error", (e as Error).message || "Sloučení selhalo.");
    }
  };

  const download = () => {
    if (blobUrlRef.current) {
      const a = document.createElement("a");
      a.href = blobUrlRef.current; a.download = "slouceno.pdf";
      document.body.appendChild(a); a.click(); a.remove();
    }
  };

  const dzTitle = "Přetáhněte sem PDF soubory";
  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div
        className={`dropzone${dragOver ? " dragover" : ""}`}
        id="pm-drop"
        role="button"
        tabIndex={0}
        aria-label={dzTitle}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}
      >
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">{dzTitle}</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .pdf · více souborů · pořadí lze měnit</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} multiple aria-hidden="true" onChange={onInputChange} />
      </div>

      {files.length > 0 && (
        <div className="file-list" aria-label="Vybrané soubory">
          {files.map((f, i) => (
            <div className="file-item" key={`${f.name}-${i}`}>
              <span className="fi-ico"><Icon name="File" size={18} /></span>
              <span className="fi-meta">
                <span className="fi-name">{f.name}</span>
                <span className="fi-size">{fmtSize(f.size)}</span>
              </span>
              <button type="button" className="btn btn-ghost btn-icon-sm fi-move" aria-label={t("move_up", { name: f.name })} disabled={i === 0} onClick={() => move(i, -1)}>
                <span style={{ display: "inline-flex" }}><Icon name="Upload" size={16} /></span>
              </button>
              <button type="button" className="btn btn-ghost btn-icon-sm fi-move" aria-label={t("move_down", { name: f.name })} disabled={i === files.length - 1} onClick={() => move(i, 1)}>
                <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="Upload" size={16} /></span>
              </button>
              <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: f.name })} onClick={() => removeAt(i)}>
                <Icon name="X" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="pm-run" type="button" disabled={files.length < 2} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" /><path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z" /><path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1" /></svg> Sloučit PDF
        </button>
        <button className="btn btn-ghost" id="pm-clear" type="button" disabled={files.length === 0} onClick={clearAll}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Vyčistit
        </button>
      </div>

      {progress && (
        <>
          <div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div>
          <p className="progress-label">{progress.label}</p>
        </>
      )}
      {error && <p className="error-text" role="alert">{error}</p>}

      {result && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg></span>
          <div className="rc-meta">
            <span className="rc-title">{result.name}</span>
            <span className="rc-sub">{result.sub}</span>
          </div>
          <button className="btn btn-primary" id="pm-download" type="button" onClick={download}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout
          </button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> PDF se slévají lokálně v prohlížeči přes pdf-lib. Soubory se nikdy neodesílají na server.</div>
    </div>
  );
}