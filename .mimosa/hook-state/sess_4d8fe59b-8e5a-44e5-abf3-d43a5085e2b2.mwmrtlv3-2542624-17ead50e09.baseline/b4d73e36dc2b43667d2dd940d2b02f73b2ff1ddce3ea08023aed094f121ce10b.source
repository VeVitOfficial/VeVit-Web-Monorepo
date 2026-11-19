"use client";

// Filtry obrázku přes canvas (ctx.filter), čistě client-side.
// Port legacy image-filters.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];
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

const DEFAULTS = { b: 100, c: 100, s: 100, h: 0, bl: 0, i: 0 };

export default function ImageFilters({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [vals, setVals] = useState({ ...DEFAULTS });
  const [toggles, setToggles] = useState({ grayscale: false, sepia: false });
  const [format, setFormat] = useState("image/png");
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  const filterStr = useCallback(() => {
    const parts = [
      `brightness(${vals.b}%)`, `contrast(${vals.c}%)`, `saturate(${vals.s}%)`,
      `hue-rotate(${vals.h}deg)`, `blur(${vals.bl}px)`, `invert(${vals.i}%)`,
    ];
    if (toggles.grayscale) parts.push("grayscale(100%)");
    if (toggles.sepia) parts.push("sepia(100%)");
    return parts.join(" ");
  }, [vals, toggles]);

  const render = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    if (!canvasRef.current) {
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      canvasRef.current = c; ctxRef.current = c.getContext("2d");
    }
    const canvas = canvasRef.current!, ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = filterStr();
    ctx.drawImage(img, 0, 0);
    ctx.filter = "none";
    if (previewRef.current) previewRef.current.src = canvas.toDataURL("image/png");
    setCanDl(true);
  }, [filterStr]);

  useEffect(() => { if (hasFile) render(); }, [vals, toggles, hasFile, render]);
  useEffect(() => () => { /* offscreen canvas */ }, []);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const arr = Array.from(list).slice(0, 1);
    const ok: File[] = [];
    for (const f of arr) {
      if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); continue; }
      if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); continue; }
      ok.push(f);
    }
    if (!ok.length) return;
    setError("");
    canvasRef.current = null;
    const url = URL.createObjectURL(ok[0]);
    const img = new Image();
    img.onload = () => { imgRef.current = img; URL.revokeObjectURL(url); Promise.resolve().then(() => setHasFile(true)); render(); };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const setVal = (k: keyof typeof vals, v: number) => setVals((p) => ({ ...p, [k]: v }));
  const reset = () => { setVals({ ...DEFAULTS }); setToggles({ grayscale: false, sepia: false }); };
  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `obrazek-filtr.${EXT[format]}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, format, 0.92);
  };

  const slider = (id: string, label: string, k: keyof typeof vals, min: number, max: number, suffix?: string) => (
    <div className="stack-sm" key={id}>
      <label className="field-label" htmlFor={id}>{label}: <span id={`${id}-v`}>{vals[k]}</span>{suffix}</label>
      <input type="range" id={id} min={min} max={max} value={vals[k]} style={{ width: "100%" }} onChange={(e) => setVal(k, +e.target.value)} />
    </div>
  );

  return (
    <div className="stack" style={{ maxWidth: "50rem", margin: "0 auto" }}>
      <div className="dropzone" id="if-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="if-work">
          <img ref={previewRef} id="if-preview" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} alt="" />
          <div className="two-col" style={{ gap: "1rem" }}>
            <div className="stack-sm">
              {slider("if-b", "Jas", "b", 0, 200, " %")}
              {slider("if-c", "Kontrast", "c", 0, 200, " %")}
              {slider("if-s", "Saturace", "s", 0, 200, " %")}
            </div>
            <div className="stack-sm">
              {slider("if-h", "Odstín", "h", 0, 360, "°")}
              {slider("if-bl", "Rozostření", "bl", 0, 20, " px")}
              {slider("if-i", "Invert", "i", 0, 100, " %")}
            </div>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className={`btn ${toggles.grayscale ? "btn-primary" : "btn-ghost"}`} type="button" onClick={() => setToggles((p) => ({ ...p, grayscale: !p.grayscale }))}>Odstíny šedi</button>
            <button className={`btn ${toggles.sepia ? "btn-primary" : "btn-ghost"}`} type="button" onClick={() => setToggles((p) => ({ ...p, sepia: !p.sepia }))}>Sepia</button>
            <button className="btn btn-ghost" type="button" id="if-reset" onClick={reset}>Reset</button>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem", alignItems: "end" }}>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>Formát:
              <select className="select" id="if-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </select>
            </label>
            <button className="btn btn-primary" id="if-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="if-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Filtry přes canvas (ctx.filter). Běží lokálně, živý náhled.</p>
    </div>
  );
}