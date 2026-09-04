"use client";

// Tvůrce animovaného GIFu ze sekvence obrázků, čistě client-side (gifenc lazy-load).
// Port legacy gif-maker.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, loadScript, toastSuccess } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/bmp"];
const MAX = 15 * 1024 * 1024;

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

interface ImgItem { id: number; file: File; name: string; size: number; url: string; }

declare global {
  interface Window {
    gifenc?: {
      GIFEncoder: () => { writeFrame: (idx: Uint8Array, w: number, h: number, o: { palette: number[][]; delay: number }) => void; finish: () => void; bytes: () => Uint8Array };
      quantize: (data: Uint8Array, maxColors: number) => number[][];
      applyPalette: (data: Uint8Array, palette: number[][]) => Uint8Array;
    };
  }
}

export default function GifMaker({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ImgItem[]>([]);
  const seqRef = useRef(0);
  const resultUrlRef = useRef<string | null>(null);

  const [items, setItems] = useState<ImgItem[]>([]);
  const [delay, setDelay] = useState(200);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  const ensure = useCallback(async () => {
    if (window.gifenc) return true;
    try { await loadScript("/tools/assets/js/lib/gifenc.js"); return !!window.gifenc; }
    catch { return false; }
  }, []);

  useEffect(() => () => {
    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const incoming = Array.from(list);
    const cur = itemsRef.current.slice();
    for (const f of incoming) {
      if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); continue; }
      if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); continue; }
      const id = ++seqRef.current;
      cur.push({ id, file: f, name: f.name, size: f.size, url: URL.createObjectURL(f) });
    }
    itemsRef.current = cur;
    setItems(cur);
    setError("");
  };

  const remove = (id: number) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.url);
    const next = itemsRef.current.filter((x) => x.id !== id);
    itemsRef.current = next;
    setItems(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= itemsRef.current.length) return;
    const arr = itemsRef.current.slice();
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    itemsRef.current = arr;
    setItems(arr);
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const run = useCallback(async () => {
    const files = itemsRef.current;
    if (files.length < 2) { setError("Přidejte alespoň dva obrázky."); return; }
    setError("");
    setRunning(true);
    setProgress(5); setProgLabel("Načítám obrázky…");
    const imgs: (HTMLImageElement | null)[] = new Array(files.length);
    let loaded = 0;
    let failed = false;
    await new Promise<void>((resolve) => {
      files.forEach((it, i) => {
        const url = URL.createObjectURL(it.file);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); if (failed) return; imgs[i] = img; loaded++; setProgress(5 + Math.round((loaded / files.length) * 25)); if (loaded === files.length) resolve(); };
        img.onerror = () => { URL.revokeObjectURL(url); if (failed) return; failed = true; setError("Obrázek se nepodařilo načíst: " + it.name); setRunning(false); resolve(); };
        img.src = url;
      });
    });
    if (failed || imgs.some((x) => !x)) { setRunning(false); return; }

    const ok = await ensure();
    if (!ok || !window.gifenc) { setError("Knihovnu gifenc se nepodařilo načíst."); setRunning(false); return; }
    const g = window.gifenc;
    const first = imgs[0]!;
    let W: number, H: number;
    if (width > 0) { W = width; H = Math.round(first.naturalHeight * (width / first.naturalWidth)) || width; }
    else { W = first.naturalWidth || first.width; H = first.naturalHeight || first.height; }
    if (W * H > 1280 * 1280) { setError("Příliš velký GIF (max cca 1280×1280). Zmenšete šířku."); setRunning(false); return; }
    const enc = g.GIFEncoder();
    const dly = Math.max(20, delay);
    const n = imgs.length;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(imgs[i]!, 0, 0, W, H);
      const data = new Uint8Array(ctx.getImageData(0, 0, W, H).data);
      const palette = g.quantize(data, 256);
      const idx = g.applyPalette(data, palette);
      enc.writeFrame(idx, W, H, { palette, delay: dly });
      setProgress(30 + Math.round(((i + 1) / n) * 65));
      setProgLabel("Kóduji rámeček " + (i + 1) + "/" + n + "…");
    }
    enc.finish();
    const bytes = enc.bytes();
    const blob = new Blob([bytes as unknown as BlobPart], { type: "image/gif" });
    setProgress(100); setProgLabel("Hotovo");
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    const url = URL.createObjectURL(blob);
    resultUrlRef.current = url;
    setResult({ url, size: blob.size });
    setRunning(false);
    toastSuccess("GIF vytvořeno");
  }, [delay, width, ensure]);

  const dl = () => {
    if (!result) return;
    const a = document.createElement("a"); a.href = result.url; a.download = "animace.gif"; a.click();
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="gm-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázky (min. 2, max 15 MB každý)"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="m7 12 3-3 3 3" /><path d="M10 9v6" /><path d="M14 18h4" /></svg></span>
        <span className="dz-title">Přetáhněte obrázky (min. 2, max 15 MB každý)</span>
        <span className="dz-hint">PNG, JPG, WebP, BMP — více souborů najednou</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} multiple onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {items.length > 0 ? (
        <div id="gm-work">
          <div className="file-list" id="gm-list">
            {items.map((it, i) => (
              <div key={it.id} className="file-row">
                <img src={it.url} alt="" className="file-thumb" />
                <span className="file-name">{it.name}</span>
                <span className="muted" style={{ fontSize: "0.75rem" }}>{fmtSize(it.size)}</span>
                <div className="row" style={{ gap: "0.2rem" }}>
                  <button type="button" className="btn btn-ghost" aria-label="Nahoru" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button type="button" className="btn btn-ghost" aria-label="Dolů" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button type="button" className="btn btn-ghost file-remove" aria-label="Odebrat" onClick={() => remove(it.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="two-col" style={{ gap: "1rem", marginTop: "0.75rem" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="gm-delay">Zpoždění snímku: <span>{delay}</span> ms</label><input type="range" id="gm-delay" min={20} max={2000} step={20} value={delay} style={{ width: "100%" }} onChange={(e) => setDelay(+e.target.value)} /></div>
            <div className="stack-sm"><label className="field-label" htmlFor="gm-width">Šířka (0 = originál)</label><input className="input" id="gm-width" type="number" min={0} step={10} value={width} onChange={(e) => setWidth(+e.target.value || 0)} /></div>
          </div>
          {running ? (
            <div className="stack-sm" style={{ marginTop: "0.75rem" }}>
              <progress id="gm-prog" value={progress} max={100} style={{ width: "100%" }} />
              <span className="muted" id="gm-prog-label" style={{ fontSize: "0.8rem" }}>{progLabel} {progress}%</span>
            </div>
          ) : null}
          <button className="btn btn-primary btn-touch" id="gm-run" type="button" disabled={running || items.length < 2} style={{ marginTop: "0.75rem" }} onClick={run}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg> Vytvořit GIF
          </button>
        </div>
      ) : null}

      {result ? (
        <div id="gm-out" className="stack-sm" style={{ marginTop: "0.75rem" }}>
          <img src={result.url} alt="GIF" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} />
          <button className="btn btn-secondary btn-touch" type="button" onClick={dl}>Stáhnout GIF ({fmtSize(result.size)})</button>
        </div>
      ) : null}

      {error ? <p className="error-text" id="gm-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Kódování přes gifenc (lazy-load). Běží lokálně — nic se neodesílá na server.</p>
    </div>
  );
}