"use client";

// Číslování stran PDF — React port legacy tools/assets/js/tools/pdf-page-numbers.js.
// pdf-lib drawText, pozice/start/formát/velikost. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfPageMod { getWidth(): number; getHeight(): number; drawText(text: string, opts: unknown): void; }
interface PdfDoc {
  getPages(): PdfPageMod[];
  embedFont(f: unknown): Promise<unknown>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
  save(): Promise<Uint8Array>;
}
interface PdfLib { PDFDocument: PdfDocCtor; rgb: (r: number, g: number, b: number) => unknown; StandardFonts: { Helvetica: unknown }; }
interface PdfDocCtor { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = ".pdf,application/pdf";
type Pos = "bl" | "bc" | "br" | "tl" | "tc" | "tr";

export default function PdfPageNumbers({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pos, setPos] = useState<Pos>("bc");
  const [start, setStart] = useState(1);
  const [fmt, setFmt] = useState("{n}/{t}");
  const [size, setSize] = useState(10);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setDone(false); setBlobUrl(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setDone(false); setBlobUrl(""); setState("idle"); };

  const formatLabel = (n: number, total: number) => fmt.replace(/\{n\}/g, String(n)).replace(/\{t\}/g, String(total));

  const run = async () => {
    if (!file) return;
    setError(""); setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      setProgress({ pct: 25, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const font = await doc.embedFont(P.StandardFonts.Helvetica);
      const col = P.rgb(0, 0, 0);
      const pages = doc.getPages();
      const total = pages.length;
      const margin = size * 1.2;
      pages.forEach((page, i) => {
        setProgress({ pct: 25 + Math.round((65 * (i + 1)) / total), label: `Čísluji stranu ${i + 1}/${total}` });
        const w = page.getWidth(), h = page.getHeight();
        const label = formatLabel(start + i, total);
        const tw = label.length * size * 0.55;
        let x = (w - tw) / 2, y = margin;
        if (pos.startsWith("b")) y = margin;
        else y = h - margin - size;
        if (pos.endsWith("l")) x = margin;
        else if (pos.endsWith("r")) x = w - margin - tw;
        else x = (w - tw) / 2;
        page.drawText(label, { x, y, size, font, color: col });
      });
      setProgress({ pct: 92, label: "Ukládám PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("Číslování stran bylo přidáno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Číslování selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "cislovany.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pn-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      <div className="stack-sm" id="pn-work">
        <div>
          <label className="field-label" htmlFor="pn-pos">Pozice čísla</label>
          <select id="pn-pos" className="select" value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
            <option value="bl">Dole vlevo</option>
            <option value="bc">Dole uprostřed</option>
            <option value="br">Dole vpravo</option>
            <option value="tl">Nahoře vlevo</option>
            <option value="tc">Nahoře uprostřed</option>
            <option value="tr">Nahoře vpravo</option>
          </select>
        </div>
        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="pn-start">Počáteční číslo</label>
            <input id="pn-start" className="input" type="number" min={0} value={start} onChange={(e) => setStart(Math.max(0, +e.target.value || 0))} />
          </div>
          <div>
            <label className="field-label" htmlFor="pn-size">Velikost: <span className="mono">{size}</span> pt</label>
            <input id="pn-size" type="range" min={6} max={36} step={1} value={size} onChange={(e) => setSize(+e.target.value)} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="pn-fmt">Formát (zástupné znaky <code>{'{n}'}</code>=číslo, <code>{'{t}'}</code>=celkem)</label>
          <select id="pn-fmt" className="select" value={fmt} onChange={(e) => setFmt(e.target.value)}>
            <option value="{n}">{`{n}`}</option>
            <option value="{n}/{t}">{`{n}/{t}`}</option>
            <option value="Strana {n} z {t}">Strana {'{n}'} z {'{t}'}</option>
            <option value="{t}">{`{t}`}</option>
          </select>
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="pn-run" type="button" disabled={!file} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg> Očíslovat strany
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">cislovany.pdf</span><span className="rc-sub">{fmt} · {size} pt</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Číslování běží lokálně přes pdf-lib.</div>
    </div>
  );
}