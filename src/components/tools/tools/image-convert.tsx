"use client";
/* eslint-disable @next/next/no-img-element -- náhled výstupu je object URL */

// Převod formátu obrázku přes canvas (PNG/JPG/WebP/BMP/TIFF/GIF), čistě client-side.
// Vlevo pole pro soubor + náhled vstupu, vpravo nabídka formátů a živý náhled výstupu.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize } from "@/components/tools/tool-runtime";
import { ConvertShell, FormatMenu, FilePreview, type FormatOption } from "@/components/tools/convert-layout";
import { RASTER_FORMATS, encodeCanvas, type RasterFormat } from "@/components/tools/raster-encode";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp", "image/avif"];
const MAX = 25 * 1024 * 1024;
const FORMATS: FormatOption<RasterFormat>[] = RASTER_FORMATS.map((f) => ({ key: f.key, label: f.label, hint: f.hint }));

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

export default function ImageConvert({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<RasterFormat>("png");
  const [quality, setQuality] = useState(90);
  const [error, setError] = useState("");
  const [out, setOut] = useState<{ blob: Blob; ext: string; preview: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const meta = RASTER_FORMATS.find((f) => f.key === format)!;

  // Načtení obrázku do <img> (kvůli rozměrům a kreslení do canvasu).
  useEffect(() => {
    if (!file) return;
    let off = false;
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => { if (!off) setImg(el); };
    el.onerror = () => { if (!off) setError("Obrázek se nepodařilo načíst."); };
    el.src = url;
    return () => { off = true; URL.revokeObjectURL(url); };
  }, [file]);

  // Živý převod při změně formátu / kvality.
  const convert = useCallback(async () => {
    if (!img || !img.naturalWidth) return;
    setError("");
    try {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      const blob = await encodeCanvas(c, format, quality / 100);
      // TIFF/BMP prohlížeč zobrazit neumí → náhled z PNG kopie.
      const pv = format === "tiff" || format === "bmp" ? await new Promise<Blob | null>((res) => c.toBlob(res, "image/png")) : blob;
      setOut((prev) => { if (prev) URL.revokeObjectURL(prev.preview); return { blob, ext: meta.ext, preview: URL.createObjectURL(pv ?? blob) }; });
    } catch (e) {
      setOut(null);
      setError((e as Error).message || "Převod selhal.");
    }
  }, [img, format, quality, meta.ext]);
  useEffect(() => { Promise.resolve().then(convert); }, [convert]);
  useEffect(() => () => { setOut((p) => { if (p) URL.revokeObjectURL(p.preview); return null; }); }, []);

  const pick = (list: FileList | File[] | null) => {
    const f = list && Array.from(list)[0];
    if (!f) return;
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); return; }
    setError(""); setImg(null); setOut(null); setFile(f);
  };
  const reset = () => { setFile(null); setImg(null); setOut(null); setError(""); };

  const download = () => {
    if (!out) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out.blob);
    a.download = `${(file?.name ?? "obrazek").replace(/\.[^.]+$/, "")}.${out.ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <ConvertShell
      hasFile={!!file}
      left={
        <>
          <div className={`dropzone${dragOver ? " dragover" : ""}`} id="ic-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); pick(e.dataTransfer.files); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); if (e.target === e.currentTarget) setDragOver(false); }}>
            <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
            <span className="dz-title">{file ? "Vyměnit obrázek" : "Přetáhněte obrázek"}</span>
            <span className="dz-hint">PNG, JPG, WebP, GIF, BMP, AVIF</span>
            <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
          </div>
          {file ? <FilePreview file={file} onRemove={reset} /> : null}
        </>
      }
      right={
        <>
          <FormatMenu title="Převést na" formats={FORMATS} value={format} onChange={setFormat} disabled={!file} />
          {meta.lossy ? (
            <div className="stack-sm" id="ic-q-wrap">
              <label className="field-label" htmlFor="ic-q">Kvalita: <span id="ic-q-v">{quality}</span> %</label>
              <input type="range" id="ic-q" min={10} max={100} value={quality} style={{ width: "100%" }} onChange={(e) => setQuality(+e.target.value)} />
            </div>
          ) : null}
          {out ? (
            <figure className="conv-preview-box">
              <div className="conv-preview-media"><img src={out.preview} alt="Náhled výstupu" /></div>
              <figcaption><span className="fi-meta"><span className="fi-name">Výstup .{out.ext}</span><span className="fi-size">{fmtSize(out.blob.size)}</span></span></figcaption>
            </figure>
          ) : null}
          {error && <p className="error-text" role="alert">{error}</p>}
          <button className="btn btn-primary btn-touch btn-block" id="ic-dl" type="button" disabled={!out} onClick={download}>
            Stáhnout {meta.label}
          </button>
          <p className="muted" id="ic-info" style={{ fontSize: "0.78rem", margin: 0 }}>Převod probíhá lokálně v prohlížeči.</p>
        </>
      }
    />
  );
}
