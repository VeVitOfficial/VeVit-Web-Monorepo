"use client";

// Word (DOCX) do PDF — mammoth.browser (DOCX → HTML) → plný HTML dokument s
// inline styly → sandboxovaný iframe → html2canvas → jsPDF (řezání na stránky
// jako html-to-pdf). Záložní režim "prostý text" (doc.text + splitTextToSize)
// pro případ, kdy vizuální render selže. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface MammothLib { convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: unknown[] }>; }
interface JsPdf {
  text(text: string, x: number, y: number): void;
  splitTextToSize(text: string, width: number): string[];
  setFontSize(size: number): void;
  addImage(data: string, fmt: string, x: number, y: number, w: number, h: number): void;
  addPage(): void;
  output(type: "blob"): Blob;
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
}
interface JsPdfCtor { new (opts: unknown): JsPdf; }

function mammoth(): MammothLib { return (window as unknown as { mammoth: MammothLib }).mammoth; }
function jsPdfCtor(): JsPdfCtor { return (window as unknown as { jsPDF: JsPdfCtor }).jsPDF; }

const ACCEPT = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PAGE_W = 595.28; // A4 na výšku (pt)
const PAGE_H = 841.89;

/** Plný HTML dokument s inline styly (vzhled co nejblíže Wordu). */
function buildHtmlDoc(bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff;}
body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111;line-height:1.45;
  max-width:6.5in;margin:0 auto;padding:0.6in 0.2in;}
