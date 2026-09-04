"use client";

// Vodoznak do PDF — React port legacy tools/assets/js/tools/pdf-watermark.js.
// pdf-lib drawText, volitelně dlaždice (tile) nebo centrované. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfPageMod { getWidth(): number; getHeight(): number; drawText(text: string, opts: unknown): void; }
interface PdfDoc {
  getPages(): PdfPageMod[];
  embedFont?: () => Promise<unknown>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
  save(): Promise<Uint8Array>;
}
interface PdfLib {
  PDFDocument: PdfDocCtor;
  rgb: (r: number, g: number, b: number) => unknown;
  degrees: (d: number) => unknown;
  StandardFonts: { Helvetica: unknown };
}
interface PdfDocCtor { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = ".pdf,application/pdf";

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.53, 0.53, 0.53];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function PdfWatermark({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("VZOREK");
  const [size, setSize] = useState(48);
  const [opacity, setOpacity] = useState(25);
  const [angle, setAngle] = useState(-45);
  const [color, setColor] = useState("#888888");
  const [tile, setTile] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState("");
  const [done, setDone] = useState(false);
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

  const run = async () => {
    if (!file) return;
    if (!text.trim()) { setError("Zadejte text vodoznaku."); return; }
    setError(""); setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      setProgress({ pct: 25, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const font = await (doc as unknown as { embedFont: (f: unknown) => Promise<unknown> }).embedFont(P.StandardFonts.Helvetica);
      const [r, g, b] = hexToRgb(color);
      const col = P.rgb(r, g, b);
      const rot = P.degrees(angle);
      const pages = doc.getPages();
      const total = pages.length;
      pages.forEach((page, i) => {
        setProgress({ pct: 25 + Math.round((65 * (i + 1)) / total), label: `Kreslím vodoznak ${i + 1}/${total}` });
        const w = page.getWidth(), h = page.getHeight();
        if (tile) {
          // Dlaždice přes celou stranu s krokem cca 2.5× velikosti.
          const stepX = Math.max(size * 2.5, 120); const stepY = Math.max(size * 2.5, 120);
          for (let y = -h; y < h * 2; y += stepY) {
            for (let x = -w; x < w * 2; x += stepX) {
              page.drawText(text, { x, y, size, font, color: col, opacity: opacity / 100, rotate: rot });
            }
          }
        } else {
          const tw = text.length * size * 0.55;
          page.drawText(text, { x: (w - tw) / 2, y: (h - size) / 2, size, font, color: col, opacity: opacity / 100, rotate: rot });
        }
      });
      setProgress({ pct: 92, label: "Ukládám PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("Vodoznak byl přidán");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Přidání vodoznaku selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "vodoznak.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pw-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      <div className="stack-sm" id="pw-work">
        <div>
          <label className="field-label" htmlFor="pw-text">Text vodoznaku</label>
          <input id="pw-text" className="input" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="VZOREK" />
        </div>
        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="pw-size">Velikost: <span className="mono">{size}</span> pt</label>
            <input id="pw-size" type="range" min={12} max={120} step={1} value={size} onChange={(e) => setSize(+e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="pw-op">Krytí: <span className="mono">{opacity}</span> %</label>
            <input id="pw-op" type="range" min={5} max={100} step={1} value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="pw-angle">Úhel: <span className="mono">{angle}</span>°</label>
            <input id="pw-angle" type="range" min={-90} max={90} step={5} value={angle} onChange={(e) => setAngle(+e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="pw-color">Barva</label>
            <input id="pw-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: "100%", height: "2.5rem", border: "1px solid var(--bd)", borderRadius: "0.5rem", background: "transparent" }} />
          </div>
        </div>
        <label className="checkbox-row"><input id="pw-tile" type="checkbox" checked={tile} onChange={(e) => setTile(e.target.checked)} /> <span>Vyplnit celou stranu dlaždicemi (opakující se vzor)</span></label>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="pw-run" type="button" disabled={!file} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6" /><path d="M5 8h14l-1 12H6z" /><path d="M9 14h6" /></svg> Přidat vodoznak
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">vodoznak.pdf</span><span className="rc-sub">{tile ? "Dlaždice" : "Centrované"} · {size} pt · {opacity} %</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Vodoznak se vkládá lokálně přes pdf-lib.</div>
    </div>
  );
}