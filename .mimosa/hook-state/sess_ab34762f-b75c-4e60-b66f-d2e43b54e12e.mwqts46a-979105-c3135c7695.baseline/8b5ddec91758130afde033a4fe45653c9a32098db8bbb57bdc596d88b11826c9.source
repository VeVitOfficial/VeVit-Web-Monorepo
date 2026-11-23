"use client";

// Rozřezání obrázku na mřížku R×C dílků přes canvas + ZIP (JSZip lazy-load).
// Náhled s čárami mřížky přes overlay, každý dílek "cast-r{r}c{c}.png".
// Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, useToolState, fmtSize, loadScript, toastSuccess, ResultCard, ProgressBar } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX = 25 * 1024 * 1024;

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

declare global { interface Window { JSZip?: new () => { file: (n: string, b: Blob) => void; generateAsync: (o: { type: string }) => Promise<Blob> }; } }

const GRIDS = ["2x2", "3x3", "4x4", "2x3", "3x2", "custom"] as const;

function gridDims(grid: string, rows: number, cols: number): { r: number; c: number } {
  if (grid === "custom") return { r: Math.max(1, Math.min(10, rows)), c: Math.max(1, Math.min(10, cols)) };
  const [c, r] = grid.split("x").map(Number);
  return { r, c };
}

export default function ImageSplitter({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const zipUrlRef = useRef<string | null>(null);
  const fileUrlRef = useRef<string | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [grid, setGrid] = useState<string>("2x2");
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(3);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; count: number } | null>(null);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  useEffect(() => () => {
    if (zipUrlRef.current) URL.revokeObjectURL(zipUrlRef.current);
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
  }, []);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const f = Array.from(list)[0];
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); return; }
    setError("");
    if (result) { if (zipUrlRef.current) URL.revokeObjectURL(zipUrlRef.current); zipUrlRef.current = null; setResult(null); }
    const url = URL.createObjectURL(f);
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    fileUrlRef.current = url;
    setFileUrl(url);
    const img = new Image();
    img.onload = () => { imgRef.current = img; Promise.resolve().then(() => { setHasFile(true); setState("ready"); }); };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const { r: R, c: C } = gridDims(grid, rows, cols);

  const run = async () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    setError(""); setRunning(true); setState("processing");
    setProgress({ pct: 5, label: "Načítám JSZip…" });
    try {
      const ok = window.JSZip ? true : await loadScript("/tools/assets/js/lib/jszip.min.js").then(() => !!window.JSZip).catch(() => false);
      if (!ok || !window.JSZip) throw new Error("Knihovnu JSZip se nepodařilo načíst.");
      const zip = new window.JSZip();
      const W = img.naturalWidth, H = img.naturalHeight;
      let done = 0;
      const total = R * C;
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          // Přesné hranice dílků (funguje i pro rozměry nedělitelné počtem sloupců).
          const sx = Math.round((c * W) / C), ex = Math.round(((c + 1) * W) / C);
          const sy = Math.round((r * H) / R), ey = Math.round(((r + 1) * H) / R);
          const tile = document.createElement("canvas");
          tile.width = ex - sx; tile.height = ey - sy;
          tile.getContext("2d")!.drawImage(img, sx, sy, tile.width, tile.height, 0, 0, tile.width, tile.height);
          const blob: Blob | null = await new Promise((res) => tile.toBlob((b) => res(b), "image/png"));
          if (!blob) throw new Error("Dílek se nepodařilo vygenerovat.");
          zip.file(`cast-r${r + 1}c${c + 1}.png`, blob);
          done++;
          setProgress({ pct: 5 + Math.round((70 * done) / total), label: `Řežu dílek ${done}/${total}…` });
        }
      }
      setProgress({ pct: 80, label: "Balím ZIP…" });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      if (zipUrlRef.current) URL.revokeObjectURL(zipUrlRef.current);
      const url = URL.createObjectURL(zipBlob);
      zipUrlRef.current = url;
      setResult({ url, size: zipBlob.size, count: total });
      setProgress({ pct: 100, label: "Hotovo" });
      Promise.resolve().then(() => setProgress(null));
      setRunning(false);
      setState("success");
      toastSuccess(`Obrázek rozřezán na ${total} dílků`);
    } catch (e) {
      setProgress(null);
      setRunning(false);
      const m = e instanceof Error ? e.message : "Řezení selhalo.";
      setError(m); setState("error", m);
    }
  };

  const reset = () => {
    if (zipUrlRef.current) URL.revokeObjectURL(zipUrlRef.current);
    zipUrlRef.current = null;
    setResult(null); setError(""); setProgress(null);
    setState(imgRef.current ? "ready" : "idle");
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="sp-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 12h16"/><path d="M12 4v16"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="sp-work">
          {/* Náhled s čarami mřížky (overlay přes linear-gradient podle R×C). */}
          <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", marginBottom: "1rem" }} id="sp-preview">
            <img src={fileUrl} alt="" style={{ maxWidth: "100%", borderRadius: "0.5rem", display: "block" }} />
            <div aria-hidden="true" style={{
              position: "absolute", inset: 0, borderRadius: "0.5rem", pointerEvents: "none",
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.95) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.95) 1px, transparent 1px)`,
              backgroundSize: `${100 / C}% ${100 / R}%`,
              mixBlendMode: "difference",
            }} />
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="sp-grid">Mřížka</label>
              <select className="select" id="sp-grid" value={grid} onChange={(e) => setGrid(e.target.value)}>
                {GRIDS.map((g) => <option key={g} value={g}>{g === "custom" ? "Vlastní (sloupce × řádky)" : `${g.replace("x", "×")} (sloupce×řádky)`}</option>)}
              </select></div>
            {grid === "custom" ? (
              <>
                <div className="stack-sm"><label className="field-label" htmlFor="sp-rows">Řádky</label>
                  <input className="input" id="sp-rows" type="number" min={1} max={10} value={rows} onChange={(e) => setRows(+e.target.value || 1)} /></div>
                <div className="stack-sm"><label className="field-label" htmlFor="sp-cols">Sloupce</label>
                  <input className="input" id="sp-cols" type="number" min={1} max={10} value={cols} onChange={(e) => setCols(+e.target.value || 1)} /></div>
              </>
            ) : null}
            <button className="btn btn-primary" id="sp-run" type="button" disabled={running} onClick={run}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 12h16"/><path d="M12 4v16"/></svg> Rozřezat ({C} sloupce × {R} řádky = {R * C} dílků)
            </button>
          </div>
          {running && progress ? <ProgressBar value={progress.pct} label={progress.label} /> : null}
        </div>
      ) : null}

      {result ? (
        <ResultCard
          locale={locale}
          title={`Rozřezáno na ${result.count} dílků (ZIP)`}
          meta={`${R} řádků × ${C} sloupců · ${fmtSize(result.size)}`}
          downloadHref={result.url}
          downloadName="rozrezano.zip"
          onReset={reset}
        />
      ) : null}

      {error ? <p className="error-text" id="sp-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Řezení přes canvas, balení přes JSZip (lazy-load). Běží lokálně.</p>
    </div>
  );
}
