"use client";

// Přidání textu do obrázku přes canvas — 9 pozic (mřížka), vlastní posun X/Y,
// velikost/barva/tučné písmo, živý náhled. Čistě client-side.
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

// 9 pozic mřížky: řádek (nahoře/uprostřed/dole) × sloupec (vlevo/střed/vpravo).
type PosRow = "t" | "m" | "b";
type PosCol = "l" | "c" | "r";
const POSITIONS: { value: string; row: PosRow; col: PosCol; label: string }[] = [
  { value: "tl", row: "t", col: "l", label: "Nahoře vlevo" },
  { value: "tc", row: "t", col: "c", label: "Nahoře střed" },
  { value: "tr", row: "t", col: "r", label: "Nahoře vpravo" },
  { value: "ml", row: "m", col: "l", label: "Uprostřed vlevo" },
  { value: "mc", row: "m", col: "c", label: "Uprostřed (střed)" },
  { value: "mr", row: "m", col: "r", label: "Uprostřed vpravo" },
  { value: "bl", row: "b", col: "l", label: "Dole vlevo" },
  { value: "bc", row: "b", col: "c", label: "Dole střed" },
  { value: "br", row: "b", col: "r", label: "Dole vpravo" },
];

export default function ImageAddText({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [text, setText] = useState("Ukázka textu");
  const [size, setSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [pos, setPos] = useState("bc");
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [bold, setBold] = useState(false);
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  // Překreslení textu při každé změně (živý náhled).
  const render = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    if (!canvasRef.current) {
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      canvasRef.current = c; ctxRef.current = c.getContext("2d");
    }
    const canvas = canvasRef.current!, ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const p = POSITIONS.find((x) => x.value === pos) ?? POSITIONS[7];
    const pad = Math.round(size * 0.6) + 8;
    ctx.font = `${bold ? "bold " : ""}${size}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = p.col === "l" ? "left" : p.col === "c" ? "center" : "right";
    ctx.textBaseline = p.row === "t" ? "top" : p.row === "m" ? "middle" : "bottom";
    const x = p.col === "l" ? pad : p.col === "c" ? canvas.width / 2 : canvas.width - pad;
    const y = p.row === "t" ? pad : p.row === "m" ? canvas.height / 2 : canvas.height - pad;
    // Jemný stín ať je text čitelný i na světlém pozadí.
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = Math.max(2, Math.round(size / 16));
    ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
    ctx.fillText(text, x + offX, y + offY);
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    if (previewRef.current) previewRef.current.src = canvas.toDataURL("image/png");
    setCanDl(true);
  }, [text, size, color, pos, offX, offY, bold]);

  useEffect(() => { if (hasFile) render(); }, [text, size, color, pos, offX, offY, bold, hasFile, render]);

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
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "s-textem.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, "image/png");
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="at-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="at-work">
          <img ref={previewRef} id="at-preview" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginBottom: "1rem" }} alt="" />
          <div className="two-col" style={{ gap: "1rem" }}>
            <div className="stack-sm">
              <div className="stack-sm"><label className="field-label" htmlFor="at-text">Text</label>
                <input className="input" id="at-text" type="text" value={text} onChange={(e) => setText(e.target.value)} /></div>
              <div className="stack-sm"><label className="field-label" htmlFor="at-size">Velikost písma: <span id="at-size-v">{size}</span> px</label>
                <input type="range" id="at-size" min={12} max={200} value={size} style={{ width: "100%" }} onChange={(e) => setSize(+e.target.value)} /></div>
              <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem" }}>
                <input type="checkbox" id="at-bold" checked={bold} onChange={(e) => setBold(e.target.checked)} /> Tučné písmo
              </label>
            </div>
            <div className="stack-sm">
              <div className="stack-sm"><label className="field-label" htmlFor="at-pos">Pozice</label>
                <select className="select" id="at-pos" value={pos} onChange={(e) => setPos(e.target.value)}>
                  {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select></div>
              <div className="stack-sm"><label className="field-label" htmlFor="at-color">Barva textu</label>
                <input type="color" id="at-color" value={color} style={{ width: "3rem", height: "2rem" }} onChange={(e) => setColor(e.target.value)} /></div>
              <div className="stack-sm"><label className="field-label" htmlFor="at-ox">Posun X: <span id="at-ox-v">{offX}</span> px</label>
                <input type="range" id="at-ox" min={-200} max={200} value={offX} style={{ width: "100%" }} onChange={(e) => setOffX(+e.target.value)} /></div>
              <div className="stack-sm"><label className="field-label" htmlFor="at-oy">Posun Y: <span id="at-oy-v">{offY}</span> px</label>
                <input type="range" id="at-oy" min={-200} max={200} value={offY} style={{ width: "100%" }} onChange={(e) => setOffY(+e.target.value)} /></div>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <button className="btn btn-primary" id="at-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout s-textem.png
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="at-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Vkládání textu přes canvas, živý náhled. Běží lokálně.</p>
    </div>
  );
}
