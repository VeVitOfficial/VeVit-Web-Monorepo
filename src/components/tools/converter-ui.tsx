"use client";

// Společné UI převodníků Word ⇄ PDF: dropzone, průběh (zvlášť stahování enginu a převod),
// varování, náhled první strany a poznámka o soukromí. Třídy z src/styles/tools.css.
import { useRef, useState, type ReactNode } from "react";
import { Icon, fmtSize } from "@/components/tools/tool-runtime";

export function ConverterDropzone({ title, hint, accept, acceptLabel, file, onFile, disabled }: {
  title: string; hint: string; accept: string; acceptLabel: string; file: File | null; onFile: (f: File) => void; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const pick = (f: File | null | undefined) => { if (f && !disabled) onFile(f); };
  return (
    <div
      className={`dropzone${over ? " dragover" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={title}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!disabled) inputRef.current?.click(); } }}
      onDragEnter={(e) => { e.preventDefault(); depth.current += 1; setOver(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); depth.current -= 1; if (depth.current <= 0) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); depth.current = 0; setOver(false); pick(e.dataTransfer.files?.[0]); }}
    >
      <span className="dz-ico"><Icon name="Upload" size={28} /></span>
      <span className="dz-title">{file ? file.name : title}</span>
      <span className="dz-hint">{file ? fmtSize(file.size) : hint}</span>
      <span className="dz-accept">{acceptLabel}</span>
      <input ref={inputRef} type="file" className="hidden" accept={accept} aria-hidden="true" tabIndex={-1}
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

export interface PhaseState { label: string; ratio?: number }

/** Dva řádky průběhu: stahování (engine/fonty/OCR) a vlastní převod. */
export function ConverterProgress({ download, work }: { download?: PhaseState | null; work?: PhaseState | null }) {
  const bar = (p: PhaseState, testid: string) => (
    <div className="conv-progress" data-testid={testid}>
      <div className="progress-track" role="progressbar" aria-valuenow={p.ratio == null ? undefined : Math.round(p.ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={p.label}>
        <div className={`progress-fill${p.ratio == null ? " is-indeterminate" : ""}`} style={p.ratio == null ? undefined : { width: `${Math.round(p.ratio * 100)}%` }} />
      </div>
      <p className="progress-label">{p.label}</p>
    </div>
  );
  return <div className="stack-sm" aria-live="polite">{download ? bar(download, "progress-download") : null}{work ? bar(work, "progress-work") : null}</div>;
}

export function ConverterWarnings({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="conv-warnings" role="status">
      <p className="conv-warnings-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg> {title}</p>
      <ul>{items.map((w, i) => <li key={i} data-testid="warning">{w}</li>)}</ul>
    </div>
  );
}

export function ConverterPreview({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- data: URL náhledu, Image optimalizace nedává smysl
  return <figure className="conv-preview"><img src={src} alt={alt} data-testid="preview" /></figure>;
}

export function PrivacyNote({ children, licenses }: { children: ReactNode; licenses?: string }) {
  return (
    <div className="privacy-note" data-testid="privacy-note">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
      <span>{children}{licenses ? <> · <a href="/tools/assets/js/lib/converter/LICENSES.txt" target="_blank" rel="noopener">{licenses}</a></> : null}</span>
    </div>
  );
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
