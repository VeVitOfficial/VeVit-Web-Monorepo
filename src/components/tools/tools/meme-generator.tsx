"use client";

// Meme generátor (Impact text), čistě client-side.
// Port legacy meme-generator.js. Renderuje pouze vnitřní tělo .tool-tool.
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

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(" "); const lines: string[] = []; let cur = "";
  words.forEach((w) => {
    const test = cur ? cur + " " + w : w;
    if (test.length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = test;
  });
  if (cur) lines.push(cur);
  return lines;
}

export default function MemeGenerator({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [size, setSize] = useState(7);
  const [format, setFormat] = useState("image/png");
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  const drawText = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string, align: "top" | "bottom") => {
    if (!text) return;
    const fs = Math.round(canvas.width * size / 100);
    ctx.font = `bold ${fs}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = Math.max(2, fs / 12);
    ctx.strokeStyle = "#000"; ctx.fillStyle = "#fff";
    const maxChars = Math.max(8, Math.round(canvas.width / (fs * 0.55)));
    const lines = wrap(text.toUpperCase(), maxChars);
    const lh = fs * 1.05, pad = fs * 0.3;
    const startY = align === "top" ? pad + fs : canvas.height - pad - (lines.length - 1) * lh;
    lines.forEach((ln, i) => { const y = startY + i * lh; ctx.strokeText(ln, canvas.width / 2, y); ctx.fillText(ln, canvas.width / 2, y); });
  }, [size]);

  const draw = useCallback(() => {
    const img = imgRef.current, canvas = canvasRef.current;
    if (!img || !img.naturalWidth || !canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    drawText(ctx, canvas, top, "top");
    drawText(ctx, canvas, bottom, "bottom");
    setCanDl(true);
  }, [top, bottom, drawText]);

  useEffect(() => { if (hasFile) draw(); }, [top, bottom, size, hasFile, draw]);
  useEffect(() => () => { /* canvas je viditelný, nic k revokaci */ }, []);

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
    const url = URL.createObjectURL(ok[0]);
    const img = new Image();
    img.onload = () => { imgRef.current = img; URL.revokeObjectURL(url); Promise.resolve().then(() => setHasFile(true)); draw(); };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };
  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `meme.${EXT[format]}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, format, 0.92);
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="mm-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek pro meme"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg></span>
        <span className="dz-title">Přetáhněte obrázek pro meme</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="mm-work">
          <div className="stack-sm"><label className="field-label" htmlFor="mm-top">Horní text</label>
            <input className="input" id="mm-top" type="text" placeholder="ONE DOES NOT SIMPLY…" value={top} onChange={(e) => setTop(e.target.value)} /></div>
          <div className="stack-sm"><label className="field-label" htmlFor="mm-bottom">Dolní text</label>
            <input className="input" id="mm-bottom" type="text" placeholder="…VYTVOŘIT MEME V PROHLÍŽEČI" value={bottom} onChange={(e) => setBottom(e.target.value)} /></div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="mm-size">Velikost textu (% šířky)</label><input type="range" id="mm-size" min={3} max={15} value={size} style={{ width: "12rem" }} onChange={(e) => setSize(+e.target.value)} /></div>
            <div className="stack-sm"><label className="field-label" htmlFor="mm-format">Formát</label>
              <select className="select" id="mm-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </select></div>
          </div>
          <canvas ref={canvasRef} id="mm-canvas" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem" }} />
          <button className="btn btn-primary" id="mm-dl" type="button" disabled={!canDl} style={{ marginTop: "0.75rem" }} onClick={download}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout meme
          </button>
        </div>
      ) : null}

      {error ? <p className="error-text" id="mm-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Klasický meme styl (Impact, bílý text s černým obrysem). Běží lokálně.</p>
    </div>
  );
}