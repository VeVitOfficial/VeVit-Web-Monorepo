"use client";

// Pixelace obrázku přes canvas — zmenšení oblasti na 1/pixel a zpětné zvětšení
// se vypnutým vyhlazováním (imageSmoothingEnabled=false). Celý obrázek nebo
// zvolená oblast (% posuvníky). Čistě client-side.
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

export default function ImagePixelate({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [pixel, setPixel] = useState(12);
  const [whole, setWhole] = useState(true);
  const [rx, setRx] = useState(0);   // X start (%)
  const [ry, setRy] = useState(0);   // Y start (%)
  const [rw, setRw] = useState(50);  // šířka oblasti (%)
  const [rh, setRh] = useState(50);  // výška oblasti (%)
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const render = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const W = img.naturalWidth, H = img.naturalHeight;
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    // Oblast pixelace (v px, clamped na rozměry obrázku).
    let sx = 0, sy = 0, sw = W, sh = H;
    if (!whole) {
      sx = Math.round((rx / 100) * W); sy = Math.round((ry / 100) * H);
      sw = Math.max(1, Math.round((rw / 100) * W)); sh = Math.max(1, Math.round((rh / 100) * H));
      sw = Math.min(sw, W - sx); sh = Math.min(sh, H - sy);
      if (sw <= 0 || sh <= 0) { if (previewRef.current) previewRef.current.src = out.toDataURL("image/png"); return; }
    }

    // Zmenšení na (sw/pixel × sh/pixel) a zpět bez vyhlazování = velké pixely.
    const tw = Math.max(1, Math.ceil(sw / pixel));
    const th = Math.max(1, Math.ceil(sh / pixel));
    const small = document.createElement("canvas");
    small.width = tw; small.height = th;
    const sctx = small.getContext("2d");
    if (!sctx) return;
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(out, sx, sy, sw, sh, 0, 0, tw, th);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, tw, th, sx, sy, sw, sh);
    ctx.imageSmoothingEnabled = true;

    canvasRef.current = out;
    if (previewRef.current) previewRef.current.src = out.toDataURL("image/png");
    setCanDl(true);
  }, [pixel, whole, rx, ry, rw, rh]);

  useEffect(() => { if (hasFile) void Promise.resolve().then(render); }, [pixel, whole, rx, ry, rw, rh, hasFile, render]);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const f = Array.from(list)[0];
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); return; }
    setError("");
    canvasRef.current = null;
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
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "pixelovano.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, "image/png");
  };

  const slider = (id: string, label: string, val: number, set: (v: number) => void, min: number, max: number) => (
    <div className="stack-sm" key={id}>
      <label className="field-label" htmlFor={id}>{label}: <span id={`${id}-v`}>{val}</span> %</label>
      <input type="range" id={id} min={min} max={max} value={val} style={{ width: "100%" }} onChange={(e) => set(+e.target.value)} />
    </div>
  );

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="px-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M11 7h.01"/><path d="M15 7h.01"/><path d="M7 11h.01"/><path d="M11 11h.01"/><path d="M15 11h.01"/><path d="M7 15h.01"/><path d="M11 15h.01"/><path d="M15 15h.01"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="px-work">
          <img ref={previewRef} id="px-preview" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} alt="" />
          <div className="stack-sm">
            <div className="stack-sm"><label className="field-label" htmlFor="px-pixel">Velikost pixelu: <span id="px-pixel-v">{pixel}</span> px</label>
              <input type="range" id="px-pixel" min={4} max={64} value={pixel} style={{ width: "100%" }} onChange={(e) => setPixel(+e.target.value)} /></div>
            <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem" }}>
              <input type="checkbox" id="px-whole" checked={whole} onChange={(e) => setWhole(e.target.checked)} /> Celý obrázek (jinak vyberte oblast níže)
            </label>
            {!whole ? (
              <div className="two-col" style={{ gap: "1rem" }}>
                <div className="stack-sm">
                  {slider("px-rx", "Začátek X", rx, setRx, 0, 99)}
                  {slider("px-ry", "Začátek Y", ry, setRy, 0, 99)}
                </div>
                <div className="stack-sm">
                  {slider("px-rw", "Šířka oblasti", rw, setRw, 1, 100)}
                  {slider("px-rh", "Výška oblasti", rh, setRh, 1, 100)}
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <button className="btn btn-primary" id="px-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout pixelovano.png
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="px-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Pixelace přes canvas (zmenšení a zvětšení bez vyhlazování), běží lokálně.</p>
    </div>
  );
}
