"use client";

// Převod formátu obrázku přes canvas (PNG/JPEG/WebP/BMP), čistě client-side.
// Port legacy image-convert.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];
const MAX = 25 * 1024 * 1024;

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

// 24bit BMP encoder (bottom-up, row padding na 4 bajty) — port legacy bmpEncode.
function bmpEncode(canvas: HTMLCanvasElement): Blob {
  const cx = canvas.getContext("2d")!;
  const w = canvas.width, h = canvas.height;
  const data = cx.getImageData(0, 0, w, h).data;
  const rowBytes = Math.floor((24 * w + 31) / 32) * 4;
  const size = 54 + rowBytes * h;
  const buf = new ArrayBuffer(size);
  const v = new DataView(buf);
  v.setUint8(0, 66); v.setUint8(1, 77); v.setUint32(2, size, true); v.setUint32(10, 54, true);
  v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, h, true);
  v.setUint16(26, 1, true); v.setUint16(28, 24, true); v.setUint32(34, rowBytes * h, true);
  v.setInt32(38, 2835, true); v.setInt32(42, 2835, true);
  for (let y = 0; y < h; y++) {
    const sy = h - 1 - y, off = 54 + y * rowBytes;
    for (let x = 0; x < w; x++) {
      const s = (sy * w + x) * 4;
      v.setUint8(off + x * 3, data[s + 2]); v.setUint8(off + x * 3 + 1, data[s + 1]); v.setUint8(off + x * 3 + 2, data[s]);
    }
  }
  return new Blob([buf], { type: "image/bmp" });
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/bmp": "bmp" };

export default function ImageConvert({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const srcImgRef = useRef<HTMLImageElement | null>(null);
  const dstImgRef = useRef<HTMLImageElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [format, setFormat] = useState("image/png");
  const [quality, setQuality] = useState(90);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [outExt, setOutExt] = useState("png");
  const blobUrlRef = useRef<string | null>(null);
  const srcUrlRef = useRef<string | null>(null);

  const lossy = format === "image/jpeg" || format === "image/webp";

  const convert = useCallback(() => {
    setError("");
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const fmt = format;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const cx = c.getContext("2d");
    if (!cx) return;
    if (fmt === "image/jpeg" || fmt === "image/bmp") { cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height); }
    cx.drawImage(img, 0, 0);
    const ext = EXT[fmt];
    setOutExt(ext);
    if (fmt === "image/bmp") {
      const b = bmpEncode(c);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(b);
      blobUrlRef.current = url;
      setBlob(b);
      if (dstImgRef.current) dstImgRef.current.src = url;
      setInfo(`Výstup: .${ext}, ${fmtSize(b.size)}`);
    } else {
      c.toBlob((b) => {
        if (!b) return;
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(b);
        blobUrlRef.current = url;
        setBlob(b);
        if (dstImgRef.current) dstImgRef.current.src = url;
        setInfo(`Výstup: .${ext}, ${fmtSize(b.size)}`);
      }, fmt, quality / 100);
    }
  }, [format, quality]);

  useEffect(() => { if (hasFile) Promise.resolve().then(() => convert()); }, [format, quality, hasFile, convert]);
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

  const download = () => { if (blob) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `obrazek.${outExt}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="ic-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="ic-work">
          <div className="two-col" style={{ gap: "1rem", alignItems: "start" }}>
            <div className="stack-sm"><span className="field-label">Vstup</span><img ref={srcImgRef} id="ic-src" style={{ maxWidth: "100%", borderRadius: "0.5rem", background: "#0001" }} alt="" /></div>
            <div className="stack-sm"><span className="field-label">Výstup</span><img ref={dstImgRef} id="ic-dst" style={{ maxWidth: "100%", borderRadius: "0.5rem", background: "#0001" }} alt="" /></div>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end", marginTop: "1rem" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="ic-format">Formát</label>
              <select className="select" id="ic-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/bmp">BMP</option>
              </select></div>
            <div className="stack-sm" id="ic-q-wrap" style={{ display: lossy ? "" : "none" }}><label className="field-label" htmlFor="ic-q">Kvalita: <span id="ic-q-v">{quality}</span> %</label>
              <input type="range" id="ic-q" min={10} max={100} value={quality} style={{ width: "12rem" }} onChange={(e) => setQuality(+e.target.value)} /></div>
            <button className="btn btn-primary" id="ic-conv" type="button" onClick={convert}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg> Převést
            </button>
            <button className="btn btn-secondary" id="ic-dl" type="button" disabled={!blob} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout
            </button>
          </div>
          <p id="ic-info" className="muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>{info}</p>
        </div>
      ) : null}

      {error ? <p className="error-text" id="ic-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Převod přes canvas, běží lokálně. JPEG a BMP nemají průhlednost (alfa kanál se ztratí).</p>
    </div>
  );
}