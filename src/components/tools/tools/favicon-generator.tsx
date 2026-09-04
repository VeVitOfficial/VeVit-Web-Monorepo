"use client";

// Favicon generátor — PNG více velikostí + ICO + ZIP, čistě client-side (jszip lazy-load).
// Port legacy favicon-generator.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, loadScript } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const MAX = 25 * 1024 * 1024;
const SIZES = [16, 32, 48, 64, 128, 256];

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

interface BlobSize { size: number; blob: Blob; url: string; }

async function buildIco(blobs: BlobSize[]): Promise<Blob> {
  const count = blobs.length;
  const headerLen = 6 + count * 16;
  let total = headerLen;
  blobs.forEach((b) => { total += b.blob.size; });
  const buf = new ArrayBuffer(total);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  dv.setUint16(0, 0, true);
  dv.setUint16(2, 1, true);
  dv.setUint16(4, count, true);
  let off = headerLen;
  for (let i = 0; i < count; i++) {
    const b = blobs[i];
    const sz = b.blob.size;
    const dim = b.size >= 256 ? 0 : b.size;
    dv.setUint8(6 + i * 16 + 0, dim);
    dv.setUint8(6 + i * 16 + 1, dim);
    dv.setUint8(6 + i * 16 + 2, 0);
    dv.setUint8(6 + i * 16 + 3, 0);
    dv.setUint16(6 + i * 16 + 4, 1, true);
    dv.setUint16(6 + i * 16 + 6, 32, true);
    dv.setUint32(6 + i * 16 + 8, sz, true);
    dv.setUint32(6 + i * 16 + 12, off, true);
    const data = new Uint8Array(await b.blob.arrayBuffer());
    u8.set(data, off);
    off += sz;
  }
  return new Blob([buf], { type: "image/x-icon" });
}

declare global { interface Window { JSZip?: new () => { file: (n: string, b: Blob) => void; generateAsync: (o: { type: string }) => Promise<Blob> }; } }

export default function FaviconGenerator({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const urlsRef = useRef<string[]>([]);

  const [hasFile, setHasFile] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({ 16: true, 32: true, 48: true, 64: false, 128: false, 256: true });
  const [bg, setBg] = useState("#000000");
  const [bgOn, setBgOn] = useState(false);
  const [results, setResults] = useState<BlobSize[]>([]);
  const [error, setError] = useState("");
  const [canDl, setCanDl] = useState(false);

  const generate = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const szs = SIZES.filter((s) => checked[s]).sort((a, b) => a - b);
    if (!szs.length) { setError("Vyberte alespoň jednu velikost."); setResults([]); setCanDl(false); return; }
    setError("");
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    const out: BlobSize[] = [];
    for (const s of szs) {
      const c = document.createElement("canvas"); c.width = s; c.height = s;
      const cx = c.getContext("2d")!;
      cx.imageSmoothingQuality = "high";
      if (bgOn && bg) { cx.fillStyle = bg; cx.fillRect(0, 0, s, s); }
      cx.drawImage(img, 0, 0, s, s);
      const b: Blob | null = await new Promise((res) => c.toBlob((x) => res(x), "image/png"));
      if (b) { const url = URL.createObjectURL(b); urlsRef.current.push(url); out.push({ size: s, blob: b, url }); }
    }
    setResults(out);
    setCanDl(out.length > 0);
  }, [checked, bg, bgOn]);

  useEffect(() => { if (hasFile) Promise.resolve().then(() => generate()); }, [hasFile, checked, bg, bgOn, generate]);
  useEffect(() => () => { urlsRef.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const f = Array.from(list)[0];
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); return; }
    setError("");
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      if (imgRef.current) { /* previous img — url revoked below */ }
      imgRef.current = img;
      URL.revokeObjectURL(url);
      Promise.resolve().then(() => setHasFile(true));
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const dlIco = async () => {
    if (!results.length) return;
    const ico = await buildIco(results);
    const a = document.createElement("a"); a.href = URL.createObjectURL(ico); a.download = "favicon.ico"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const dlZip = async () => {
    if (!results.length) return;
    const ok = window.JSZip ? true : await loadScript("/tools/assets/js/lib/jszip.min.js").then(() => !!window.JSZip).catch(() => false);
    if (!ok || !window.JSZip) { setError("Knihovnu JSZip se nepodařilo načíst."); return; }
    const zip = new window.JSZip();
    const ico = await buildIco(results);
    zip.file("favicon.ico", ico);
    results.forEach((r) => zip.file(`favicon-${r.size}.png`, r.blob));
    const b = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "favicony.zip"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="dropzone" id="fg-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek (čtvercový doporučeno)"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg></span>
        <span className="dz-title">Přetáhněte obrázek (čtvercový doporučeno)</span>
        <span className="dz-hint">PNG, JPG, WebP</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="fg-work">
          <fieldset className="stack-sm">
            <legend className="field-label">Velikosti</legend>
            <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }} id="fg-sizes">
              {SIZES.map((s) => (
                <label key={s} className="chip" style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: "0.85rem" }}>
                  <input type="checkbox" className="fg-sz" value={s} checked={!!checked[s]} onChange={(e) => setChecked((p) => ({ ...p, [s]: e.target.checked }))} />
                  {s}×{s}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="row" style={{ gap: "0.5rem", alignItems: "center", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            <input type="checkbox" id="fg-bg-on" checked={bgOn} onChange={(e) => setBgOn(e.target.checked)} /> Pozadí:
            <input type="color" id="fg-bg" value={bg} style={{ width: "3rem", height: "2rem" }} onChange={(e) => setBg(e.target.value)} disabled={!bgOn} />
          </label>
          <div className="row" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "0.75rem" }} id="fg-preview">
            {results.map((r) => (
              <div key={r.size} className="stack-sm" style={{ alignItems: "center" }}>
                <img src={r.url} alt="" style={{ width: Math.min(96, r.size), height: Math.min(96, r.size), imageRendering: r.size <= 32 ? "pixelated" : "auto" }} />
                <span className="muted" style={{ fontSize: "0.75rem" }}>{r.size}×{r.size}</span>
              </div>
            ))}
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn btn-primary" id="fg-dl-ico" type="button" disabled={!canDl} onClick={dlIco}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout .ico
            </button>
            <button className="btn btn-secondary" id="fg-dl-zip" type="button" disabled={!canDl} onClick={dlZip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout ZIP (PNG + ICO)
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="fg-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Generuje PNG pro vybrané velikosti + jeden soubor .ico (PNG-in-ICO, Vista+). ZIP přes JSZip (lazy-load). Běží lokálně.</p>
    </div>
  );
}