"use client";

// Interaktivní oříznutí obrázku v canvasu, čistě client-side.
// Port legacy image-crop.js. Renderuje pouze vnitřní tělo .tool-tool.
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

interface Sel { x: number; y: number; w: number; h: number; }

export default function ImageCrop({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const resultImgRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);
  const selRef = useRef<Sel | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [format, setFormat] = useState("image/png");
  const [error, setError] = useState("");
  const [canApply, setCanApply] = useState(false);
  const [coords, setCoords] = useState("Tažením myši/táhnutím nakreslete obdélník pro oříznutí.");
  const [fields, setFields] = useState({ x: "", y: "", w: "", h: "" });
  const [showResult, setShowResult] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d"), img = imgRef.current;
    if (!canvas || !ctx || !img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const sel = selRef.current;
    if (sel && sel.w && sel.h) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, sel.y);
      ctx.fillRect(0, sel.y + sel.h, canvas.width, canvas.height - sel.y - sel.h);
      ctx.fillRect(0, sel.y, sel.x, sel.h);
      ctx.fillRect(sel.x + sel.w, sel.y, canvas.width - sel.x - sel.w, sel.h);
      ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2;
      ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
    }
  }, []);

  const syncFields = useCallback(() => {
    const sel = selRef.current, scale = scaleRef.current;
    if (sel) {
      setFields({
        x: String(Math.round(sel.x * scale)),
        y: String(Math.round(sel.y * scale)),
        w: String(Math.round(sel.w * scale)),
        h: String(Math.round(sel.h * scale)),
      });
    } else {
      setFields({ x: "", y: "", w: "", h: "" });
    }
  }, []);

  const pos = (e: React.PointerEvent): { x: number; y: number } => {
    const cv = canvasRef.current!; const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  };

  const clampRect = (a: { x: number; y: number }, b: { x: number; y: number }): Sel => {
    const cv = canvasRef.current!;
    let x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    let w = Math.abs(a.x - b.x), h = Math.abs(a.y - b.y);
    const r = ratio;
    if (r > 0) { h = w / r; if (b.y < a.y) y = a.y - h; }
    if (x < 0) { w += x; x = 0; } if (y < 0) { h += y; y = 0; }
    if (x + w > cv.width) w = cv.width - x; if (y + h > cv.height) h = cv.height - y;
    return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const img = imgRef.current; if (!img || !img.naturalWidth) return;
    const cv = canvasRef.current!; cv.setPointerCapture(e.pointerId);
    dragRef.current = pos(e); selRef.current = { x: dragRef.current.x, y: dragRef.current.y, w: 0, h: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    selRef.current = clampRect(dragRef.current, pos(e));
    draw();
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const sel = selRef.current;
    if (sel && sel.w > 4 && sel.h > 4) {
      setCanApply(true);
      const scale = scaleRef.current;
      setCoords(`${Math.round(sel.w)}×${Math.round(sel.h)} px → ${Math.round(sel.w * scale)}×${Math.round(sel.h * scale)} px`);
      syncFields();
    } else {
      selRef.current = null; setCanApply(false); draw(); syncFields();
      setCoords(t("state_ready"));
    }
  };

  const syncFromFields = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const scale = scaleRef.current;
    const v = {
      x: Math.max(0, parseFloat(fields.x) || 0) / scale,
      y: Math.max(0, parseFloat(fields.y) || 0) / scale,
      w: Math.max(0, parseFloat(fields.w) || 0) / scale,
      h: Math.max(0, parseFloat(fields.h) || 0) / scale,
    };
    if (!v.w || !v.h) return;
    selRef.current = {
      x: Math.min(v.x, cv.width), y: Math.min(v.y, cv.height),
      w: Math.min(v.w, cv.width - v.x), h: Math.min(v.h, cv.height - v.y),
    };
    setCanApply(true); draw();
  }, [fields, draw]);

  const clear = () => {
    selRef.current = null; setCanApply(false); draw(); syncFields();
    setShowResult(false); setCoords(t("state_ready"));
  };

  const apply = () => {
    const sel = selRef.current, img = imgRef.current;
    if (!sel || !img || !img.naturalWidth) return;
    setCanApply(false);
    const scale = scaleRef.current;
    const sx = sel.x * scale, sy = sel.y * scale, sw = sel.w * scale, sh = sel.h * scale;
    const out = document.createElement("canvas"); out.width = Math.round(sw); out.height = Math.round(sh);
    const ox = out.getContext("2d")!;
    const fmt = format;
    if (fmt === "image/jpeg") { ox.fillStyle = "#fff"; ox.fillRect(0, 0, out.width, out.height); }
    ox.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
    out.toBlob((b) => {
      if (!b) { setCanApply(true); setError(t("state_error")); return; }
      const url = URL.createObjectURL(b);
      if (resultImgRef.current) resultImgRef.current.src = url;
      setShowResult(true);
      const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `image-crop.${EXT[fmt]}`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setCanApply(true);
    }, fmt, 0.92);
  };

  useEffect(() => { if (ratio > 0 && selRef.current && selRef.current.w) { selRef.current = clampRect({ x: selRef.current.x, y: selRef.current.y }, { x: selRef.current.x + selRef.current.w, y: selRef.current.y + selRef.current.h }); draw(); } /* eslint-disable-next-line */ }, [ratio]);
  useEffect(() => () => { /* img url revokováno při loadu */ }, []);

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
    img.onload = () => {
      imgRef.current = img;
      const maxW = 700, maxH = 480;
      const w = img.naturalWidth, h = img.naturalHeight;
      const s = Math.min(maxW / w, maxH / h, 1);
      const cv = canvasRef.current!;
      cv.width = Math.round(w * s); cv.height = Math.round(h * s);
      scaleRef.current = w / cv.width;
      selRef.current = null; setCanApply(false);
      Promise.resolve().then(() => setHasFile(true));
      draw(); syncFields(); setShowResult(false); setCoords(t("state_ready"));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError(t("load_failed")); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  return (
    <div className="stack" style={{ maxWidth: "50rem", margin: "0 auto" }}>
      <div className="dropzone" id="cr-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="cr-work">
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end", marginBottom: "0.75rem" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="cr-ratio">Poměr stran</label>
              <select className="select" id="cr-ratio" value={ratio} onChange={(e) => setRatio(+e.target.value)}>
                <option value={0}>Volný</option><option value={1}>1:1</option><option value={1.333}>4:3</option><option value={1.778}>16:9</option><option value={1.5}>3:2</option>
              </select></div>
            <button className="btn btn-ghost" id="cr-clear" type="button" onClick={clear}>Zrušit výběr</button>
          </div>
          <canvas ref={canvasRef} id="cr-canvas" style={{ maxWidth: "100%", touchAction: "none", borderRadius: "0.5rem", cursor: "crosshair", background: "#0001" }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} />
          <p className="muted" id="cr-coords" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>{coords}</p>
          <fieldset className="crop-fields"><legend className="sr-only">Tažením myši/táhnutím nakreslete obdélník pro oříznutí.</legend>
            <label><span>X</span><input className="input" id="cr-x" type="number" min={0} step={1} inputMode="numeric" value={fields.x} onChange={(e) => setFields((p) => ({ ...p, x: e.target.value }))} onBlur={syncFromFields} /></label>
            <label><span>Y</span><input className="input" id="cr-y" type="number" min={0} step={1} inputMode="numeric" value={fields.y} onChange={(e) => setFields((p) => ({ ...p, y: e.target.value }))} onBlur={syncFromFields} /></label>
            <label><span>W</span><input className="input" id="cr-w" type="number" min={0} step={1} inputMode="numeric" value={fields.w} onChange={(e) => setFields((p) => ({ ...p, w: e.target.value }))} onBlur={syncFromFields} /></label>
            <label><span>H</span><input className="input" id="cr-h" type="number" min={0} step={1} inputMode="numeric" value={fields.h} onChange={(e) => setFields((p) => ({ ...p, h: e.target.value }))} onBlur={syncFromFields} /></label>
          </fieldset>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem", alignItems: "end" }}>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>Formát:
              <select className="select" id="cr-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </select>
            </label>
            <button className="btn btn-primary btn-touch" id="cr-apply" type="button" disabled={!canApply} onClick={apply}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg> Oříznout a stáhnout
            </button>
          </div>
        </div>
      ) : null}

      {showResult ? (
        <div className="before-after" id="cr-result-preview"><div className="ba-pane"><span className="ba-label">Výsledek</span><div className="ba-frame"><img ref={resultImgRef} id="cr-result-image" alt="" /></div></div></div>
      ) : null}

      {error ? <p className="error-text" id="cr-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Ořez v prohlížeči přes canvas. Nic se neodesílá.</p>
    </div>
  );
}