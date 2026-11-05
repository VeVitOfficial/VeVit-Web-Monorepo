"use client";

// PPTX do PDF — rozbalit ZIP (JSZip), najít ppt/slides/slideN.xml (číselné
// řazení!), vytěžit texty <a:t> seskupené do odstavců <a:p> (DOMParser) a
// vyrenderovat každou slide jako landscape stránku v jsPDF. Základní převod:
// text, ne obrázky/pozadí. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface JszipFile { async(type: "string"): Promise<string>; }
interface Jszip { files: Record<string, JszipFile>; }
interface JszipCtor { loadAsync(data: Uint8Array | ArrayBuffer): Promise<Jszip>; }
interface JsPdf {
  text(text: string, x: number, y: number): void;
  setFontSize(size: number): void;
  setFont(font: string, style: string): void;
  setFillColor(r: number, g: number, b: number): void;
  setTextColor(r: number, g: number, b: number): void;
  rect(x: number, y: number, w: number, h: number, style: string): void;
  splitTextToSize(text: string, width: number): string[];
  addPage(): void;
  output(type: "blob"): Blob;
}
interface JsPdfCtor { new (opts: unknown): JsPdf; }

function jszipCtor(): JszipCtor { return (window as unknown as { JSZip: JszipCtor }).JSZip; }
function jsPdfCtor(): JsPdfCtor { return (window as unknown as { jsPDF: JsPdfCtor }).jsPDF; }

const ACCEPT = ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation";
const SLIDE_W = 13.33 * 72; // 959,76 pt
const SLIDE_H = 7.5 * 72;   // 540 pt
const MARGIN = 60;

/** Texty <a:t> seskupené podle odstavců <a:p>. */
function slideParagraphs(xml: string): string[] {
  const dom = new DOMParser().parseFromString(xml, "text/html");
  const paragraphs: string[] = [];
  dom.querySelectorAll("a\\:p").forEach((p) => {
    const parts: string[] = [];
    p.querySelectorAll("a\\:t").forEach((tn) => {
      const s = (tn.textContent || "").replace(/\s+/g, " ").trim();
      if (s) parts.push(s);
    });
    const text = parts.join(" ").trim();
    if (text) paragraphs.push(text);
  });
  if (!paragraphs.length) {
    // fallback: alespoň samostatné <a:t> texty
    dom.querySelectorAll("a\\:t").forEach((tn) => {
      const s = (tn.textContent || "").replace(/\s+/g, " ").trim();
      if (s) paragraphs.push(s);
    });
  }
  return paragraphs;
}

export default function PptxToPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pptx") || x.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setDone(false); setBlobUrl(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setDone(false); setBlobUrl(""); setState("idle"); };

  const run = async () => {
    if (!file) return;
    setError(""); setDone(false); setBlobUrl(""); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    try {
      await loadScript("/tools/assets/js/lib/jszip.min.js");
      await loadScript("/tools/assets/js/lib/jspdf.umd.min.js");
      setProgress({ pct: 15, label: "Rozbaluji PPTX…" });
      const buf = await file.arrayBuffer();
      const zip = await jszipCtor().loadAsync(buf);
      // ppt/slides/slideN.xml — numericky (slide10 až za slide9)
      const slideNames = Object.keys(zip.files)
        .map((n) => /^ppt\/slides\/slide(\d+)\.xml$/.exec(n))
        .filter((m): m is RegExpExecArray => !!m)
        .sort((a, b) => +a[1] - +b[1])
        .map((m) => m[0]);
      if (!slideNames.length) {
        throw new Error("Prezentace neobsahuje text (mohou to být jen obrázky).");
      }

      const pdf = new (jsPdfCtor())({ orientation: "l", unit: "pt", format: [SLIDE_W, SLIDE_H] });
      let anyText = false;
      for (let i = 0; i < slideNames.length; i++) {
        setProgress({ pct: 20 + Math.round((70 * (i + 1)) / slideNames.length), label: `Zpracovávám slide ${i + 1}/${slideNames.length}` });
        if (i > 0) pdf.addPage();
        // bílé pozadí
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, SLIDE_W, SLIDE_H, "F");

        const xml = await zip.files[slideNames[i]].async("string");
        const paragraphs = slideParagraphs(xml);
        if (paragraphs.length) anyText = true;

        // titul = první odstavec (16 pt tučně)
        let y = MARGIN + 16;
        const title = paragraphs[0] ?? "";
        if (title) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.setTextColor(17, 17, 17);
          const lines = pdf.splitTextToSize(title, SLIDE_W - MARGIN * 2);
          for (const ln of lines.slice(0, 2)) { pdf.text(ln, MARGIN, y); y += 22; }
          y += 8;
        }
        // zbytek odstavců 12 pt se zalamováním; max ~9 řádků, pak "…"
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        let lineCount = 0;
        let truncated = false;
        for (const para of paragraphs.slice(1)) {
          const lines = pdf.splitTextToSize(para, SLIDE_W - MARGIN * 2);
          for (const ln of lines) {
            if (lineCount >= 9) { truncated = true; break; }
            pdf.text(ln, MARGIN, y);
            y += 18;
            lineCount += 1;
          }
          if (truncated) break;
          y += 6; // mezera mezi odstavci
        }
        if (truncated) {
          pdf.setTextColor(130, 130, 130);
          pdf.text("…", MARGIN, y);
        }
        // číslo slidu vpravo dole
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(130, 130, 130);
        pdf.text(String(i + 1), SLIDE_W - MARGIN, SLIDE_H - 24);
      }
      if (!anyText) {
        throw new Error("Prezentace neobsahuje text (mohou to být jen obrázky).");
      }
      setProgress({ pct: 95, label: "Ukládám PDF…" });
      const blob = await pdf.output("blob");
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("Prezentace byla převedena na PDF");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Převod PPTX selhal.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "prezentace.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pp-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem prezentaci"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem prezentaci</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .pptx · jeden soubor</span>
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

      <div className="stack-sm" id="pp-work">
        <p className="muted" style={{ fontSize: "0.85rem" }}>Základní převod — přenáší se text, ne obrázky/pozadí.</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="pp-run" type="button" disabled={!file} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20v13H2z" /><path d="M8 21h8" /><path d="M12 16v5" /></svg> Převést na PDF
          </button>
        </div>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">prezentace.pdf</span><span className="rc-sub">Na šířku · 13,33 × 7,5 in</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Převod běží lokálně přes JSZip a jsPDF — soubor neopustí váš počítač.</div>
    </div>
  );
}