h1{font-size:20pt;margin:0.6em 0 0.3em;}
h2{font-size:16pt;margin:0.6em 0 0.3em;}
h3{font-size:13.5pt;margin:0.5em 0 0.25em;}
h4,h5,h6{font-size:12pt;margin:0.5em 0 0.25em;}
p{margin:0 0 0.55em;}
ul,ol{margin:0 0 0.55em;padding-left:1.4em;}
li{margin:0 0 0.2em;}
table{border-collapse:collapse;width:100%;margin:0.4em 0;}
td,th{border:1px solid #999;padding:4px 6px;font-size:10pt;text-align:left;vertical-align:top;}
th{background:#f0f0f0;font-weight:bold;}
img{max-width:100%;}
blockquote{margin:0.5em 0;padding-left:1em;border-left:3px solid #ccc;color:#444;}
</style></head><body>${bodyHtml}</body></html>`;
}

/** Z mammoth HTML vytěží strukturované textové řádky (záložní textový režim). */
function extractTextLines(html: string): string[] {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const out: string[] = [];
  dom.body.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th").forEach((el) => {
    const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (txt) out.push(txt);
  });
  if (!out.length) {
    const txt = (dom.body.textContent || "").replace(/\s+/g, " ").trim();
    if (txt) out.push(txt);
  }
  return out;
}

export default function WordToPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"render" | "text">("render");
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

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".docx") || x.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setInfo(""); setDone(false); setBlobUrl(""); setState("idle"); };

  // Záložní textový režim: řádky → stránky přes splitTextToSize.
  const buildTextPdf = (lines: string[]): Blob => {
    const pdf = new (jsPdfCtor())({ orientation: "p", unit: "pt", format: [PAGE_W, PAGE_H] });
    const margin = 56;
    pdf.setFontSize(11);
    let y = margin;
    for (const line of lines) {
      const wrapped = pdf.splitTextToSize(line, PAGE_W - margin * 2);
      for (const w of wrapped) {
        if (y > PAGE_H - margin) { pdf.addPage(); y = margin; }
        pdf.text(w, margin, y);
        y += 16;
      }
      y += 6; // mezera mezi bloky
    }
    return pdf.output("blob");
  };

  const run = async () => {
    if (!file) return;
    setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    let iframe: HTMLIFrameElement | null = null;
    try {
      await loadScript("/tools/assets/js/lib/mammoth.browser.min.js");
      await loadScript("/tools/assets/js/lib/jspdf.umd.min.js");
      setProgress({ pct: 15, label: "Čtu DOCX…" });
      const buf = await file.arrayBuffer();
      const res = await mammoth().convertToHtml({ arrayBuffer: buf });
      const bodyHtml = (res.value || "").replace(/<script[\s\S]*?<\/script>/gi, "");
      if (!bodyHtml.trim()) throw new Error("Dokument neobsahuje žádný textový obsah.");

      if (mode === "text") {
        setProgress({ pct: 60, label: "Sestavuji PDF (textový režim)…" });
        const blob = buildTextPdf(extractTextLines(bodyHtml));
        setBlobUrl(URL.createObjectURL(blob));
        finish("prevedeno.pdf");
        return;
      }

      // Vizuální render: iframe → html2canvas → jsPDF (výška řezána na stránky)
      await loadScript("/tools/assets/js/lib/html2canvas.min.js");
      setProgress({ pct: 35, label: "Připravuji náhled…" });
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed"; iframe.style.left = "-99999px"; iframe.style.top = "0";
      iframe.style.width = "816px"; iframe.style.height = "600px"; iframe.style.border = "0";
      iframe.setAttribute("sandbox", "allow-same-origin");
      document.body.appendChild(iframe);
      await new Promise<void>((res2, rej) => {
        iframe!.onload = () => res2();
        iframe!.onerror = () => rej(new Error("Nepodařilo se načíst náhled."));
        iframe!.srcdoc = buildHtmlDoc(bodyHtml);
        window.setTimeout(() => rej(new Error("Náhled nereagoval (timeout).")), 15000);
      });
      setProgress({ pct: 55, label: "Renderuji dokument…" });
      const docEl = iframe.contentDocument;
      if (!docEl || !docEl.body) throw new Error("Není přístup k náhledu (sandbox).");
      const canvas = await (window as unknown as { html2canvas: (el: HTMLElement, opts: unknown) => Promise<HTMLCanvasElement> }).html2canvas(docEl.body, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      setProgress({ pct: 75, label: "Sestavuji PDF…" });
      const pdf = new (jsPdfCtor())({ orientation: "p", unit: "pt", format: [PAGE_W, PAGE_H] });
      // Přizpůsobení canvasu na šířku stránky; řezání na stránky při přetečení výšky.
      let remaining = canvas.height;
      let position = 0;
      while (remaining > 0) {
        const sliceH = Math.min(canvas.width * (PAGE_H / PAGE_W), canvas.height - position);
        const slice = document.createElement("canvas");
        slice.width = canvas.width; slice.height = sliceH;
        slice.getContext("2d")!.drawImage(canvas, 0, position, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const dataUrl = slice.toDataURL("image/jpeg", 0.92);
        pdf.addImage(dataUrl, "JPEG", 0, 0, PAGE_W, (sliceH / canvas.width) * PAGE_W);
        position += sliceH; remaining = canvas.height - position;
        if (remaining > 0) pdf.addPage();
      }
      const blob = await pdf.output("blob");
      setBlobUrl(URL.createObjectURL(blob));
      finish("dokument.pdf");
    } catch (e) {
      if (mode === "render") {
        // Vizuální render selhal → automatická záloha textovým režimem.
        try {
          setProgress({ pct: 60, label: "Render selhal — převádím textově (záloha)…" });
          const buf2 = await file.arrayBuffer();
          const res2 = await mammoth().convertToHtml({ arrayBuffer: buf2 });
          const lines = extractTextLines((res2.value || "").replace(/<script[\s\S]*?<\/script>/gi, ""));
          if (!lines.length) throw new Error("Dokument neobsahuje žádný textový obsah.");
          const blob = buildTextPdf(lines);
          setBlobUrl(URL.createObjectURL(blob));
          setInfo("Vizuální render selhal — dokument byl převeden záložním textovým režimem.");
          finish("dokument.pdf");
          return;
        } catch {
          /* pokračuj na chybu níže */
        }
      }
      setProgress(null);
      const m = (e as Error).message || "Převod DOCX do PDF selhal.";
      setError(m); setState("error", m);
    } finally {
      if (iframe) iframe.remove();
    }
  };

  const finish = (name: string) => {
    void name;
    setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
    setDone(true); setState("success");
    toastSuccess("Word dokument byl převeden na PDF");
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "dokument.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="wp-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem Word dokument"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem Word dokument</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .docx · jeden soubor</span>
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

      <div className="stack-sm" id="wp-work">
        <p className="muted" id="wp-info" style={{ fontSize: "0.85rem" }}>{info || "DOCX se převede přes mammoth na HTML a vyrenderuje do PDF (vzhled co nejblíže předloze). Záložní textový režim přenáší jen text."}</p>
        <div>
          <label className="field-label" htmlFor="wp-mode">Režim převodu</label>
          <select id="wp-mode" className="select" value={mode} onChange={(e) => setMode(e.target.value as "render" | "text")}>
            <option value="render">Vizuální render (doporučeno)</option>
            <option value="text">Prostý text (záloha, když render selže)</option>
          </select>
        </div>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="wp-run" type="button" disabled={!file} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v6h6" /><path d="M4 4h10l6 6v10H4z" /></svg> Převést na PDF
          </button>
        </div>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">dokument.pdf</span><span className="rc-sub">{mode === "text" ? "Textový režim" : "Vizuální render"} · A4</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Převod běží lokálně přes mammoth, html2canvas a jsPDF v sandboxovaném iframe — soubor neopustí váš počítač.</div>
    </div>
  );
}
