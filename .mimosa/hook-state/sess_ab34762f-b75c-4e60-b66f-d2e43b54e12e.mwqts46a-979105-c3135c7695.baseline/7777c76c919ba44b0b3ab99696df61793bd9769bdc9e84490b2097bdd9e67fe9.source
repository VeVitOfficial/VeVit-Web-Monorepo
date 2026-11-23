"use client";

// Zaoblení obrázku přes canvas — kruh (čtvercové plátno s výřezem ze středu
// při průhledném pozadí) nebo zaoblený obdélník s posuvníkem radiusu.
// Pozadí: průhledné / bílé / vlastní barva. Čistě client-side.
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

/** Složí výstupní canvas (kruh/zaoblený obdélník + pozadí). */
function compose(img: HTMLImageElement, shape: "circle" | "roundrect", radius: number, bg: string | null): HTMLCanvasElement | null {
  const W = img.naturalWidth, H = img.naturalHeight;
  const out = document.createElement("canvas");
  const ctx = out.getContext("2d");
  if (!ctx) return null;

  if (shape === "circle" && bg === null) {
    // Průhledné pozadí → čtvercové plátno, výřez ze středu, clip kruh.
    const s = Math.min(W, H);
    out.width = s; out.height = s;
    ctx.save();
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, (W - s) / 2, (H - s) / 2, s, s, 0, 0, s, s);
    ctx.restore();
    return out;
  }

  // Barevné pozadí → plátno v původním poměru stran.
  out.width = W; out.height = H;
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
  ctx.save();
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2);
  } else {
    roundedRectPath(ctx, 0, 0, W, H, radius);
  }
  ctx.clip();
  ctx.drawImage(img, 0, 0);
  ctx.restore();
  return out;
}

export default function ImageRound({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [shape, setShape] = useState<"circle" | "roundrect">("circle");
  const [radius, setRadius] = useState(40);
  const [bgSel, setBgSel] = useState<"transparent" | "white" | "custom">("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const render = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const bg = bgSel === "transparent" ? null : bgSel === "white" ? "#ffffff" : bgColor;
    const out = compose(img, shape, radius, bg);
    if (!out) return;
    if (previewRef.current) previewRef.current.src = out.toDataURL("image/png");
    setCanDl(true);
  }, [shape, radius, bgSel, bgColor]);

  useEffect(() => { if (hasFile) render(); }, [shape, radius, bgSel, bgColor, hasFile, render]);

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
    const bg = bgSel === "transparent" ? null : bgSel === "white" ? "#ffffff" : bgColor;
    const out = compose(img, shape, radius, bg);
    if (!out) return;
    out.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "kulate.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, "image/png");
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="rd-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="rd-work">
          <img ref={previewRef} id="rd-preview" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} alt="" />
          <div className="two-col" style={{ gap: "1rem" }}>
            <div className="stack-sm">
              <div className="stack-sm"><label className="field-label" htmlFor="rd-shape">Tvar výstupu</label>
                <select className="select" id="rd-shape" value={shape} onChange={(e) => setShape(e.target.value as "circle" | "roundrect")}>
                  <option value="circle">Kruh</option>
                  <option value="roundrect">Zaoblený obdélník</option>
                </select></div>
              {shape === "roundrect" ? (
                <div className="stack-sm"><label className="field-label" htmlFor="rd-radius">Radius rohů: <span id="rd-radius-v">{radius}</span> px</label>
                  <input type="range" id="rd-radius" min={4} max={200} value={radius} style={{ width: "100%" }} onChange={(e) => setRadius(+e.target.value)} /></div>
              ) : null}
            </div>
            <div className="stack-sm">
              <div className="stack-sm"><label className="field-label" htmlFor="rd-bg">Pozadí</label>
                <select className="select" id="rd-bg" value={bgSel} onChange={(e) => setBgSel(e.target.value as "transparent" | "white" | "custom")}>
                  <option value="transparent">Průhledné (PNG)</option>
                  <option value="white">Bílé</option>
                  <option value="custom">Vlastní barva</option>
                </select></div>
              {bgSel === "custom" ? (
                <div className="stack-sm"><label className="field-label" htmlFor="rd-bgc">Barva pozadí</label>
                  <input type="color" id="rd-bgc" value={bgColor} style={{ width: "3rem", height: "2rem" }} onChange={(e) => setBgColor(e.target.value)} /></div>
              ) : null}
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <button className="btn btn-primary" id="rd-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout kulate.png
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="rd-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Ořez do kruhu / zaoblení rohů přes canvas, běží lokálně.</p>
    </div>
  );
}
