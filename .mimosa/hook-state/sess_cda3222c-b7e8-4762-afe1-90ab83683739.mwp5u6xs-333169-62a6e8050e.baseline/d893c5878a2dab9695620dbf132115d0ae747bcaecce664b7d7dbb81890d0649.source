"use client";

// Editace PDF (experimentální) — náhled strany přes pdf.js (scale 0,8) +
// navigace stránkami; kliknutím do náhledu se umísťují: Text (barva/velikost),
// Razítko (rotovaný 30° červeně orámovaný box s textem) a Podpis (kreslení
// na malém canvasu). Uložení přes pdf-lib (drawText/drawRectangle/embedPng).
// Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfjsViewport { width: number; height: number; }
interface PdfjsRenderTask { promise: Promise<void>; cancel(): void; }
interface PdfjsPage { getViewport(opts: { scale: number }): PdfjsViewport; render(opts: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): PdfjsRenderTask; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }
interface PdfLibPage {
  drawText(text: string, opts: unknown): void;
  drawRectangle(opts: unknown): void;
  drawImage(img: unknown, opts: unknown): void;
}
interface PdfLibDoc {
  getPages(): PdfLibPage[];
  embedFont(font: unknown): Promise<unknown>;
  embedPng(data: string): Promise<unknown>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfLibDoc>;
  save(): Promise<Uint8Array>;
}
interface PdfLib {
  PDFDocument: { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfLibDoc> };
  rgb: (r: number, g: number, b: number) => unknown;
  degrees: (d: number) => unknown;
  StandardFonts: { Helvetica: unknown };
}

function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }
function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = ".pdf,application/pdf";
const SCALE = 0.8;
const STAMP_ANGLE = 30;
const STAMP_SIZE = 12;

type EditMode = "text" | "stamp" | "sign";
type EditItem =
  | { id: number; page: number; type: "text"; x: number; y: number; text: string; size: number; color: string }
  | { id: number; page: number; type: "stamp"; x: number; y: number; text: string }
  | { id: number; page: number; type: "sign"; x: number; y: number; data: string; width: number; aspect: number };

const MODE_LABEL: Record<EditMode, string> = { text: "Text", stamp: "Razítko", sign: "Podpis" };

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Helvetica (WinAnsi) neumí č/ě/ů… — záloha, ať drawText neshodí ukládání. */
function winAnsiSafe(s: string): string {
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\xA1-\xFF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u20AC]/g, "?");
}

/** Ořízne bílé okraje kreslicího canvasu → PNG data URL + poměr stran. */
function trimCanvas(c: HTMLCanvasElement): { dataUrl: string; aspect: number } | null {
  const ctx = c.getContext("2d")!;
  const { width, height } = c;
  const d = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1; out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return { dataUrl: out.toDataURL("image/png"), aspect: out.height / out.width };
}

