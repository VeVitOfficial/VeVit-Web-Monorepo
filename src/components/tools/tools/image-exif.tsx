"use client";

// Prohlížeč/odstraňovač EXIF metadat, čistě client-side (exifr lazy-load).
// Port legacy image-exif.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, loadScript } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX = 25 * 1024 * 1024;

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

// exifr je UMD — načítá se z public URL, globál window.exifr.
declare global {
  interface Window { exifr?: { parse: (file: File, opts?: Record<string, boolean>) => Promise<Record<string, unknown> | null> }; }
}

interface Row { k: string; v: string; }
function dms(v: number, pos: [string, string]): string {
  const d = Math.abs(v), deg = Math.floor(d), min = Math.floor((d - deg) * 60), sec = ((d - deg) * 60 - min) * 60;
  return `${deg}° ${min}' ${sec.toFixed(1)}" ${v >= 0 ? pos[0] : pos[1]}`;
}
function fmtGps(lat: number | null, lon: number | null): string | null {
  if (lat == null && lon == null) return null;
  return (lat != null ? dms(lat, ["N", "S"]) + "  " : "") + (lon != null ? dms(lon, ["E", "W"]) : "");
}

export default function ImageExif({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [gpsWarn, setGpsWarn] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canRemove, setCanRemove] = useState(false);
  const [error, setError] = useState("");

  const fail = useCallback((m: string) => setError(m), []);

  const ensure = useCallback(async () => {
    if (window.exifr) return true;
    try { await loadScript("/tools/assets/js/lib/exifr.umd.js"); return !!window.exifr; }
    catch { return false; }
  }, []);

  const load = useCallback(async () => {
    const file = fileRef.current;
    if (!file) return;
    setRows([]); setGpsWarn(false); setEmpty(false); setLoading(true);
    const ok = await ensure();
    if (!ok || !window.exifr) { setLoading(false); fail("Knihovnu exifr se nepodařilo načíst."); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o = (await window.exifr.parse(file, { tiff: true, exif: true, gps: true, iptc: true, jfif: true })) as Record<string, any> | null;
      setLoading(false);
      if (!o || !Object.keys(o).length) { setEmpty(true); setCanRemove(false); return; }
      const out: Row[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const push = (k: string, v: any) => { if (v) out.push({ k, v: String(v) }); };
      push("Výrobce", o.Make);
      push("Model", o.Model);
      push("Software", o.Software);
      push("Datum a čas", o.DateTimeOriginal || o.CreateDate);
      push("ISO", o.ISO);
      push("Clona (f/)", o.FNumber && "f/" + o.FNumber);
      push("Expozice", o.ExposureTime && (o.ExposureTime >= 1 ? o.ExposureTime + "s" : "1/" + Math.round(1 / o.ExposureTime) + "s"));
      push("Ohnisková vzdálenost", o.FocalLength && o.FocalLength + " mm");
      push("Šířka × výška", (o.ImageWidth || o.ExifImageWidth) && (o.ImageWidth || o.ExifImageWidth) + "×" + (o.ImageHeight || o.ExifImageHeight));
      push("Orientace", o.Orientation && "Otočení " + o.Orientation);
      const gps = fmtGps(o.latitude ?? null, o.longitude ?? null);
      push("GPS", gps as string | null);
      setRows(out);
      setGpsWarn(o.latitude != null || o.longitude != null);
      setCanRemove(true);
    } catch (e) { setLoading(false); fail("Čtení metadat selhalo: " + (e instanceof Error ? e.message : "")); }
  }, [ensure, fail]);

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
    fileRef.current = ok[0];
    setCanRemove(false);
    Promise.resolve().then(() => setHasFile(true));
    load();
  };

  const remove = () => {
    const file = fileRef.current; if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const cx = c.getContext("2d")!;
      if (file.type === "image/jpeg") { cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height); }
      cx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      c.toBlob((b) => {
        if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `bez-exif.${ext}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
      }, file.type === "image/jpeg" ? "image/jpeg" : (file.type || "image/jpeg"), 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); fail("Obrázek se nepodařilo načíst."); };
    img.src = url;
  };

  useEffect(() => () => { /* file url drží File objekt, ne object URL */ }, []);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="ex-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek (JPEG doporučeno)"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg></span>
        <span className="dz-title">Přetáhněte obrázek (JPEG doporučeno)</span>
        <span className="dz-hint">EXIF se nachází hlavně ve fotografiích JPEG</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="ex-work">
          <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} id="ex-data">
            {loading ? <p className="muted">Načítám metadata…</p> : null}
            {!loading && empty ? <p className="muted">Obrázek neobsahuje žádná čitelná metadata (nebo není JPEG).</p> : null}
            {!loading && rows.length > 0 ? rows.map((r, i) => (
              <div key={i} className="kv"><span className="k">{r.k}</span><span className="v mono">{r.v}</span></div>
            )) : null}
            {gpsWarn ? <p className="error-text" style={{ color: "#fbbf24" }}>⚠ Tato fotografie obsahuje GPS souřadnice — metadata mohou prozrazovat vaši polohu.</p> : null}
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn btn-secondary" id="ex-remove" type="button" disabled={!canRemove} onClick={remove}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21"/><path d="m5.082 11.09 8.828 8.828"/></svg> Odstranit metadata a stáhnout
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="error-text" id="ex-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Čtení přes exifr (lazy-load). Odstranění = překódování přes canvas, čímž se vymažou všechna metadata. Běží lokálně — data neopustí prohlížeč.</p>
    </div>
  );
}