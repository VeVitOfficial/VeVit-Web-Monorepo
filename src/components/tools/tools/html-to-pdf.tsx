"use client";

// HTML do PDF — React port legacy tools/assets/js/tools/html-to-pdf.js.
// html2canvas + jsPDF + VeVitHtmlPdfSanitizer (sandboxed iframe). Čistě client-side.
import { useCallback, useEffect, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, loadScript, toastSuccess, useToolState,
} from "@/components/tools/tool-runtime";

interface JsPdf {
  addImage(data: string, fmt: string, x: number, y: number, w: number, h: number): void;
  save(name: string): void;
  internal: { pageSize: { getWidth(): number; getHeight(): number } };
}
interface JsPdfCtor { new (opts: unknown): JsPdf; }
interface Sanitizer { sanitize(html: string): string; srcdoc(html: string): string; sandbox: string; maxInputChars: number; }

function jsPdfCtor(): JsPdfCtor { return (window as unknown as { jsPDF: JsPdfCtor }).jsPDF; }
function sanitizer(): Sanitizer { return (window as unknown as { VeVitHtmlPdfSanitizer: Sanitizer }).VeVitHtmlPdfSanitizer; }

const DEFAULT_HTML = `<h1>Ahoj</h1>
<p>Toto je <strong>ukázkový</strong> text, který se převede do PDF.</p>
<ul>
  <li>První položka</li>
  <li>Druhá položka</li>
</ul>`;

const SIZES: Record<"a4" | "letter", [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };

export default function HtmlToPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [size, setSize] = useState<"a4" | "letter">("a4");
  const [orient, setOrient] = useState<"p" | "l">("p");
  const [scale, setScale] = useState(2);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const run = async () => {
    if (!html.trim()) { setError("Zadejte HTML obsah."); return; }
    setError(""); setDone(false); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    let iframe: HTMLIFrameElement | null = null;
    try {
      await loadScript("/tools/assets/js/lib/html2canvas.min.js");
      await loadScript("/tools/assets/js/lib/jspdf.umd.min.js");
      await loadScript("/tools/assets/js/lib/html-pdf-sanitize.js");
      const san = sanitizer();
      if (html.length > san.maxInputChars) throw new Error(`HTML je příliš dlouhé (max ${san.maxInputChars} znaků).`);
      const srcdoc = san.srcdoc(html);
      setProgress({ pct: 20, label: "Připravuji náhled…" });
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed"; iframe.style.left = "-99999px"; iframe.style.top = "0";
      iframe.style.width = "800px"; iframe.style.height = "600px"; iframe.style.border = "0";
      iframe.setAttribute("sandbox", san.sandbox);
      document.body.appendChild(iframe);
      await new Promise<void>((res, rej) => {
        iframe!.onload = () => res();
        iframe!.onerror = () => rej(new Error("Nepodařilo se načíst náhled."));
        iframe!.srcdoc = srcdoc;
        window.setTimeout(() => rej(new Error("Náhled nereagoval (timeout).")), 15000);
      });
      setProgress({ pct: 45, label: "Renderuji HTML…" });
      const docEl = iframe.contentDocument;
      if (!docEl || !docEl.body) throw new Error("Není přístup k náhledu (sandbox).");
      const canvas = await (window as unknown as { html2canvas: (el: HTMLElement, opts: unknown) => Promise<HTMLCanvasElement> }).html2canvas(docEl.body, { scale, backgroundColor: "#ffffff", useCORS: true, logging: false });
      setProgress({ pct: 80, label: "Sestavuji PDF…" });
      const [pw, ph] = SIZES[size];
      const pageW = orient === "l" ? ph : pw;
      const pageH = orient === "l" ? pw : ph;
      const pdf = new (jsPdfCtor())({ orientation: orient, unit: "pt", format: [pageW, pageH] });
      // Přizpůsobení canvasu na šířku stránky; rozdělení na více stran při přetečení výšky.
      const imgW = pageW;
      let remaining = canvas.height;
      let position = 0;
      while (remaining > 0) {
        const sliceH = Math.min(canvas.width * (pageH / imgW), canvas.height - position);
        const slice = document.createElement("canvas");
        slice.width = canvas.width; slice.height = sliceH;
        slice.getContext("2d")!.drawImage(canvas, 0, position, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const dataUrl = slice.toDataURL("image/jpeg", 0.92);
        pdf.addImage(dataUrl, "JPEG", 0, 0, pageW, (sliceH / canvas.width) * pageW);
        position += sliceH; remaining = canvas.height - position;
        if (remaining > 0) { (pdf as unknown as { addPage(): void }).addPage(); }
      }
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      const blob = await (pdf as unknown as { output(type: "blob"): Blob }).output("blob");
      setBlobUrl(URL.createObjectURL(blob));
      setDone(true); setState("success");
      toastSuccess("HTML bylo převedeno na PDF");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Převod HTML selhal.";
      setError(m); setState("error", m);
    } finally {
      if (iframe) iframe.remove();
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "html.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="stack-sm" id="hp-work">
        <div>
          <label className="field-label" htmlFor="hp-html">HTML obsah</label>
          <textarea id="hp-html" className="textarea" value={html} onChange={(e) => setHtml(e.target.value)} rows={10} spellCheck={false} style={{ fontFamily: "var(--mono, monospace)", fontSize: "0.85rem" }} />
        </div>
        <div className="grid-3">
          <div>
            <label className="field-label" htmlFor="hp-size">Formát</label>
            <select id="hp-size" className="select" value={size} onChange={(e) => setSize(e.target.value as "a4" | "letter")}>
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="hp-orient">Orientace</label>
            <select id="hp-orient" className="select" value={orient} onChange={(e) => setOrient(e.target.value as "p" | "l")}>
              <option value="p">Na výšku</option>
              <option value="l">Na šířku</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="hp-scale">Měřítko renderu</label>
            <select id="hp-scale" className="select" value={scale} onChange={(e) => setScale(+e.target.value)}>
              <option value={1}>1× (rychlejší)</option>
              <option value={2}>2× (ostré)</option>
              <option value={3}>3× (nejostřejší)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="hp-run" type="button" disabled={!html.trim()} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg> Převést na PDF
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">html.pdf</span><span className="rc-sub">{size.toUpperCase()} · {orient === "p" ? "na výšku" : "na šířku"}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> HTML se sanitizuje a renderuje lokálně v sandboxovaném iframe. Skripty a externí zdroje jsou blokovány.</div>
    </div>
  );
}