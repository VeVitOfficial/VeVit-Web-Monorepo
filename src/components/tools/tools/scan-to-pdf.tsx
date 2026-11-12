"use client";

// Sken do PDF — snímky z kamery (getUserMedia, "Snímit" = frame → PNG)
// nebo nahrané obrázky; seznam lze řadit a mazat, volitelně okraj a A4.
// PDF se skládá přes pdf-lib embedPng. Čistě client-side — kamera i soubory
// zůstávají v prohlížeči.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, loadScript, toastSuccess, useToolState,
} from "@/components/tools/tool-runtime";
import { SortableFileList } from "@/components/tools/file-preview";

interface PdfImg { width: number; height: number; }
interface PdfPageMod { drawImage(img: PdfImg, opts: unknown): void; }
interface PdfDoc {
  addPage(size?: [number, number]): PdfPageMod;
  embedPng(data: ArrayBuffer | Uint8Array): Promise<PdfImg>;
  save(): Promise<Uint8Array>;
}
interface PdfLib { PDFDocument: PdfDocCtor; }
interface PdfDocCtor { create(): Promise<PdfDoc>; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = "image/*";
const A4: [number, number] = [595.28, 841.89]; // pt

let scanSeq = 1;

export default function ScanToPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [orient, setOrient] = useState<"auto" | "p" | "l">("auto");
  const [margin, setMargin] = useState(0);
  const [fitA4, setFitA4] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState("");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  // ── kamera ──────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCamError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Prohlížeč nepodporuje přístup ke kameře (vyžaduje HTTPS).");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { /* autoplay může selhat, video element je stejně viditelný */ });
      }
      setCamOn(true);
    } catch (e) {
      streamRef.current = null;
      setCamOn(false);
      const reason = (e as Error)?.name === "NotAllowedError"
        ? "Přístup ke kameře byl zamítnut."
        : (e as Error)?.name === "NotFoundError" ? "Kamera nebyla nalezena." : ((e as Error).message || "Kamera není dostupná.");
      setCamError(`${reason} Nahrávání souborů funguje i bez kamery.`);
    }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  };
  // při odmontování komponenty kameru vypneme (až za definicí stopCamera)
  useEffect(() => () => { stopCamera(); }, []);
  // snímek z videa → PNG soubor v seznamu
  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `sken-${scanSeq++}.png`, { type: "image/png" });
      setError(""); setDone(false);
      setFiles((prev) => [...prev, f]);
      setState("ready");
    }, "image/png");
  };

  // ── nahrávání obrázků ──────────────────────────────────────────────────
  const addFiles = (arr: File[]) => {
    const imgs = arr.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) { setError(t("invalid_type")); return; }
    setError(""); setDone(false);
    setFiles((prev) => [...prev, ...imgs]);
    setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFiles([]); setError(""); setProgress(null); setDone(false); setBlobUrl(""); setState("idle"); };

  // Načte obrázek do canvasu (sjednocení formátů na PNG data). Vrací {canvas, w, h}.
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
        setProgress({ pct: 5 + Math.round((85 * (i + 1)) / total), label: `Vkládám snímek ${i + 1}/${total}` });
        const canvas = await loadImage(files[i]);
        const pngData = canvas.toDataURL("image/png").split(",")[1];
        const pngBytes = Uint8Array.from(atob(pngData), (c) => c.charCodeAt(0));
        const img = await doc.embedPng(pngBytes);
        const iw = img.width, ih = img.height;
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
      toastSuccess("PDF bylo vytvořeno ze snímků");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Vytvoření PDF selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "sken.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="sc-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem obrázky"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg></span>
        <span className="dz-title">Přetáhněte sem obrázky</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">PNG · JPG · WEBP · více souborů · pořadí lze měnit</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} multiple aria-hidden="true" onChange={onInputChange} />
      </div>

      <div className="stack-sm" id="sc-camera">
        {camOn ? (
          <>
            <video ref={videoRef} aria-label="Živý náhled kamery" playsInline muted style={{ width: "100%", maxWidth: "28rem", borderRadius: "0.5rem", border: "1px solid var(--bd,#4b5563)", background: "#000" }} />
            <div className="row" style={{ flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary" onClick={capture}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /><circle cx="12" cy="13" r="3" /></svg> Snímit
              </button>
              <button type="button" className="btn btn-ghost" onClick={stopCamera}>Zastavit kameru</button>
            </div>
          </>
        ) : (
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn btn-outline" onClick={() => { void startCamera(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /><circle cx="12" cy="13" r="3" /></svg> Zapnout kameru
            </button>
          </div>
        )}
        {camError && <p className="muted" role="status" style={{ fontSize: "0.85rem" }}>{camError}</p>}
      </div>

      {files.length > 0 && (
        <SortableFileList id="sc-list" files={files} onChange={setFiles} onAddFiles={addFiles} locale={locale} ariaLabel="Snímky k uložení" />
      )}

      <div className="stack-sm" id="sc-work">
        <div>
          <label className="field-label" htmlFor="sc-orient">Orientace strany</label>
          <select id="sc-orient" className="select" value={orient} onChange={(e) => setOrient(e.target.value as "auto" | "p" | "l")}>
            <option value="auto">Auto (podle obrázku)</option>
            <option value="p">Na výšku (portrét)</option>
            <option value="l">Na šířku (krajina)</option>
          </select>
        </div>
        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="sc-margin">Okraj: <span className="mono">{margin}</span> mm</label>
            <input id="sc-margin" type="range" min={0} max={40} step={1} value={margin} onChange={(e) => setMargin(+e.target.value)} />
          </div>
          <label className="checkbox-row" style={{ alignSelf: "end" }}><input id="sc-fitA4" type="checkbox" checked={fitA4} onChange={(e) => setFitA4(e.target.checked)} /> <span>Vložit na A4 (jinak přesná velikost snímku)</span></label>
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="sc-run" type="button" disabled={!files.length} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v6h6" /><path d="M4 4h10l6 6v10H4z" /></svg> Vytvořit PDF ({files.length})
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
          <div className="rc-meta"><span className="rc-title">sken.pdf</span><span className="rc-sub">{files.length} snímků{fitA4 ? " · A4" : ""}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Skenování běží lokálně přes pdf-lib. Snímky z kamery se neodesílají na server.</div>
    </div>
  );
}
