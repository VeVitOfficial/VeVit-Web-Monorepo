"use client";
/* eslint-disable @next/next/no-img-element -- náhledy jsou dataURL z canvasu */

// PDF na obrázky: vybrané strany se vyrenderují (pdf.js) do PNG / JPG / WebP / BMP / TIFF / GIF.
// Výsledek se nebalí do ZIPu — každý obrázek má vlastní náhled (klik = zvětšení, šipky listují)
// a vlastní tlačítko Stáhnout. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, toastSuccess, useToolState } from "@/components/tools/tool-runtime";
import { Lightbox, openPdf, renderPdfPage } from "@/components/tools/file-preview";
import { RASTER_FORMATS, encodeCanvas, type RasterFormat } from "@/components/tools/raster-encode";

const ACCEPT = ".pdf,application/pdf";
interface Out { file: File; page: number; preview: string }

const DownloadIco = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>;

function saveFile(f: File) {
  const url = URL.createObjectURL(f);
  const a = document.createElement("a"); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function PdfToImages({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [total, setTotal] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<RasterFormat>("png");
  const [quality, setQuality] = useState(0.88);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [outs, setOuts] = useState<Out[]>([]);
  const [lb, setLb] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  // Počet stran + miniatury pro výběr stran.
  useEffect(() => {
    if (!file) return;
    let off = false;
    (async () => {
      try {
        const doc = await openPdf(file);
        if (off) return;
        setTotal(doc.numPages);
        setSelected(Array.from({ length: doc.numPages }, (_, i) => i + 1));
        for (let n = 1; n <= doc.numPages && n <= 400; n++) {
          const u = await renderPdfPage(doc, n, 110, 150, 0.6);
          if (off) return;
          setThumbs((p) => ({ ...p, [n]: u }));
        }
      } catch {
        if (!off) { setError("PDF se nepodařilo načíst (je poškozené nebo chráněné heslem)."); setState("error", "PDF se nepodařilo načíst."); }
      }
    })();
    return () => { off = true; };
  }, [file, setState]);

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setTotal(0); setThumbs({}); setSelected([]); setOuts([]); setError(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setTotal(0); setThumbs({}); setSelected([]); setOuts([]); setError(""); setProgress(null); setState("idle"); };
  const toggle = (n: number) => { setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n].sort((a, b) => a - b))); setOuts([]); };

  const meta = RASTER_FORMATS.find((f) => f.key === format)!;

  const run = async () => {
    if (!file || !selected.length) return;
    setError(""); setOuts([]); setState("processing"); setProgress({ pct: 5, label: "Načítám PDF…" });
    try {
      const doc = await openPdf(file);
      const base = file.name.replace(/\.pdf$/i, "") || "dokument";
      const pad = String(doc.numPages).length;
      const result: Out[] = [];
      for (let k = 0; k < selected.length; k++) {
        const n = selected[k];
        setProgress({ pct: 10 + Math.round((85 * k) / selected.length), label: `Renderuji stranu ${n} (${k + 1}/${selected.length})` });
        const page = await doc.getPage(n);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
        const blob = await encodeCanvas(canvas, format, quality);
        const name = `${base}${doc.numPages > 1 ? `_strana-${String(n).padStart(pad, "0")}` : ""}.${meta.ext}`;
        // Náhled (TIFF/BMP prohlížeč nezobrazí) — zmenšený JPEG z canvasu.
        const r = Math.min(1, 900 / canvas.width, 1100 / canvas.height);
        const pv = document.createElement("canvas");
        pv.width = Math.max(1, Math.round(canvas.width * r)); pv.height = Math.max(1, Math.round(canvas.height * r));
        const pctx = pv.getContext("2d")!; pctx.fillStyle = "#fff"; pctx.fillRect(0, 0, pv.width, pv.height); pctx.drawImage(canvas, 0, 0, pv.width, pv.height);
        result.push({ file: new File([blob], name, { type: meta.mime }), page: n, preview: pv.toDataURL("image/jpeg", 0.85) });
      }
      setOuts(result);
      setProgress(null); setState("success");
      toastSuccess(result.length === 1 ? "Obrázek je hotový" : `Vyrenderováno ${result.length} obrázků`);
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Převod na obrázky selhal.";
      setError(m); setState("error", m);
    }
  };

  const downloadAll = async () => { for (const o of outs) { saveFile(o.file); await new Promise((r) => window.setTimeout(r, 350)); } };

  return (
    <div className="stack" style={{ maxWidth: file ? "58rem" : "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pi-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">{file ? file.name : "Přetáhněte sem PDF soubor"}</span>
        <span className="dz-hint">{file ? `${fmtSize(file.size)}${total ? ` · ${total} stran` : ""} · klikněte pro výměnu souboru` : "nebo klikněte pro výběr"}</span>
        <span className="dz-accept">Pouze .pdf · jeden soubor</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} aria-hidden="true" onChange={onInputChange} />
      </div>

      {file && (
        <div className="p2i-layout" id="pi-work">
          <div className="stack-sm">
            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}>
              <span className="field-label" style={{ margin: 0 }}>Strany k převodu ({selected.length}/{total || "…"})</span>
              <span className="row" style={{ gap: ".35rem" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelected(Array.from({ length: total }, (_, i) => i + 1)); setOuts([]); }} disabled={!total}>Vybrat vše</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSelected([]); setOuts([]); }} disabled={!selected.length}>Zrušit výběr</button>
              </span>
            </div>
            <div className="p2i-pages" role="group" aria-label="Strany dokumentu">
              {Array.from({ length: total }, (_, k) => k + 1).map((n) => (
                <label key={n} className={`p2i-page${selected.includes(n) ? " is-on" : ""}`}>
                  <input type="checkbox" checked={selected.includes(n)} onChange={() => toggle(n)} aria-label={`Strana ${n}`} />
                  {thumbs[n] ? <img src={thumbs[n]} alt="" draggable={false} /> : <span className="split-ph" />}
                  <span className="split-num">{n}</span>
                </label>
              ))}
              {!total && !error ? <p className="muted">Načítám náhledy…</p> : null}
            </div>
          </div>

          <aside className="split-panel" aria-label="Nastavení">
            <div>
              <span className="field-label">Formát obrázku</span>
              <div className="p2i-formats" role="radiogroup" aria-label="Formát">
                {RASTER_FORMATS.map((f) => (
                  <button key={f.key} type="button" role="radio" aria-checked={format === f.key} className={`btn ${format === f.key ? "btn-primary" : "btn-outline"} btn-sm`}
                    title={f.hint} onClick={() => { setFormat(f.key); setOuts([]); }}>{f.label}</button>
                ))}
              </div>
              <p className="muted" style={{ fontSize: ".78rem", margin: ".35rem 0 0" }}>{meta.hint}</p>
            </div>
            <div>
              <label className="field-label" htmlFor="pi-scale">Měřítko</label>
              <select id="pi-scale" className="select" value={scale} onChange={(e) => { setScale(+e.target.value); setOuts([]); }}>
                <option value={1}>1× (72 DPI)</option>
                <option value={1.5}>1,5×</option>
                <option value={2}>2× (144 DPI)</option>
                <option value={3}>3× (216 DPI)</option>
                <option value={4}>4× (288 DPI)</option>
              </select>
            </div>
            {meta.lossy && (
              <div id="pi-q-grp">
                <label className="field-label" htmlFor="pi-q">Kvalita: <span className="mono">{quality.toFixed(2)}</span></label>
                <input id="pi-q" type="range" min={0.5} max={1} step={0.01} value={quality} onChange={(e) => { setQuality(+e.target.value); setOuts([]); }} />
              </div>
            )}
            <button className="btn btn-primary btn-block btn-touch" id="pi-run" type="button" disabled={!selected.length || !!progress} onClick={run}>
              {selected.length > 1 ? `Převést ${selected.length} stran na ${meta.label}` : `Převést na ${meta.label}`}
            </button>
            <button className="btn btn-ghost btn-block" type="button" onClick={clearAll}>Vyčistit</button>
          </aside>
        </div>
      )}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {outs.length > 0 && (
        <div className="stack-sm" id="pi-result">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: ".5rem" }}>
            <span className="field-label" style={{ margin: 0 }}>Hotovo — {outs.length === 1 ? "obrázek" : `${outs.length} obrázků`} ({meta.label})</span>
            {outs.length > 1 && <button type="button" className="btn btn-primary btn-sm" onClick={downloadAll}><DownloadIco /> Stáhnout všechny obrázky</button>}
          </div>
          <div className="p2i-results">
            {outs.map((o, i) => (
              <figure className="p2i-out" key={o.file.name}>
                <button type="button" className="p2i-out-img" onClick={() => setLb(i)} aria-label={`Zvětšit náhled: ${o.file.name}`}><img src={o.preview} alt={o.file.name} /></button>
                <figcaption><span className="fi-name" title={o.file.name}>{o.file.name}</span><span className="fi-size">{fmtSize(o.file.size)}</span></figcaption>
                <button type="button" className="btn btn-primary btn-sm btn-block" onClick={() => saveFile(o.file)}><DownloadIco /> Stáhnout {meta.label}</button>
              </figure>
            ))}
          </div>
        </div>
      )}
      {lb != null && outs[lb] ? (
        <Lightbox locale={locale} label={outs[lb].file.name} onClose={() => setLb(null)}
          onPrev={lb > 0 ? () => setLb(lb - 1) : undefined} onNext={lb < outs.length - 1 ? () => setLb(lb + 1) : undefined}
          caption={`${outs[lb].file.name} · ${fmtSize(outs[lb].file.size)}${outs.length > 1 ? ` · ${lb + 1} / ${outs.length}` : ""}`}>
          <img className="vv-lb-media" src={outs[lb].preview} alt={outs[lb].file.name} />
        </Lightbox>
      ) : null}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Renderování běží lokálně přes pdf.js. Soubor se neodesílá na server.</div>
    </div>
  );
}
