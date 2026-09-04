"use client";

// Collage z více obrázků v canvasu, čistě client-side.
// Port legacy image-collage.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"];
const MAX = 25 * 1024 * 1024;
const MAX_FILES = 9;
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

interface ImgItem { id: number; file: File; img: HTMLImageElement; url: string; name: string; }

type LayoutKey = "grid" | "row" | "col" | "2x2" | "3x3" | "hero";
const LAYOUTS: { key: LayoutKey; label: string }[] = [
  { key: "grid", label: "Mřížka" },
  { key: "row", label: "Řádek" },
  { key: "col", label: "Sloupec" },
  { key: "2x2", label: "2×2" },
  { key: "3x3", label: "3×3" },
  { key: "hero", label: "Hero" },
];

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.naturalWidth / img.naturalHeight;
  const r = w / h;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if (ir > r) { sw = img.naturalHeight * r; sx = (img.naturalWidth - sw) / 2; }
  else { sh = img.naturalWidth / r; sy = (img.naturalHeight - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

const OUT_W = 1200;

export default function ImageCollage({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const itemsRef = useRef<ImgItem[]>([]);
  const seqRef = useRef(0);

  const [items, setItems] = useState<ImgItem[]>([]);
  const [layout, setLayout] = useState<LayoutKey>("grid");
  const [gap, setGap] = useState(8);
  const [format, setFormat] = useState("image/png");
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const list = itemsRef.current;
    const n = list.length; if (!n) return;
    const g = gap;
    const layouts: Record<LayoutKey, () => { w: number; h: number; cells: { x: number; y: number; w: number; h: number }[] }> = {
      grid: () => {
        const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
        const rows = Math.ceil(n / cols);
        const cw = (OUT_W - g * (cols + 1)) / cols;
        const ch = cw;
        const cells = [];
        for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), c = i % cols; cells.push({ x: g + c * (cw + g), y: g + r * (ch + g), w: cw, h: ch }); }
        return { w: OUT_W, h: g + rows * (ch + g), cells };
      },
      row: () => {
        const cw = (OUT_W - g * (n + 1)) / n;
        const cells = [];
        for (let i = 0; i < n; i++) cells.push({ x: g + i * (cw + g), y: g, w: cw, h: cw });
        return { w: OUT_W, h: cw + g * 2, cells };
      },
      col: () => {
        const cw = OUT_W - g * 2;
        const ch = cw * 0.6;
        const cells = [];
        for (let i = 0; i < n; i++) cells.push({ x: g, y: g + i * (ch + g), w: cw, h: ch });
        return { w: OUT_W, h: g + n * (ch + g), cells };
      },
      "2x2": () => {
        const cols = 2, rows = 2;
        const cw = (OUT_W - g * (cols + 1)) / cols;
        const cells = [];
        for (let i = 0; i < Math.min(n, 4); i++) { const r = Math.floor(i / cols), c = i % cols; cells.push({ x: g + c * (cw + g), y: g + r * (cw + g), w: cw, h: cw }); }
        return { w: OUT_W, h: g + rows * (cw + g), cells };
      },
      "3x3": () => {
        const cols = 3, rows = 3;
        const cw = (OUT_W - g * (cols + 1)) / cols;
        const cells = [];
        for (let i = 0; i < Math.min(n, 9); i++) { const r = Math.floor(i / cols), c = i % cols; cells.push({ x: g + c * (cw + g), y: g + r * (cw + g), w: cw, h: cw }); }
        return { w: OUT_W, h: g + rows * (cw + g), cells };
      },
      hero: () => {
        const heroW = OUT_W - g * 2, heroH = heroW * 0.55;
        const cells = [{ x: g, y: g, w: heroW, h: heroH }];
        const rest = n - 1; if (rest > 0) {
          const cols = Math.min(rest, 3);
          const rows = Math.ceil(rest / cols);
          const cw = (OUT_W - g * (cols + 1)) / cols;
          const ch = cw * 0.5;
          for (let i = 1; i < n; i++) { const r = Math.floor((i - 1) / cols), c = (i - 1) % cols; cells.push({ x: g + c * (cw + g), y: g + heroH + g + r * (ch + g), w: cw, h: ch }); }
          return { w: OUT_W, h: g + heroH + g + rows * (ch + g), cells };
        }
        return { w: OUT_W, h: heroH + g * 2, cells };
      },
    };
    const L = layouts[layout]();
    canvas.width = L.w; canvas.height = L.h;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    list.forEach((it, i) => { const c = L.cells[i]; if (c) drawCover(ctx, it.img, c.x, c.y, c.w, c.h); });
    setCanDl(true);
  }, [layout, gap]);

  useEffect(() => { if (items.length) Promise.resolve().then(() => draw()); }, [items, draw]);
  useEffect(() => () => { itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url)); }, []);

  const pick = (list: FileList | null, append = false) => {
    if (!list || !list.length) return;
    const incoming = Array.from(list);
    const ok: File[] = [];
    for (const f of incoming) {
      if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); continue; }
      if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); continue; }
      ok.push(f);
    }
    if (!ok.length) return;
    setError("");
    const cur = append ? itemsRef.current.slice() : [];
    const room = MAX_FILES - cur.length;
    const adding = ok.slice(0, room);
    if (ok.length > room) setError("Maximální počet obrázků je " + MAX_FILES + ".");
    let loaded = 0;
    const newItems: ImgItem[] = [];
    adding.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const id = ++seqRef.current;
        newItems.push({ id, file, img, url, name: file.name });
        loaded++;
        if (loaded === adding.length) {
          const all = cur.concat(newItems);
          itemsRef.current = all;
          setItems(all);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); loaded++; if (loaded === adding.length) { const all = cur.concat(newItems); itemsRef.current = all; setItems(all); } };
      img.src = url;
    });
    if (!adding.length) { if (!append) { itemsRef.current = []; setItems([]); } }
  };

  const remove = (id: number) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.url);
    const next = itemsRef.current.filter((x) => x.id !== id);
    itemsRef.current = next;
    setItems(next);
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files, true); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `collage.${EXT[format]}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, format, 0.92);
  };

  return (
    <div className="stack" style={{ maxWidth: "52rem", margin: "0 auto" }}>
      <div className="dropzone" id="cl-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázky (2–9)"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg></span>
        <span className="dz-title">Přetáhněte obrázky (2–9)</span>
        <span className="dz-hint">PNG, JPG, WebP, GIF, BMP — více souborů najednou</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} multiple onChange={(e) => { pick(e.target.files, true); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {items.length > 0 ? (
        <div id="cl-work">
          <div className="file-list" id="cl-list">
            {items.map((it) => (
              <div key={it.id} className="file-row">
                <img src={it.url} alt="" className="file-thumb" />
                <span className="file-name">{it.name}</span>
                <button type="button" className="btn btn-ghost file-remove" aria-label="Odebrat" onClick={() => remove(it.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }} id="cl-layout">
            {LAYOUTS.map((l) => (
              <button key={l.key} type="button" className={`btn ${layout === l.key ? "btn-primary" : "btn-ghost"}`} data-layout={l.key} onClick={() => setLayout(l.key)}>{l.label}</button>
            ))}
          </div>
          <div className="stack-sm" style={{ marginTop: "0.75rem", maxWidth: "24rem" }}>
            <label className="field-label">Mezera: <span>{gap}</span> px</label>
            <input type="range" id="cl-gap" min={0} max={40} value={gap} style={{ width: "100%" }} onChange={(e) => setGap(+e.target.value)} />
          </div>
          <canvas ref={canvasRef} id="cl-canvas" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem", background: "#000" }} />
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem", alignItems: "end" }}>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>Formát:
              <select className="select" id="cl-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option>
              </select>
            </label>
            <button className="btn btn-primary" id="cl-dl" type="button" disabled={!canDl} onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout collage
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="cl-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Collage přes canvas, živý náhled. Běží lokálně — data neopustí prohlížeč.</p>
    </div>
  );
}