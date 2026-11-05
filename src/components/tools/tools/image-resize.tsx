"use client";

// Změna velikosti obrázku přes canvas (imageSmoothingQuality "high"), čistě client-side.
// Režimy Px / Procenta, propojené šířka+výška se zachováním poměru stran.
// Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, useToolState, fmtSize } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX = 25 * 1024 * 1024;
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

export default function ImageResize({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [origSize, setOrigSize] = useState(0);
  const [mode, setMode] = useState<"px" | "pct">("px");
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [pct, setPct] = useState(100);
  const [keepAspect, setKeepAspect] = useState(true);
  const [format, setFormat] = useState("image/png");
  const [quality, setQuality] = useState(90);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [outSize, setOutSize] = useState(0);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  useEffect(() => () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }, []);

  // Cílové rozměry podle režimu.
  const target = useCallback(() => {
    if (mode === "pct") return { tw: Math.max(1, Math.round((origW * pct) / 100)), th: Math.max(1, Math.round((origH * pct) / 100)) };
    return { tw: Math.max(1, Math.round(w || 1)), th: Math.max(1, Math.round(h || 1)) };
  }, [mode, pct, origW, origH, w, h]);

  // Překreslení při změně parametrů (živý náhled jako v img-compress).
  useEffect(() => {
    if (!hasFile || !imgRef.current) return;
    const img = imgRef.current;
    const { tw, th } = target();
    const c = document.createElement("canvas");
    c.width = tw; c.height = th;
    const cx = c.getContext("2d");
    if (!cx) return;
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = "high";
    if (format === "image/jpeg") { cx.fillStyle = "#fff"; cx.fillRect(0, 0, tw, th); }
    cx.drawImage(img, 0, 0, tw, th);
    c.toBlob((b) => {
      if (!b) return;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(b);
      blobUrlRef.current = url;
      setPreviewUrl(url);
      setOutSize(b.size);
    }, format, format === "image/png" ? undefined : quality / 100);
  }, [hasFile, mode, w, h, pct, format, quality, target]);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const f = Array.from(list)[0];
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); return; }
    setError("");
    setOrigSize(f.size);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      URL.revokeObjectURL(url);
      setOrigW(img.naturalWidth);
      setOrigH(img.naturalHeight);
      setW(img.naturalWidth);
      setH(img.naturalHeight);
      setPct(100);
      Promise.resolve().then(() => { setHasFile(true); setState("ready"); });
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  // Propojené vstupy — změna jednoho rozměru přepočte druhý podle poměru stran.
  const onW = (v: number) => {
    const nv = Math.max(1, Math.round(v || 1));
    setW(nv);
    if (keepAspect && origW) setH(Math.max(1, Math.round((nv * origH) / origW)));
  };
  const onH = (v: number) => {
    const nv = Math.max(1, Math.round(v || 1));
    setH(nv);
    if (keepAspect && origH) setW(Math.max(1, Math.round((nv * origW) / origH)));
  };
  const onPct = (v: number) => {
    const nv = Math.max(1, Math.min(500, Math.round(v || 100)));
    setPct(nv);
    if (origW && origH) { setW(Math.max(1, Math.round((origW * nv) / 100))); setH(Math.max(1, Math.round((origH * nv) / 100))); }
  };

  const download = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `zmeneno.${EXT[format]}`;
    a.click();
  };

  const { tw, th } = target();

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="ir-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="ir-work" className="stack-sm">
          <p className="muted" id="ir-orig" style={{ fontSize: "0.85rem" }}>Původní rozměr: <strong>{origW}×{origH}</strong> px · {fmtSize(origSize)}</p>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="ir-mode">Jednotky</label>
              <select className="select" id="ir-mode" value={mode} onChange={(e) => setMode(e.target.value as "px" | "pct")}>
                <option value="px">Px</option>
                <option value="pct">Procenta</option>
              </select></div>
            {mode === "px" ? (
              <>
                <div className="stack-sm"><label className="field-label" htmlFor="ir-w">Šířka (px)</label>
                  <input className="input" id="ir-w" type="number" min={1} value={w} onChange={(e) => onW(+e.target.value)} /></div>
                <div className="stack-sm"><label className="field-label" htmlFor="ir-h">Výška (px)</label>
                  <input className="input" id="ir-h" type="number" min={1} value={h} onChange={(e) => onH(+e.target.value)} /></div>
                <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", paddingBottom: "0.5rem" }}>
                  <input type="checkbox" id="ir-aspect" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} /> Zachovat poměr stran
                </label>
              </>
            ) : (
              <div className="stack-sm"><label className="field-label" htmlFor="ir-pct">Velikost: <span id="ir-pct-v">{pct}</span> % (100 % = původní)</label>
                <input type="range" id="ir-pct" min={1} max={500} value={pct} style={{ width: "14rem" }} onChange={(e) => onPct(+e.target.value)} /></div>
            )}
            <div className="stack-sm"><label className="field-label" htmlFor="ir-format">Formát</label>
              <select className="select" id="ir-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
              </select></div>
            {format !== "image/png" ? (
              <div className="stack-sm"><label className="field-label" htmlFor="ir-q">Kvalita: <span id="ir-q-v">{quality}</span> %</label>
                <input type="range" id="ir-q" min={10} max={100} value={quality} style={{ width: "10rem" }} onChange={(e) => setQuality(+e.target.value)} /></div>
            ) : null}
          </div>
          <img id="ir-preview" src={previewUrl} alt="Náhled výsledku" style={{ maxWidth: "100%", maxHeight: "20rem", borderRadius: "0.5rem", border: "1px solid rgba(128,128,128,0.25)" }} />
          <p className="muted" id="ir-info" style={{ fontSize: "0.85rem" }}>Výsledek: {tw}×{th} px · {fmtSize(outSize)}</p>
          <div>
            <button className="btn btn-primary" id="ir-dl" type="button" disabled={!previewUrl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout zmeneno.{EXT[format]}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="ir-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Převzorkování přes canvas (vysoce kvalitní), běží lokálně.</p>
    </div>
  );
}
