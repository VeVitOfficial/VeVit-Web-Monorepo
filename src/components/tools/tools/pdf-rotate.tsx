"use client";

// Otáčení stran PDF — React port legacy tools/assets/js/tools/pdf-rotate.js.
// Interaktivní náhledy: klik na náhled strany otočí TU konkrétní stranu
// (cykly 0° → 90° → 180° → 270°), náhled se otočí hned (CSS transform).
// Ukládání přes pdf-lib setRotation in-place (metadata dokumentu zůstávají).
// Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfPageMod { setRotation(deg: 90 | 180 | 270 | 0): void; getRotation(): { angle: number }; }
interface PdfDoc {
  getPageCount(): number;
  save(): Promise<Uint8Array>;
  getPages(): PdfPageMod[];
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; degrees: (d: number) => unknown; }
interface PdfDocCtor { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>; }
interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; }
interface PdfjsPage {
  getViewport(opts: { scale: number }): PdfjsViewport;
  render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask;
}
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }

const ACCEPT = ".pdf,application/pdf";
type Angle = 0 | 90 | 180 | 270;

export default function PdfRotate({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  /** úhel otočení pro každou stranu (1-based číslo strany) */
  const [angles, setAngles] = useState<Record<number, Angle>>({});
  const [allAngle, setAllAngle] = useState<Angle>(90);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const thumbsRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const ensurePdfjs = async () => {
    if ((window as unknown as { pdfjsLib?: unknown }).pdfjsLib) return;
    await loadScript("/tools/assets/js/lib/pdf.min.js");
    pdfjs().GlobalWorkerOptions.workerSrc = "/tools/assets/js/lib/pdf.worker.min.js";
  };

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setProgress(null); setBlobUrl("");
    setAngles({}); setPageCount(0); thumbsRef.current = new Map();
    setState("ready");
    Promise.resolve().then(() => { void renderThumbs(f); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setBlobUrl(""); setAngles({}); setPageCount(0); thumbsRef.current = new Map(); setState("idle"); };

  const renderThumbs = async (f: File) => {
    try {
      setLoading(true); await ensurePdfjs();
      const buf = await f.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = doc.numPages;
      setPageCount(total);
      thumbsRef.current = new Map();
      for (let i = 1; i <= total; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        thumbsRef.current.set(i, canvas);
      }
    } catch (e) { setError((e as Error).message || "Náhledy se nepodařilo načíst."); }
    finally { setLoading(false); }
  };

  // klik na náhled = otočit tuto stranu o 90° (cyklus 0→90→180→270→0)
  const cyclePage = (page: number) => {
    setAngles((prev) => {
      const next = { ...prev };
      next[page] = (((prev[page] ?? 0) + 90) % 360) as Angle;
      if (next[page] === 0) delete next[page];
      return next;
    });
  };
  const applyToAll = () => {
    setAngles(() => {
      const next: Record<number, Angle> = {};
      for (let i = 1; i <= pageCount; i++) next[i] = allAngle;
      return next;
    });
  };
  const resetAll = () => setAngles({});

  const rotatedCount = Object.keys(angles).length;

  const run = async () => {
    if (!file) return;
    setError(""); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      setProgress({ pct: 30, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const P = pdfLib();
      const doc = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const pages = doc.getPages();
      setProgress({ pct: 60, label: "Otáčím strany…" });
      for (const [numStr, angle] of Object.entries(angles)) {
        const page = pages[+numStr - 1];
        if (!page) continue;
        // přičíst k existující rotaci (PDF /Rotate) — modulo 360
        const current = page.getRotation?.()?.angle ?? 0;
        page.setRotation(P.degrees((current + angle) % 360) as unknown as 90);
      }
      setProgress({ pct: 85, label: "Ukládám otočené PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setState("success");
      toastSuccess("PDF bylo otočeno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Otáčení selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "otoceno.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pr-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      {pageCount > 0 && (
        <div className="stack-sm" id="pr-work">
          <p className="muted" style={{ fontSize: "0.85rem" }}>Klikněte na náhled strany a otočte ji o 90°. Každá strana se otočí zvlášť — náhled se překreslí hned.</p>
          <div className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label className="field-label" htmlFor="pr-all-angle">Otočit všechny strany o</label>
              <select id="pr-all-angle" className="select" value={allAngle} onChange={(e) => setAllAngle(+e.target.value as Angle)}>
                <option value={90}>90° vpravo</option>
                <option value={180}>180°</option>
                <option value={270}>90° vlevo (270°)</option>
              </select>
            </div>
            <button type="button" className="btn btn-outline" id="pr-apply-all" onClick={applyToAll} disabled={pageCount === 0}>Aplikovat na všechny</button>
            <button type="button" className="btn btn-ghost" id="pr-reset" onClick={resetAll} disabled={rotatedCount === 0}>Zrušit rotace</button>
          </div>
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="pr-run" type="button" disabled={!file || rotatedCount === 0} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg> Uložit otočené PDF{rotatedCount > 0 ? ` (${rotatedCount})` : ""}
        </button>
      </div>

      {loading && <p className="muted" aria-live="polite">Načítám náhledy stran…</p>}

      {pageCount > 0 && (
        <div className="pdf-page-grid pdf-page-grid-organize" id="pr-preview" role="list" aria-label="Strany PDF, klikněte pro otočení">
          {pages.map((page) => (
            <RotateThumb key={page} page={page} angle={angles[page] ?? 0} thumbsRef={thumbsRef} onClick={() => cyclePage(page)} />
          ))}
        </div>
      )}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">otoceno.pdf</span><span className="rc-sub">Otočeno {rotatedCount} stran</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Otáčení běží lokálně přes pdf-lib a pdf.js.</div>
    </div>
  );
}

// Náhled strany s rotací — canvas se překresluje z ref mapy, otočení dělá
// CSS transform (bez zbytečného re-renderu náhledu).
function RotateThumb({ page, angle, thumbsRef, onClick }: {
  page: number;
  angle: Angle;
  thumbsRef: React.MutableRefObject<Map<number, HTMLCanvasElement>>;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    const c = thumbsRef.current.get(page);
    if (c) { const clone = document.createElement("canvas"); clone.width = c.width; clone.height = c.height; clone.getContext("2d")!.drawImage(c, 0, 0); clone.style.maxWidth = "100%"; clone.style.maxHeight = "12rem"; el.appendChild(clone); }
  }, [page, thumbsRef]);
  const swap = angle === 90 || angle === 270;
  return (
    <button type="button" className={`pdf-thumb pdf-thumb-rotate${angle ? " rotated" : ""}`} role="listitem" onClick={onClick}
      aria-label={`Strana ${page}: otočeno o ${angle}°, klikněte pro další otočení`} title={`Strana ${page} — klik pro otočení o 90°`}>
      <span className="pdf-thumb-canvas-wrap" style={{ display: "block", transform: angle ? `rotate(${angle}deg)` : undefined }}>
        <span ref={ref} className="pdf-thumb-canvas" style={swap ? { display: "inline-block", margin: "1.4rem 0" } : undefined} />
      </span>
      <span className="pdf-thumb-num">{page}{angle ? ` · ${angle}°` : ""}</span>
    </button>
  );
}
