"use client";

// Rámeček kolem obrázku přes canvas — plný nebo zaoblený (clip + stroke,
// roundRect s fallbackem na obyčejný obdélník), kreslení uvnitř nebo zvětšení
// plátna o rámeček ven. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, useToolState, fmtSize } from "@/components/tools/tool-runtime";

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

/** Cesta zaobleného obdélníku (arcTo) — nezávislé na novějším ctx.roundRect. */
function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Složí výstupní canvas s rámečkem podle parametrů (sdílené pro náhled i download). */
function compose(img: HTMLImageElement, bw: number, color: string, style: "plny" | "zaobleny", mode: "uvnitr" | "mimo"): HTMLCanvasElement | null {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const out = document.createElement("canvas");
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  if (mode === "mimo") {
    // Plátno zvětšené o šířku rámečku, rámeček kolem dokola.
    out.width = iw + bw * 2; out.height = ih + bw * 2;
    if (style === "zaobleny" && typeof ctx.roundRect === "function") {
      ctx.save();
      roundedRectPath(ctx, 0, 0, out.width, out.height, bw * 1.5);
      ctx.clip();
      ctx.fillStyle = color; ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(img, bw, bw);
      ctx.restore();
    } else {
      ctx.fillStyle = color; ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(img, bw, bw);
    }
  } else if (style === "zaobleny" && typeof ctx.roundRect === "function") {
    // Rámeček nad hranami — obrázek oříznutý do zaoblení + vykreslený stroke.
    out.width = iw; out.height = ih;
    ctx.save();
    roundedRectPath(ctx, bw / 2, bw / 2, iw - bw, ih - bw, bw * 1.5);
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    ctx.strokeStyle = color; ctx.lineWidth = bw;
    roundedRectPath(ctx, bw / 2, bw / 2, iw - bw, ih - bw, bw * 1.5);
    ctx.stroke();
  } else {
    // Plný rámeček nad hranami (stroke přes střed čáry = polovina dovnitř).
    out.width = iw; out.height = ih;
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = color; ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, iw - bw, ih - bw);
  }
  return out;
}

export default function ImageBorder({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [bw, setBw] = useState(12);
  const [color, setColor] = useState("#10b981");
  const [style, setStyle] = useState<"plny" | "zaobleny">("plny");
  const [mode, setMode] = useState<"uvnitr" | "mimo">("mimo");
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const render = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const out = compose(img, bw, color, style, mode);
    if (!out) return;
    if (previewRef.current) previewRef.current.src = out.toDataURL("image/png");
    setCanDl(true);
  }, [bw, color, style, mode]);

  useEffect(() => { if (hasFile) render(); }, [bw, color, style, mode, hasFile, render]);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const f = Array.from(list)[0];
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); return; }
    setError("");
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { imgRef.current = img; URL.revokeObjectURL(url); Promise.resolve().then(() => { setHasFile(true); setState("ready"); }); render(); };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const download = () => {
    const img = imgRef.current; if (!img || !canDl) return;
    const out = compose(img, bw, color, style, mode);
    if (!out) return;
    out.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "s-ramem.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, "image/png");
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="ib-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="12" height="12" x="6" y="6" rx="1"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="ib-work">
          <img ref={previewRef} id="ib-preview" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} alt="" />
          <div className="two-col" style={{ gap: "1rem" }}>
            <div className="stack-sm">
              <div className="stack-sm"><label className="field-label" htmlFor="ib-bw">Šířka rámečku: <span id="ib-bw-v">{bw}</span> px</label>
                <input type="range" id="ib-bw" min={1} max={100} value={bw} style={{ width: "100%" }} onChange={(e) => setBw(+e.target.value)} /></div>
              <div className="stack-sm"><label className="field-label" htmlFor="ib-color">Barva rámečku</label>
                <input type="color" id="ib-color" value={color} style={{ width: "3rem", height: "2rem" }} onChange={(e) => setColor(e.target.value)} /></div>
            </div>
            <div className="stack-sm">
              <div className="stack-sm"><label className="field-label" htmlFor="ib-style">Styl</label>
                <select className="select" id="ib-style" value={style} onChange={(e) => setStyle(e.target.value as "plny" | "zaobleny")}>
                  <option value="plny">Plný</option>
                  <option value="zaobleny">Zaoblený</option>
                </select></div>
              <div className="stack-sm"><label className="field-label" htmlFor="ib-mode">Umístění</label>
                <select className="select" id="ib-mode" value={mode} onChange={(e) => setMode(e.target.value as "uvnitr" | "mimo")}>
                  <option value="mimo">Mimo (plátno zvětšit o rámeček)</option>
                  <option value="uvnitr">Uvnitř (rámeček přes hrany)</option>
                </select></div>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <button className="btn btn-primary" id="ib-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout s-ramem.png
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="ib-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Rámeček přes canvas (zaoblení s fallbackem), běží lokálně.</p>
    </div>
  );
}
