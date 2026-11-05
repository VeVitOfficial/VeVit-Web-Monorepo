"use client";

// Černobílý převod s prahováním — luminance (0.299R+0.587G+0.114B) porovnaná
// s prahem → čistá černá/bílá; volitelně jemný grayscale bez prahu.
// Čistě client-side přes canvas.
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

type Mode = "threshold" | "grayscale";

export default function ImageBw({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [mode, setMode] = useState<Mode>("threshold");
  const [threshold, setThreshold] = useState(128);
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const render = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const out = document.createElement("canvas");
    out.width = img.naturalWidth; out.height = img.naturalHeight;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, out.width, out.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      let v: number;
      if (mode === "threshold") v = lum < threshold ? 0 : 255;
      else v = Math.round(lum);
      d[i] = v; d[i + 1] = v; d[i + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
    canvasRef.current = out;
    if (previewRef.current) previewRef.current.src = out.toDataURL("image/png");
    setCanDl(true);
  }, [mode, threshold]);

  useEffect(() => { if (hasFile) void Promise.resolve().then(render); }, [mode, threshold, hasFile, render]);

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
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "cernobily.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, "image/png");
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="bw-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="bw-work">
          <img ref={previewRef} id="bw-preview" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} alt="" />
          <div className="stack-sm">
            <div>
              <label className="field-label" htmlFor="bw-mode">Režim</label>
              <select id="bw-mode" className="select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="threshold">Černobílý s prahem (ostře černá/bílá)</option>
                <option value="grayscale">Jemný grayscale (odstíny šedi)</option>
              </select>
            </div>
            {mode === "threshold" ? (
              <div className="stack-sm">
                <label className="field-label" htmlFor="bw-threshold">Práh: <span id="bw-threshold-v">{threshold}</span> (0=černá, 255=bílá)</label>
                <input type="range" id="bw-threshold" min={1} max={254} value={threshold} style={{ width: "100%" }} onChange={(e) => setThreshold(+e.target.value)} />
              </div>
            ) : null}
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <button className="btn btn-primary" id="bw-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout cernobily.png
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="bw-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Konverze přes canvas (luminance + práh), běží lokálně.</p>
    </div>
  );
}