export default function PdfEdit({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [curPage, setCurPage] = useState(1);
  const [items, setItems] = useState<EditItem[]>([]);
  const [mode, setMode] = useState<EditMode>("text");
  // Text mode
  const [textContent, setTextContent] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState("#000000");
  // Razítko
  const [stampText, setStampText] = useState("SCHVÁLENO");
  // Podpis
  const [pendingSig, setPendingSig] = useState<{ dataUrl: string; aspect: number } | null>(null);
  const [sigWidth, setSigWidth] = useState(160);
  const [sigVersion, setSigVersion] = useState(0); // překreslení náhledu po loadu <img>
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const pdfDocRef = useRef<PdfjsDoc | null>(null);
  const renderTaskRef = useRef<PdfjsRenderTask | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const sigImgCache = useRef(new Map<string, HTMLImageElement>());
  const nextIdRef = useRef(1);
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

  const addFile = async (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setInfo(""); setDone(false); setBlobUrl(""); setItems([]); setCurPage(1); setState("ready");
    try {
      await ensurePdfjs();
      const buf = await f.arrayBuffer();
      pdfDocRef.current = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      setNumPages(pdfDocRef.current.numPages);
    } catch (e) {
      const m = (e as Error).message || "PDF se nepodařilo načíst.";
      setError(m); setState("error", m);
    }
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) void addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) void addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => {
    setFile(null); setError(""); setProgress(null); setInfo(""); setDone(false); setBlobUrl("");
    setItems([]); setNumPages(0); setCurPage(1); setPendingSig(null); pdfDocRef.current = null; setState("idle");
  };

  // Náhled aktuální strany + overlay všech položek na této straně.
  const redraw = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvas = previewRef.current;
    if (!doc || !canvas) return;
    try {
      if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch { /* už doběhl */ } }
      const page = await doc.getPage(curPage);
      const vp = page.getViewport({ scale: SCALE });
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      await task.promise;
      const toY = (pdfY: number) => canvas.height - pdfY * SCALE;
      for (const it of items) {
        if (it.page !== curPage) continue;
        if (it.type === "text") {
          ctx.fillStyle = it.color;
          ctx.font = `${it.size * SCALE}px Helvetica, Arial, sans-serif`;
          ctx.fillText(it.text, it.x * SCALE, toY(it.y));
        } else if (it.type === "stamp") {
          const boxW = it.text.length * STAMP_SIZE * 0.6 + 24;
          const boxH = STAMP_SIZE * 2.2;
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.translate(it.x * SCALE, toY(it.y));
          ctx.rotate((-STAMP_ANGLE * Math.PI) / 180);
          ctx.strokeStyle = "#d91818"; ctx.lineWidth = 2;
          ctx.strokeRect(-boxW * SCALE / 2, -boxH * SCALE / 2, boxW * SCALE, boxH * SCALE);
          ctx.fillStyle = "#d91818";
          ctx.font = `${STAMP_SIZE * SCALE}px Helvetica, Arial, sans-serif`;
          ctx.fillText(it.text, (-boxW / 2 + 12) * SCALE, STAMP_SIZE * 0.35 * SCALE);
          ctx.restore();
        } else {
          let img = sigImgCache.current.get(it.data);
          if (!img) {
            img = new Image();
            img.onload = () => setSigVersion((v) => v + 1);
            img.src = it.data;
            sigImgCache.current.set(it.data, img);
          }
          if (img.complete && img.naturalWidth) {
            const h = it.width * it.aspect;
            ctx.drawImage(img, it.x * SCALE, toY(it.y), it.width * SCALE, h * SCALE);
          }
        }
      }
    } catch { /* zrušený render při rychlém přepínání stran */ }
  }, [curPage, items]);

  useEffect(() => { void redraw(); }, [redraw, sigVersion, numPages]);

  // Klik do náhledu → umístit položku aktuálního režimu.
  const onPreviewClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewRef.current;
    if (!canvas || !numPages) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const pdfX = cx / SCALE;
    const pdfY = canvas.height / SCALE - cy / SCALE; // PDF y roste zdola
    const id = nextIdRef.current++;
    if (mode === "text") {
      if (!textContent.trim()) { setError("Zadejte nejprve text, který chcete umístit."); return; }
      setItems((prev) => [...prev, { id, page: curPage, type: "text", x: pdfX, y: pdfY, text: textContent, size: fontSize, color }]);
    } else if (mode === "stamp") {
      if (!stampText.trim()) { setError("Zadejte text razítka."); return; }
      setItems((prev) => [...prev, { id, page: curPage, type: "stamp", x: pdfX, y: pdfY, text: stampText }]);
    } else {
      if (!pendingSig) { setError("Nejprve nakreslete podpis a klikněte na „Použít podpis“."); return; }
      setItems((prev) => [...prev, { id, page: curPage, type: "sign", x: pdfX, y: pdfY, data: pendingSig.dataUrl, width: sigWidth, aspect: pendingSig.aspect }]);
    }
    setError(""); setInfo("");
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const itemLabel = (it: EditItem): string => {
    const where = `strana ${it.page} · x ${Math.round(it.x)} · y ${Math.round(it.y)}`;
    if (it.type === "text") return `Text „${it.text.slice(0, 24)}${it.text.length > 24 ? "…" : ""}“ · ${where}`;
    if (it.type === "stamp") return `Razítko „${it.text.slice(0, 24)}“ · ${where}`;
    return `Podpis · ${where}`;
  };

  // Uložení: aplikuje všechny položky přes pdf-lib.
  const save = async () => {
    if (!file || !items.length) return;
    setError(""); setDone(false); setBlobUrl(""); setState("processing"); setProgress({ pct: 10, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      setProgress({ pct: 25, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer(); // čerstvá kopie (pdf.js převzal předchozí buffer)
      const pdf = await P.PDFDocument.load(buf, { ignoreEncryption: true });
      const font = await pdf.embedFont(P.StandardFonts.Helvetica);
      const pages = pdf.getPages();
      let simplified = false;
      for (const it of items) {
        setProgress({ pct: 25 + Math.round((60 * items.indexOf(it)) / items.length), label: "Aplikuji úpravy…" });
        const page = pages[it.page - 1];
        if (!page) continue;
        if (it.type === "text") {
          const [r, g, b] = hexToRgb(it.color);
          try {
            page.drawText(it.text, { x: it.x, y: it.y, size: it.size, font, color: P.rgb(r, g, b) });
          } catch {
            simplified = true;
            page.drawText(winAnsiSafe(it.text), { x: it.x, y: it.y, size: it.size, font, color: P.rgb(r, g, b) });
          }
        } else if (it.type === "stamp") {
          const boxW = it.text.length * STAMP_SIZE * 0.6 + 24;
          const boxH = STAMP_SIZE * 2.2;
          const red = P.rgb(0.85, 0.09, 0.09);
          const rot = P.degrees(STAMP_ANGLE);
          const x = it.x - boxW / 2;
          const y = it.y - boxH / 2;
          page.drawRectangle({ x, y, width: boxW, height: boxH, borderColor: red, borderWidth: 2, opacity: 0.85, color: undefined, rotate: rot });
          try {
            page.drawText(it.text, { x: x + 12, y: it.y - STAMP_SIZE * 0.35, size: STAMP_SIZE, font, color: red, opacity: 0.85, rotate: rot });
          } catch {
            simplified = true;
            page.drawText(winAnsiSafe(it.text), { x: x + 12, y: it.y - STAMP_SIZE * 0.35, size: STAMP_SIZE, font, color: red, opacity: 0.85, rotate: rot });
          }
        } else {
          const png = await pdf.embedPng(it.data);
          const h = it.width * it.aspect;
          page.drawImage(png, { x: it.x, y: it.y - h, width: it.width, height: h });
        }
      }
      if (simplified) setInfo("Některé znaky neumí standardní písmo Helvetica zobrazit — byly zjednodušeny (bez diakritiky).");
      setProgress({ pct: 90, label: "Ukládám PDF…" });
      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("Upravené PDF je připraveno");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Uložení PDF selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "upraveno.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Experimentální nástroj — text, razítka a podpisy se přidávají jako nová vrstva, stávající obsah PDF se nemění.</p>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="ed-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      {numPages > 0 && (
        <div className="stack-sm" id="ed-work">
          {/* náhled strany + navigace */}
          <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-icon-sm" id="ed-prev" type="button" aria-label="Předchozí strana" disabled={curPage <= 1} onClick={() => setCurPage((p) => Math.max(1, p - 1))}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
            <span className="mono" style={{ fontSize: "0.85rem" }}>Strana {curPage} / {numPages}</span>
            <button className="btn btn-ghost btn-icon-sm" id="ed-next" type="button" aria-label="Další strana" disabled={curPage >= numPages} onClick={() => setCurPage((p) => Math.min(numPages, p + 1))}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
          </div>
          <div className="pdf-preview-frame">
            <canvas ref={previewRef} onClick={onPreviewClick} aria-label="Náhled strany PDF — kliknutím umístíte vybraný prvek" style={{ maxWidth: "100%", cursor: "crosshair", boxShadow: "0 3px 12px rgba(0,0,0,.28)" }} />
          </div>

          {/* režim + parametry */}
          <div>
            <label className="field-label" htmlFor="ed-mode">Režim vkládání</label>
            <select id="ed-mode" className="select" value={mode} onChange={(e) => setMode(e.target.value as EditMode)}>
              <option value="text">Text</option>
              <option value="stamp">Razítko</option>
              <option value="sign">Podpis</option>
            </select>
          </div>

          {mode === "text" && (
            <div className="stack-sm">
              <div>
                <label className="field-label" htmlFor="ed-text">Text</label>
                <textarea id="ed-text" className="textarea" rows={2} value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Text k umístění…" />
              </div>
              <div className="grid-2">
                <div>
                  <label className="field-label" htmlFor="ed-size">Velikost: <span className="mono">{fontSize}</span> pt</label>
                  <input id="ed-size" type="range" min={6} max={48} step={1} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="ed-color">Barva</label>
                  <input id="ed-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: "100%", height: "2.5rem", border: "1px solid var(--bd, #ccc)", borderRadius: "0.5rem", background: "transparent" }} />
                </div>
              </div>
              <p className="muted" style={{ fontSize: "0.8rem" }}>Klikněte do náhledu — text se umístí na místo kliknutí (levý dolní roh).</p>
            </div>
          )}

          {mode === "stamp" && (
            <div className="stack-sm">
              <div>
                <label className="field-label" htmlFor="ed-stamp">Text razítka</label>
                <input id="ed-stamp" className="input" type="text" value={stampText} onChange={(e) => setStampText(e.target.value)} placeholder="SCHVÁLENO" />
              </div>
              <p className="muted" style={{ fontSize: "0.8rem" }}>Klikněte do náhledu — razítko se umístí na střed kliknutého místa (červený rám, otočení 30°, poloprůhledné).</p>
            </div>
          )}

          {mode === "sign" && (
            <div className="stack-sm">
              <SigPad onUse={(dataUrl, aspect) => { setPendingSig({ dataUrl, aspect }); setInfo("Podpis připraven — klikněte do náhledu pro umístění."); }} />
              <div>
                <label className="field-label" htmlFor="ed-sigw">Šířka podpisu: <span className="mono">{sigWidth}</span> pt</label>
                <input id="ed-sigw" type="range" min={80} max={320} step={5} value={sigWidth} onChange={(e) => setSigWidth(+e.target.value)} />
              </div>
              <p className="muted" style={{ fontSize: "0.8rem" }}>{pendingSig ? "Podpis připraven — klikněte do náhledu pro umístění." : "Nakreslete podpis myší nebo prstem a klikněte na „Použít podpis“."}</p>
            </div>
          )}

          {/* seznam umístěných položek */}
          {items.length > 0 && (
            <div className="stack-sm" id="ed-items">
              <span className="field-label">Umístěné prvky ({items.length})</span>
              {items.map((it) => (
                <div key={it.id} className="row" style={{ alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.85rem" }}>{itemLabel(it)}</span>
                  <button type="button" className="btn btn-ghost btn-icon-sm" aria-label={`Odebrat ${it.type === "text" ? "text" : it.type === "stamp" ? "razítko" : "podpis"}`} onClick={() => removeItem(it.id)}><Icon name="X" size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {info && <p className="muted" style={{ fontSize: "0.85rem" }}>{info}</p>}
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-touch" id="ed-save" type="button" disabled={!file || !items.length} onClick={save}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg> Uložit PDF
            </button>
          </div>
        </div>
      )}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">upraveno.pdf</span><span className="rc-sub">{items.length} {items.length === 1 ? "prvek" : "prvků"}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Editace běží lokálně přes pdf.js a pdf-lib — soubor neopustí váš počítač.</div>
    </div>
  );
}

// Kreslicí plátno podpisu (myš/dotyk) s oříznutím bílých okrajů.
function SigPad({ onUse }: { onUse: (dataUrl: string, aspect: number) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    ref.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !ref.current) return;
    const p = pos(e);
    const ctx = ref.current.getContext("2d")!;
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current?.x ?? p.x, last.current?.y ?? p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const up = () => { drawing.current = false; last.current = null; };

  const clear = () => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
  };
  const use = () => {
    const c = ref.current;
    if (!c) return;
    const trimmed = trimCanvas(c);
    if (!trimmed) return; // prázdné plátno
    onUse(trimmed.dataUrl, trimmed.aspect);
  };

  return (
    <div className="stack-sm">
      <span className="field-label">Podpis — kreslete myší nebo prstem</span>
      <canvas
        ref={ref} width={420} height={170}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        style={{ width: "100%", maxWidth: "420px", touchAction: "none", border: "1px solid var(--bd, #ccc)", borderRadius: "0.5rem", background: "#fff", cursor: "crosshair" }}
        aria-label="Kreslicí plátno podpisu"
      />
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" type="button" onClick={clear}>Smazat</button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={use}>Použít podpis</button>
      </div>
    </div>
  );
}
