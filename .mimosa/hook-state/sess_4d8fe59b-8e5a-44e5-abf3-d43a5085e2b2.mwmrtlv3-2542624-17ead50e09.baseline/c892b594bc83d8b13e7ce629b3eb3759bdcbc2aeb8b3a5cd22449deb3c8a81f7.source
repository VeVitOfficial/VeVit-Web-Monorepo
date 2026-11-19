"use client";
/* eslint-disable @next/next/no-img-element -- náhled nahraného souboru (object URL) */

// Rozložení převodníků souborů: vlevo pole pro soubor + po nahrání jeho náhled,
// vpravo nabídka cílových formátů (a nastavení, tlačítko, výsledek).
import { useEffect, useState } from "react";
import { fmtSize } from "@/components/tools/tool-runtime";

export function ConvertShell({ left, right, hasFile }: { left: React.ReactNode; right: React.ReactNode; hasFile: boolean }) {
  return (
    <div className={`conv-shell${hasFile ? " has-file" : ""}`}>
      <div className="conv-left stack">{left}</div>
      <aside className="conv-right" aria-label="Cílový formát">{right}</aside>
    </div>
  );
}

export interface FormatOption<K extends string = string> { key: K; label: string; hint?: string }

/** Nabídka cílových formátů (radio karty). */
export function FormatMenu<K extends string>({ title, formats, value, onChange, disabled }: {
  title: string; formats: FormatOption<K>[]; value: K; onChange: (k: K) => void; disabled?: boolean;
}) {
  return (
    <div className="stack-sm">
      <span className="field-label">{title}</span>
      <div className="conv-formats" role="radiogroup" aria-label={title}>
        {formats.map((f) => (
          <button key={f.key} type="button" role="radio" aria-checked={value === f.key} disabled={disabled}
            className={`conv-format${value === f.key ? " is-on" : ""}`} onClick={() => onChange(f.key)}>
            <span className="conv-format-label">{f.label}</span>
            {f.hint ? <span className="conv-format-hint">{f.hint}</span> : null}
            {value === f.key ? (
              <svg className="conv-format-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Náhled nahraného souboru (obrázek / video / audio) s názvem, velikostí a odebráním. */
export function FilePreview({ file, onRemove, removeLabel = "Odebrat soubor" }: { file: File; onRemove: () => void; removeLabel?: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    Promise.resolve().then(() => setUrl(u));
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi|ogv)$/i.test(file.name);
  const isAudio = !isVideo && (file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name));
  const isImage = !isVideo && !isAudio && (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(file.name));
  return (
    <figure className="conv-preview-box">
      <div className="conv-preview-media">
        {!url ? null : isVideo ? <video src={url} controls preload="metadata" />
          : isAudio ? <audio src={url} controls preload="metadata" />
          : isImage ? <img src={url} alt={file.name} /> : null}
      </div>
      <figcaption>
        <span className="fi-meta"><span className="fi-name" title={file.name}>{file.name}</span><span className="fi-size">{fmtSize(file.size)}</span></span>
        <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={removeLabel} onClick={onRemove}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </figcaption>
    </figure>
  );
}
