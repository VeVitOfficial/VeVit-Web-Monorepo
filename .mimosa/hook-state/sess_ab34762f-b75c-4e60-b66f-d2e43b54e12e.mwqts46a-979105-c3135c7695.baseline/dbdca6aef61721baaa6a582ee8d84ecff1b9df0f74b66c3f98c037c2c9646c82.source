"use client";

// Vodoznak (text/logo) přes canvas, čistě client-side.
// Port legacy image-watermark.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX = 25 * 1024 * 1024;
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const POS_OX: Record<string, (w: number, pad: number) => number> = { l: (_w, p) => p, c: (w) => w / 2, r: (w, p) => w - p };
const POS_OY: Record<string, (h: number, pad: number) => number> = { t: (_h, p) => p, c: (h) => h / 2, b: (h, p) => h - p };

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

export default function ImageWatermark({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [mode, setMode] = useState<"text" | "logo">("text");
  const [text, setText] = useState("© 2026");
  const [sizePct, setSizePct] = useState(20);
  const [opacity, setOpacity] = useState(60);
  const [color, setColor] = useState("#ffffff");
  const [pos, setPos] = useState("mr");
  const [format, setFormat] = useState("image/png");
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  const draw = useCallback(() => {
    const img = imgRef.current, canvas = canvasRef.current;
    if (!img || !img.naturalWidth || !canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const pad = Math.round(canvas.width * 0.02);
    const ox = POS_OX[pos[1]](canvas.width, pad);
    const oy = POS_OY[pos[0]](canvas.height, pad);
    ctx.globalAlpha = opacity / 100;
    if (mode === "text") {
      const fs = Math.round(canvas.width * sizePct / 100 * 0.4);
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = ({ l: "left", c: "center", r: "right" } as const)[pos[1] as "l" | "c" | "r"];
      ctx.textBaseline = ({ t: "top", c: "middle", b: "bottom" } as const)[pos[0] as "t" | "c" | "b"];
      ctx.fillText(text, ox, oy);
    } else if (logoRef.current) {
      const logo = logoRef.current;
      const lw = canvas.width * sizePct / 100;
      const lh = logo.naturalHeight * (lw / logo.naturalWidth);
      const x = ({ l: pad, c: canvas.width / 2 - lw / 2, r: canvas.width - pad - lw } as const)[pos[1] as "l" | "c" | "r"];
      const y = ({ t: pad, c: canvas.height / 2 - lh / 2, b: canvas.height - pad - lh } as const)[pos[0] as "t" | "c" | "b"];
      ctx.drawImage(logo, x, y, lw, lh);
    }
    ctx.globalAlpha = 1;
    setCanDl(true);
  }, [mode, text, sizePct, opacity, color, pos]);

  useEffect(() => { if (hasFile) draw(); }, [mode, text, sizePct, opacity, color, pos, hasFile, draw]);
  useEffect(() => () => { /* offscreen logo url cleanup probíhá v pick */ }, []);

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

  const pickLogo = (list: FileList | null) => {
    if (!list || !list.length) return;
    const f = Array.from(list)[0];
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    setError("");
    const url = URL.createObjectURL(f);
    const logo = new Image();
    logo.onload = () => { logoRef.current = logo; URL.revokeObjectURL(url); draw(); };
    logo.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };
  const onLogoDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pickLogo(e.dataTransfer.files); };

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `vodoznak.${EXT[format]}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, format, 0.92);
  };

  const positions = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"] as const;
  const posLabel: Record<string, string> = { tl: "↖", tc: "↑", tr: "↗", ml: "←", mc: "•", mr: "→", bl: "↙", bc: "↓", br: "↘" };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="wm-drop" tabIndex={0} role="button" aria-label="Přetáhněte cílový obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte cílový obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="wm-work">
          <div className="seg" id="wm-mode" role="tablist" aria-label="Typ vodoznaku">
            <button type="button" className={mode === "text" ? "active" : ""} data-mode="text" role="tab" aria-selected={mode === "text"} onClick={() => setMode("text")}>Text</button>
            <button type="button" className={mode === "logo" ? "active" : ""} data-mode="logo" role="tab" aria-selected={mode === "logo"} onClick={() => setMode("logo")}>Obrázek (logo)</button>
          </div>
          {mode === "text" ? (
            <div id="wm-text-grp" className="stack-sm">
              <label className="field-label" htmlFor="wm-text">Text vodoznaku</label>
              <input className="input" id="wm-text" type="text" value={text} placeholder="Vodoznak…" onChange={(e) => setText(e.target.value)} />
            </div>
          ) : (
            <div id="wm-logo-grp" className={mode === "logo" ? "" : "hidden"}>
              <div className="dropzone" id="wm-logo-drop" style={{ padding: "0.75rem" }} tabIndex={0} role="button" aria-label="Přetáhněte logo (PNG s průhledností doporučeno)"
                onClick={() => logoInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); logoInputRef.current?.click(); } }}
                onDrop={onLogoDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
                <span className="dz-title" style={{ fontSize: "0.9rem" }}>Přetáhněte logo (PNG s průhledností doporučeno)</span>
                <input ref={logoInputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pickLogo(e.target.files); e.target.value = ""; }} aria-hidden="true" />
              </div>
            </div>
          )}
          <div className="two-col" style={{ gap: "1rem", marginTop: "0.75rem" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="wm-size">Velikost (% šířky)</label><input type="range" id="wm-size" min={5} max={60} value={sizePct} style={{ width: "100%" }} onChange={(e) => setSizePct(+e.target.value)} /></div>
            <div className="stack-sm"><label className="field-label" htmlFor="wm-op">Průhlednost: <span id="wm-op-v">{opacity}</span> %</label><input type="range" id="wm-op" min={10} max={100} value={opacity} style={{ width: "100%" }} onChange={(e) => setOpacity(+e.target.value)} /></div>
          </div>
          {mode === "text" ? (
            <div id="wm-color-grp" className="stack-sm"><label className="field-label" htmlFor="wm-color">Barva textu</label><input type="color" id="wm-color" value={color} style={{ width: "4rem", height: "2rem" }} onChange={(e) => setColor(e.target.value)} /></div>
          ) : null}
          <div className="stack-sm">
            <span className="field-label">Pozice</span>
            <div className="row" style={{ flexWrap: "wrap", gap: "0.4rem" }} id="wm-pos">
              {positions.map((p) => (
                <button key={p} className={`btn btn-ghost${pos === p ? " active" : ""}`} type="button" data-pos={p} onClick={() => setPos(p)}>{posLabel[p]}</button>
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} id="wm-canvas" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem" }} />
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem", alignItems: "end" }}>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>Formát:
              <select className="select" id="wm-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </select>
            </label>
            <button className="btn btn-primary" id="wm-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="wm-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Vodoznak přes canvas, živý náhled. Běží lokálně.</p>
    </div>
  );
}