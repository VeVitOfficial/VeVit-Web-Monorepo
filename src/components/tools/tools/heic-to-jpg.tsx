"use client";

// HEIC → JPG/PNG přes libheif (wasm, vendored). Převod iPhone fotek bez
// nahrávání na server — dekódování běží ve WebAssembly lokálně.
// Bundle: /tools/assets/js/lib/libheif/libheif-bundle.js (init funkce → API),
// wasm ve stejném adresáři (libheif.wasm).
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, useToolState, fmtSize, loadScript } from "@/components/tools/tool-runtime";

const ACCEPT = [".heic", ".heif", "image/heic", "image/heif", "image/heif-sequence"];
const MAX = 40 * 1024 * 1024;

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a;
    return false;
  });
}

// libheif-bundle.js definuje window.libheif — init funkci vracející API s HeifDecoder.
type HeifDisplayData = { data: Uint8ClampedArray; width: number; height: number };
type HeifImage = {
  get_width(): number;
  get_height(): number;
  display(data: HeifDisplayData, cb: (d: HeifDisplayData | null) => void): void;
};
type HeifDecoder = { decode(buf: ArrayBuffer): HeifImage[] };
type HeifApi = { HeifDecoder: new () => HeifDecoder };
type LibHeifInit = () => Promise<HeifApi>;

declare global {
  interface Window { libheif?: LibHeifInit }
}

interface Converted {
  name: string;
  url: string;
  size: number;
  w: number;
  h: number;
}

export default function HeicToJpg({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const convertedRef = useRef<Converted[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");
  const [quality, setQuality] = useState(90);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [error, setError] = useState("");
  const [converted, setConverted] = useState<Converted[]>([]);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null;
    return () => { convertedRef.current.forEach((c) => URL.revokeObjectURL(c.url)); };
  }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => matchesAccept(f, ACCEPT) && f.size <= MAX);
    const skipped = Array.from(list).length - arr.length;
    if (skipped > 0) setError("Některé soubory byly přeskočeny (neplatný typ nebo nad 40 MB).");
    else setError("");
    if (arr.length) {
      setFiles((prev) => [...prev, ...arr]);
      setState("ready");
    }
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { addFiles(e.target.files); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; addFiles(e.dataTransfer.files); };
  const clearAll = () => {
    convertedRef.current.forEach((c) => URL.revokeObjectURL(c.url));
    convertedRef.current = []; setConverted([]); setFiles([]); setError(""); setProgress(0);
    setState("idle");
  };

  const run = async () => {
    if (!files.length) return;
    setError(""); setRunning(true); setProgress(5); setProgLabel("Načítám libheif…"); setState("processing");
    try {
      if (!window.libheif) await loadScript("/tools/assets/js/lib/libheif/libheif-bundle.js");
      if (!window.libheif) throw new Error("Dekodér libheif se nepodařilo načíst.");
      const heif = await window.libheif();
      const decoder = new heif.HeifDecoder();
      convertedRef.current.forEach((c) => URL.revokeObjectURL(c.url));
      const results: Converted[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(10 + Math.round((85 * i) / files.length)); setProgLabel(`Dekóduji ${i + 1}/${files.length}: ${files[i].name}`);
        const buf = await files[i].arrayBuffer();
        const images = decoder.decode(buf);
        if (!images.length) throw new Error(`${files[i].name}: neobsahuje HEIC obrázek.`);
        const image = images[0];
        const w = image.get_width(), h = image.get_height();
        const out: HeifDisplayData = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
        const displayed = await new Promise<boolean>((res) => {
          image.display(out, (d) => res(!!d));
        });
        if (!displayed) throw new Error(`${files[i].name}: dekódování selhalo.`);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.putImageData(new ImageData(out.data as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
        const mime = format === "png" ? "image/png" : "image/jpeg";
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mime, quality / 100));
        const name = files[i].name.replace(/\.(heic|heif)$/i, "") + (format === "png" ? ".png" : ".jpg");
        results.push({ name, url: URL.createObjectURL(blob), size: blob.size, w, h });
      }
      convertedRef.current = results;
      setConverted(results);
      setProgress(100); setProgLabel(""); setState("success");
    } catch (e) {
      setError((e as Error).message || "Převod selhal.");
      setState("error");
      setProgress(0); setProgLabel("");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="hj-drop" role="button" tabIndex={0} aria-label="Přetáhněte HEIC soubory"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg></span>
        <span className="dz-title">Přetáhněte HEIC/HEIF fotky z iPhonu</span>
        <span className="dz-hint">nebo klikněte pro výběr · více souborů</span>
        <span className="dz-accept">.heic · .heif · max 40 MB/soubor</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} multiple aria-hidden="true" onChange={onInputChange} />
      </div>

      {files.length > 0 ? (
        <div className="file-list" aria-label="Vybrané soubory">
          {files.map((f, i) => (
            <div className="file-item" key={`${f.name}-${i}`}>
              <span className="fi-meta"><span className="fi-name">{f.name}</span><span className="fi-size">{fmtSize(f.size)}</span></span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="stack-sm" id="hj-work">
        <div>
          <label className="field-label" htmlFor="hj-format">Výstupní formát</label>
          <select id="hj-format" className="select" value={format} onChange={(e) => setFormat(e.target.value as "jpeg" | "png")}>
            <option value="jpeg">JPG (menší soubory)</option>
            <option value="png">PNG (bezztrátové)</option>
          </select>
        </div>
        {format === "jpeg" ? (
          <div className="stack-sm">
            <label className="field-label" htmlFor="hj-quality">Kvalita JPG: <span id="hj-quality-v">{quality}</span> %</label>
            <input type="range" id="hj-quality" min={50} max={100} value={quality} style={{ width: "100%" }} onChange={(e) => setQuality(+e.target.value)} />
          </div>
        ) : null}
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="hj-run" type="button" disabled={!files.length || running} onClick={run}>
            {running ? "Převádím…" : `Převést ${files.length} ${files.length === 1 ? "soubor" : "souborů"}`}
          </button>
          {files.length > 0 ? <button className="btn btn-ghost" id="hj-clear" type="button" onClick={clearAll}>Vyčistit</button> : null}
        </div>
      </div>

      {running && progress > 0 ? (
        <div>
          <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <p className="progress-label" style={{ fontSize: "0.8rem" }}>{progLabel}</p>
        </div>
      ) : null}
      {error ? <p className="error-text" id="hj-error" role="alert">{error}</p> : null}

      {converted.length > 0 ? (
        <div className="file-list" aria-label="Převedené soubory">
          {converted.map((c) => (
            <div className="file-item" key={c.url}>
              <span className="fi-meta"><span className="fi-name">{c.name}</span><span className="fi-size">{c.w}×{c.h} · {fmtSize(c.size)}</span></span>
              <a className="btn btn-primary" href={c.url} download={c.name}>Stáhnout</a>
            </div>
          ))}
        </div>
      ) : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>Díky libheif (WebAssembly) běží převod kompletně lokálně — fotky neopustí váš počítač.</p>
    </div>
  );
}
