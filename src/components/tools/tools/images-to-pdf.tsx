"use client";

// Obrázky do PDF — React port legacy tools/assets/js/tools/images-to-pdf.js.
// pdf-lib embedPng/embedJpg, webp/jpeg→PNG re-encode, orient/margin/fitA4, reorderable.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfImg { width(): number; height(): number; scale(factor: number): PdfImg; }
interface PdfPageMod { getWidth(): number; getHeight(): number; drawImage(img: PdfImg, opts: unknown): void; }
interface PdfDoc {
  create(): Promise<PdfDoc>;
  addPage(size?: [number, number]): PdfPageMod;
  embedPng(data: ArrayBuffer | Uint8Array): Promise<PdfImg>;
  embedJpg(data: ArrayBuffer | Uint8Array): Promise<PdfImg>;
  save(): Promise<Uint8Array>;
}
interface PdfLib { PDFDocument: PdfDocCtor; }
interface PdfDocCtor { create(): Promise<PdfDoc>; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = "image/png,image/jpeg,image/webp,image/jpg,.png,.jpg,.jpeg,.webp";
const A4: [number, number] = [595.28, 841.89]; // pt

function matchesAccept(file: File): boolean {
  const n = file.name.toLowerCase();
  return /\.(png|jpe?g|webp)$/.test(n) || /^image\/(png|jpe?g|webp)$/.test(file.type);
}

export default function ImagesToPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [orient, setOrient] = useState<"auto" | "p" | "l">("auto");
  const [margin, setMargin] = useState(0);
  const [fitA4, setFitA4] = useState(true);
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

  const addFiles = (arr: File[]) => {
    const imgs = arr.filter(matchesAccept);
    if (!imgs.length) { setError(t("invalid_type")); return; }
    setError(""); setDone(false);
    setFiles((prev) => [...prev, ...imgs]);
    setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files)); };
  const removeAt = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const move = (from: number, to: number) => { if (to < 0 || to >= files.length) return; setFiles((prev) => { const n = [...prev]; const [it] = n.splice(from, 1); n.splice(to, 0, it); return n; }); };
  const clearAll = () => { setFiles([]); setError(""); setProgress(null); setDone(false); setBlobUrl(""); setState("idle"); };

  // Načte obrázek do canvasu (převede webp/jpeg na PNG data). Vrací {canvas, w, h}.
  const loadImage = (f: File): Promise<HTMLCanvasElement> => new Promise((res, rej) => {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      res(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error(`Nelze načíst obrázek ${f.name}.`)); };
    img.src = url;
  });

  const run = async () => {
    if (!files.length) return;
    setError(""); setDone(false); setState("processing"); setProgress({ pct: 5, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      const doc = await P.PDFDocument.create();
      const total = files.length;
      const marginPt = margin * 2.83465; // mm → pt
      for (let i = 0; i < total; i++) {
        setProgress({ pct: 5 + Math.round((85 * (i + 1)) / total), label: `Vkládám obrázek ${i + 1}/${total}` });
        const canvas = await loadImage(files[i]);
        const pngData = canvas.toDataURL("image/png").split(",")[1];
        const pngBytes = Uint8Array.from(atob(pngData), (c) => c.charCodeAt(0));
        const img = await doc.embedPng(pngBytes);
        const iw = img.width(), ih = img.height();
        let pageW = iw, pageH = ih;
        if (fitA4) {
          const isLandscape = orient === "l" || (orient === "auto" && iw > ih);
          pageW = isLandscape ? A4[1] : A4[0];
          pageH = isLandscape ? A4[0] : A4[1];
        }
        const page = doc.addPage([pageW, pageH]);
        const availW = pageW - marginPt * 2, availH = pageH - marginPt * 2;
        const scale = Math.min(availW / iw, availH / ih, 1);
        const drawW = iw * scale, drawH = ih * scale;
        page.drawImage(img, { x: (pageW - drawW) / 2, y: (pageH - drawH) / 2, width: drawW, height: drawH });
      }
      setProgress({ pct: 95, label: "Ukládám PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("PDF bylo vytvořeno z obrázků");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Vytvoření PDF selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "obrazky.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="ip-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem obrázky"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg></span>
        <span className="dz-title">Přetáhněte sem obrázky</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">PNG · JPG · WEBP · více souborů · pořadí lze měnit</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} multiple aria-hidden="true" onChange={onInputChange} />
      </div>

      {files.length > 0 && (
        <div className="file-list" id="ip-list" aria-label="Vybrané obrázky">
          {files.map((f, idx) => (
            <div className="file-item" key={`${f.name}-${idx}`}>
              <span className="fi-ico"><Icon name="File" size={18} /></span>
              <span className="fi-meta"><span className="fi-name">{f.name}</span><span className="fi-size">{fmtSize(f.size)}</span></span>
              <span className="fi-move">
                <button type="button" className="btn btn-ghost btn-icon-sm" aria-label={t("move_up", { name: f.name })} disabled={idx === 0} onClick={() => move(idx, idx - 1)}><Icon name="Upload" size={14} /></button>
                <button type="button" className="btn btn-ghost btn-icon-sm" aria-label={t("move_down", { name: f.name })} disabled={idx === files.length - 1} onClick={() => move(idx, idx + 1)}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="Upload" size={14} /></span></button>
              </span>
              <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: f.name })} onClick={() => removeAt(idx)}><Icon name="X" size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="stack-sm" id="ip-work">
        <div>
          <label className="field-label" htmlFor="ip-orient">Orientace strany</label>
          <select id="ip-orient" className="select" value={orient} onChange={(e) => setOrient(e.target.value as "auto" | "p" | "l")}>
            <option value="auto">Auto (podle obrázku)</option>
            <option value="p">Na výšku (portrét)</option>
            <option value="l">Na šířku (krajina)</option>
          </select>
        </div>
        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="ip-margin">Okraj: <span className="mono">{margin}</span> mm</label>
            <input id="ip-margin" type="range" min={0} max={40} step={1} value={margin} onChange={(e) => setMargin(+e.target.value)} />
          </div>
          <label className="checkbox-row" style={{ alignSelf: "end" }}><input id="ip-fitA4" type="checkbox" checked={fitA4} onChange={(e) => setFitA4(e.target.checked)} /> <span>Vložit na A4 (jinak přesná velikost obrázku)</span></label>
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="ip-run" type="button" disabled={!files.length} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v6h6" /><path d="M4 4h10l6 6v10H4z" /></svg> Vytvořit PDF
        </button>
        <button className="btn btn-ghost" type="button" disabled={!files.length} onClick={clearAll}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /></svg> Vyčistit
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">obrazky.pdf</span><span className="rc-sub">{files.length} obrázků{fitA4 ? " · A4" : ""}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Převod běží lokálně přes pdf-lib. Obrázky se neodesílají na server.</div>
    </div>
  );
}