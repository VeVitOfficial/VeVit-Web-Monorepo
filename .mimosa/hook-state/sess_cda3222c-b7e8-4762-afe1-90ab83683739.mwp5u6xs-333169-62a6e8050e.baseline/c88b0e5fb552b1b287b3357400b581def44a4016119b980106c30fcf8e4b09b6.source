"use client";

// Zvětšení obrázku přes canvas (bicubic/smooth), čistě client-side.
// Port legacy img-upscaler.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize } from "@/components/tools/tool-runtime";

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

export default function ImgUpscaler({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const srcImgRef = useRef<HTMLImageElement | null>(null);
  const dstImgRef = useRef<HTMLImageElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState("image/png");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [outExt, setOutExt] = useState("png");
  const blobUrlRef = useRef<string | null>(null);
  const srcUrlRef = useRef<string | null>(null);

  const upscale = useCallback(() => {
    setError("");
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const s = scale, w = img.naturalWidth * s, h = img.naturalHeight * s;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const cx = c.getContext("2d");
    if (!cx) return;
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
    const fmt = format;
    if (fmt === "image/jpeg") { cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); }
    cx.drawImage(img, 0, 0, w, h);
    const ext = EXT[fmt];
    setOutExt(ext);
    c.toBlob((b) => {
      if (!b) return;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(b);
      blobUrlRef.current = url;
      setBlob(b);
      if (dstImgRef.current) dstImgRef.current.src = url;
      setInfo(`${img.naturalWidth}×${img.naturalHeight} → ${w}×${h} px`);
    }, fmt, 0.92);
  }, [scale, format]);

  useEffect(() => { if (hasFile) Promise.resolve().then(() => upscale()); }, [scale, format, hasFile, upscale]);
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
    if (srcUrlRef.current) URL.revokeObjectURL(srcUrlRef.current);
    const url = URL.createObjectURL(f);
    srcUrlRef.current = url;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      if (srcImgRef.current) srcImgRef.current.src = url;
      Promise.resolve().then(() => setHasFile(true));
    };
    img.onerror = () => setError("Obrázek se nepodařilo načíst.");
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };
  const download = () => { if (blob) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `zvetseno.${outExt}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="up-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="up-work">
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="up-scale">Měřítko</label>
              <select className="select" id="up-scale" value={scale} onChange={(e) => setScale(+e.target.value)}>
                <option value={2}>2×</option><option value={3}>3×</option><option value={4}>4×</option>
              </select></div>
            <div className="stack-sm"><label className="field-label" htmlFor="up-format">Formát</label>
              <select className="select" id="up-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </select></div>
            <button className="btn btn-primary" id="up-run" type="button" onClick={upscale}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg> Zvětšit
            </button>
          </div>
          <div className="two-col" style={{ gap: "1rem", marginTop: "1rem", alignItems: "start" }}>
            <div className="stack-sm"><span className="field-label">Původní</span><img ref={srcImgRef} id="up-src" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} alt="" /></div>
            <div className="stack-sm"><span className="field-label">Výsledek</span><img ref={dstImgRef} id="up-dst" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} alt="" /></div>
          </div>
          <p id="up-info" className="muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{info}</p>
          <button className="btn btn-secondary" id="up-dl" type="button" disabled={!blob} style={{ marginTop: "0.5rem" }} onClick={download}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout
          </button>
        </div>
      ) : null}

      {error ? <p className="error-text" id="up-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Zvětšení přes canvas (vysoká kvalita vyhlazování). AI super-resolution režim bude přidán později. Běží lokálně.</p>
    </div>
  );
}