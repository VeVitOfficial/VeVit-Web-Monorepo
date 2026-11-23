"use client";

// Komprese obrázku přes canvas, čistě client-side. Port legacy img-compress.js.
// Renderuje pouze vnitřní tělo .tool-tool (obsah .stack) — shell dodává stránka.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize } from "@/components/tools/tool-runtime";

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

export default function ImgCompress({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const srcImgRef = useRef<HTMLImageElement | null>(null);
  const dstImgRef = useRef<HTMLImageElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [origSize, setOrigSize] = useState(0);
  const [format, setFormat] = useState("image/jpeg");
  const [quality, setQuality] = useState(75);
  const [maxDim, setMaxDim] = useState(0);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [outExt, setOutExt] = useState("jpg");
  const blobUrlRef = useRef<string | null>(null);
  const srcUrlRef = useRef<string | null>(null);

  const fail = useCallback((m: string) => setError(m), []);

  const compress = useCallback(() => {
    setError("");
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const fmt = format;
    const md = maxDim || 0;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (md > 0 && (w > md || h > md)) { const s = md / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const cx = c.getContext("2d");
    if (!cx) return;
    if (fmt === "image/jpeg") { cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); }
    cx.drawImage(img, 0, 0, w, h);
    const ext = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const)[fmt as "image/png" | "image/jpeg" | "image/webp"];
    setOutExt(ext);
    c.toBlob((b) => {
      if (!b) return;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(b);
      blobUrlRef.current = url;
      setBlob(b);
      if (dstImgRef.current) dstImgRef.current.src = url;
      const pct = origSize ? Math.round((1 - b.size / origSize) * 100) : 0;
      setInfo(`Původní: ${fmtSize(origSize)} → výsledek: ${fmtSize(b.size)} (–${Math.max(0, pct)} %)`);
    }, fmt, fmt === "image/png" ? undefined : quality / 100);
  }, [format, maxDim, quality, origSize]);

  // Překreslení při změně parametrů (jako legacy change+input listeners).
  useEffect(() => {
    if (hasFile) Promise.resolve().then(() => compress());
  }, [format, maxDim, quality, hasFile, compress]);

  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    if (srcUrlRef.current) URL.revokeObjectURL(srcUrlRef.current);
  }, []);

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
    const f = ok[0];
    setError("");
    setOrigSize(f.size);
    if (srcUrlRef.current) URL.revokeObjectURL(srcUrlRef.current);
    const url = URL.createObjectURL(f);
    srcUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      if (srcImgRef.current) srcImgRef.current.src = url;
      Promise.resolve().then(() => setHasFile(true));
    };
    img.onerror = () => fail("Obrázek se nepodařilo načíst.");
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    (e.currentTarget as HTMLElement).classList.remove("dragover");
    pick(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const download = () => { if (blob) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `komprimovano.${outExt}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div
        className="dropzone"
        id="co-drop"
        tabIndex={0}
        role="button"
        aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
      >
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="co-work">
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="co-format">Formát</label>
              <select className="select" id="co-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/jpeg">JPEG</option>
                <option value="image/webp">WebP</option>
                <option value="image/png">PNG (bezztrátové)</option>
              </select></div>
            <div className="stack-sm"><label className="field-label" htmlFor="co-q">Kvalita: <span id="co-q-v">{quality}</span> %</label>
              <input type="range" id="co-q" min={10} max={100} value={quality} style={{ width: "12rem" }} onChange={(e) => setQuality(+e.target.value)} /></div>
            <div className="stack-sm"><label className="field-label" htmlFor="co-max">Max. rozměr (px, 0 = beze změny)</label>
              <input className="input" id="co-max" type="number" value={maxDim} min={0} onChange={(e) => setMaxDim(+e.target.value || 0)} /></div>
          </div>
          <button className="btn btn-primary" id="co-run" type="button" style={{ marginTop: "1rem" }} onClick={compress}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Komprimovat
          </button>
          <div className="two-col" style={{ gap: "1rem", marginTop: "1rem", alignItems: "start" }}>
            <div className="stack-sm"><span className="field-label">Původní</span><img ref={srcImgRef} id="co-src" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} alt="" /></div>
            <div className="stack-sm"><span className="field-label">Výsledek</span><img ref={dstImgRef} id="co-dst" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} alt="" /></div>
          </div>
          <p id="co-info" className="muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{info}</p>
          <button className="btn btn-secondary" id="co-dl" type="button" disabled={!blob} style={{ marginTop: "0.5rem" }} onClick={download}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout
          </button>
        </div>
      ) : null}

      {error ? <p className="error-text" id="co-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Komprese přes canvas, běží lokálně. JPEG ztratí průhlednost.</p>
    </div>
  );
}
