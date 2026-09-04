"use client";

// Otočení/překlopení obrázku přes canvas, čistě client-side.
// Port legacy image-rotate-flip.js. Renderuje pouze vnitřní tělo .tool-tool.
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

type Op = "rot90" | "rot180" | "rot270" | "fliph" | "flipv";

export default function ImageRotateFlip({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [format, setFormat] = useState("image/png");
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);
  const outExtRef = useRef("png");

  const ensureCanvas = useCallback((w: number, h: number) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    canvasRef.current = c; ctxRef.current = c.getContext("2d");
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const fmt = format;
    outExtRef.current = EXT[fmt];
    if (fmt === "image/jpeg") {
      const tmp = document.createElement("canvas"); tmp.width = canvas.width; tmp.height = canvas.height;
      const tx = tmp.getContext("2d")!;
      tx.fillStyle = "#fff"; tx.fillRect(0, 0, tmp.width, tmp.height); tx.drawImage(canvas, 0, 0);
      if (previewRef.current) previewRef.current.src = tmp.toDataURL(fmt, 0.92);
    } else if (previewRef.current) {
      previewRef.current.src = canvas.toDataURL(fmt);
    }
    setCanDl(true);
  }, [format]);

  const apply = useCallback((op: Op) => {
    const canvas = canvasRef.current, ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const tmp = document.createElement("canvas");
    const w = canvas.width, h = canvas.height;
    if (op === "rot90" || op === "rot270") { tmp.width = h; tmp.height = w; }
    else { tmp.width = w; tmp.height = h; }
    const tx = tmp.getContext("2d")!;
    if (op === "rot90") { tx.translate(h, 0); tx.rotate(Math.PI / 2); }
    else if (op === "rot270") { tx.translate(0, w); tx.rotate(-Math.PI / 2); }
    else if (op === "rot180") { tx.translate(w, h); tx.rotate(Math.PI); }
    else if (op === "fliph") { tx.translate(w, 0); tx.scale(-1, 1); }
    else if (op === "flipv") { tx.translate(0, h); tx.scale(1, -1); }
    tx.drawImage(canvas, 0, 0);
    ensureCanvas(tmp.width, tmp.height);
    ctxRef.current!.drawImage(tmp, 0, 0);
    redraw();
  }, [ensureCanvas, redraw]);

  useEffect(() => { if (hasFile) redraw(); }, [format, hasFile, redraw]);
  useEffect(() => () => { /* canvas je offscreen, nic k revokaci */ }, []);

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
      ensureCanvas(img.naturalWidth, img.naturalHeight);
      ctxRef.current!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      Promise.resolve().then(() => setHasFile(true));
      redraw();
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };
  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const fmt = format;
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `obrazek.${outExtRef.current}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, fmt, 0.92);
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="rf-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="rf-work">
          <img ref={previewRef} id="rf-preview" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} alt="" />
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <button className="btn btn-secondary" type="button" onClick={() => apply("rot90")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg> Otočit 90°
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => apply("rot180")}>Otočit 180°</button>
            <button className="btn btn-secondary" type="button" onClick={() => apply("rot270")}>Otočit 270°</button>
            <button className="btn btn-ghost" type="button" onClick={() => apply("fliph")}>Překlopit vodorovně</button>
            <button className="btn btn-ghost" type="button" onClick={() => apply("flipv")}>Překlopit svisle</button>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
            <button className="btn btn-primary" id="rf-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout
            </button>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>Formát:
              <select className="select" id="rf-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="rf-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Operace se aplikují kumulativně. Vše běží lokálně přes canvas.</p>
    </div>
  );
}