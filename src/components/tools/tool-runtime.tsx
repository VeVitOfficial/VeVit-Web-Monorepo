"use client";

// React port sdíleného runtime nástrojů — nahrazuje legacy:
//   tools/assets/js/lib/tool-ui.js  (stavový stroj, dropzone, resultCard, persist)
//   tools/assets/js/lib/toast.js    (toaster + auto-dismiss)
//   tools/assets/js/lib/icons.js    (8 inline SVG ikon + copyCheckPair)
//
// Těžké UMD knihovny (pdf-lib, pdf.js, qrcode-generator, marked, purify, md5,
// ffmpeg…) se v React verzích nástrojů načítají z existujících public URL
// přes loadScript() níže — nepřidáváme žádné npm závislosti. Cesta odpovídá
// legacy umístění: /tools/assets/js/lib/<name>.min.js
//
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale, ToolUiI18n } from "@/components/tools/registry/data";
import { TOOL_UI_I18N, format } from "@/components/tools/registry/data";

// ── Ikonky (port icons.js DEFS) ──────────────────────────────────────────
// Inline SVG, 24×24, stroke=currentColor — stejné cesty jako legacy icons.js.

type IconName = "Copy" | "Check" | "X" | "Upload" | "Download" | "File" | "Eye" | "EyeOff";

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  Copy: (<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>),
  Check: (<path d="M20 6 9 17l-5-5" />),
  X: (<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>),
  Upload: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>),
  Download: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>),
  File: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>),
  Eye: (<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  EyeOff: (<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></>),
};

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

// ── Toast (port toast.js) ────────────────────────────────────────────────

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: string; }

let toastSeq = 0;
const TOASTListeners = new Set<(items: ToastItem[]) => void>();
let TOAST_ITEMS: ToastItem[] = [];

function emitToasts() { for (const l of TOASTListeners) l(TOAST_ITEMS); }

export function toastSuccess(message: string) { pushToast("success", message); }
export function toastError(message: string) { pushToast("error", message); }
export function toastInfo(message: string) { pushToast("info", message); }

function pushToast(kind: ToastKind, message: string) {
  const id = ++toastSeq;
  TOAST_ITEMS = [...TOAST_ITEMS, { id, kind, message }];
  emitToasts();
  const dismissAt = Date.now() + 2400;
  const tick = () => {
    if (Date.now() < dismissAt) { requestAnimationFrame(tick); return; }
    TOAST_ITEMS = TOAST_ITEMS.filter((t) => t.id !== id);
    emitToasts();
  };
  requestAnimationFrame(tick);
}

/** Kontejner toasteru — renderujte jednou na stránce nástroje (v .tool-tool). */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>(TOAST_ITEMS);
  useEffect(() => {
    const l = (next: ToastItem[]) => { Promise.resolve().then(() => setItems(next)); };
    TOASTListeners.add(l);
    return () => { TOASTListeners.delete(l); };
  }, []);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <Icon name={t.kind === "success" ? "Check" : t.kind === "error" ? "X" : "File"} size={18} />
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── i18n helper ──────────────────────────────────────────────────────────

export function useToolUi(locale: Locale) {
  const dict: ToolUiI18n = TOOL_UI_I18N[locale] ?? TOOL_UI_I18N.cs;
  const t = useCallback((key: keyof ToolUiI18n, vars?: Record<string, string | number>) => {
    const v = dict[key] ?? TOOL_UI_I18N.cs[key];
    return vars ? format(v, vars) : v;
  }, [dict]);
  return { t, dict };
}

// ── copyText (port tool-ui.js copyText) ──────────────────────────────────

export async function copyText(text: string, locale: Locale): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toastSuccess(TOOL_UI_I18N[locale]?.copied ?? TOOL_UI_I18N.cs.copied);
    return true;
  } catch {
    toastError(TOOL_UI_I18N[locale]?.copy_failed ?? TOOL_UI_I18N.cs.copy_failed);
    return false;
  }
}

/** useCopy hook — vrátí {copied, copy(text)}. Stav copied drží 2s (port flashCopied). */
export function useCopy(locale: Locale) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = useCallback(async (text: string) => {
    const ok = await copyText(text, locale);
    if (ok) {
      Promise.resolve().then(() => setCopied(true));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
    return ok;
  }, [locale]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { copied, copy };
}

// ── fmtSize (port tool-ui.js fmtSize) ────────────────────────────────────

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── loadScript (port tool-ui.js loadScript) ──────────────────────────────
// Načítá těžké UMD knihovny z public URL (např. /tools/assets/js/lib/pdf-lib.min.js).
// Cache per-src, takže vícenásobné volání neinjektuje stejný script dvakrát.

const scriptCache = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  const cached = scriptCache.get(src);
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") { resolve(); return; }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => { scriptCache.delete(src); reject(new Error(`Failed to load ${src}`)); };
    document.head.appendChild(el);
  });
  scriptCache.set(src, p);
  return p;
}

// ── useToolState (port stavového stroje tool-ui.js) ──────────────────────
// Stavy: idle | ready | processing | success | error (data-tool-state attr).

export type ToolState = "idle" | "ready" | "processing" | "success" | "error";

export function useToolState(initial: ToolState = "idle") {
  const [state, setState] = useState<ToolState>(initial);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.setAttribute("data-tool-state", state);
    el.setAttribute("aria-busy", state === "processing" ? "true" : "false");
  }, [state]);
  return { state, setState, rootRef };
}

// ── Dropzone / file input helpers (port tool-ui.js dropzone) ─────────────

export interface DropzoneOptions {
  accept?: string;        // např. "image/*" nebo ".pdf,application/pdf"
  multiple?: boolean;
  maxSize?: number;       // bytes
  locale: Locale;
}

export interface FilePickResult {
  files: File[];
  errors: string[];
}

const DEFAULT_MAX: Record<string, number> = {
  media: 100 * 1024 * 1024,
  pdf: 100 * 1024 * 1024,
  image: 25 * 1024 * 1024,
  default: 50 * 1024 * 1024,
};

export function maxFor(kind: keyof typeof DEFAULT_MAX | "default"): number {
  return DEFAULT_MAX[kind] ?? DEFAULT_MAX.default;
}

/** Validuje vybrané soubory proti accept/multiple/maxSize a vrátí {files, errors}. */
export function validateFiles(raw: File[] | FileList | null, opts: DropzoneOptions): FilePickResult {
  const dict = TOOL_UI_I18N[opts.locale] ?? TOOL_UI_I18N.cs;
  const out: File[] = [];
  const errors: string[] = [];
  if (!raw) return { files: [], errors: [] };
  const list = Array.from(raw);
  if (!opts.multiple && list.length > 1) list.length = 1;
  const max = opts.maxSize ?? DEFAULT_MAX.default;
  for (const f of list) {
    if (opts.maxSize != null && f.size > max) {
      errors.push(format(dict.file_too_large, { name: f.name, limit: fmtSize(max) }));
      continue;
    }
    out.push(f);
  }
  return { files: out, errors };
}

// ── ResultCard (port tool-ui.js resultCard) ──────────────────────────────

export interface ResultCardProps {
  title: string;
  sub?: string;
  meta?: string;
  downloadHref?: string;
  downloadName?: string;
  onReset?: () => void;
  locale: Locale;
}

export function ResultCard({ title, sub, meta, downloadHref, downloadName, onReset, locale }: ResultCardProps) {
  const dict = TOOL_UI_I18N[locale] ?? TOOL_UI_I18N.cs;
  return (
    <div className="result-card">
      <div className="rc-icon"><Icon name="Check" size={22} /></div>
      <div className="rc-meta">
        {meta ? <div className="rc-meta-line">{meta}</div> : null}
        <div className="rc-title">{title}</div>
        {sub ? <div className="rc-sub">{sub}</div> : null}
      </div>
      <div className="rc-actions">
        {downloadHref ? (
          <a className="btn btn-primary rc-download" href={downloadHref} download={downloadName}>
            <Icon name="Download" size={16} /> <span>{dict.download}</span>
          </a>
        ) : null}
        {onReset ? (
          <button type="button" className="btn btn-ghost rc-reset" onClick={onReset}>
            <Icon name="X" size={16} /> <span>{dict.reset}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── ProgressBar (port tool-ui.js setProgress) ────────────────────────────

export function ProgressBar({ value, label, indeterminate }: { value?: number; label?: string; indeterminate?: boolean }) {
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={indeterminate ? undefined : value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`progress-fill${indeterminate ? " is-indeterminate" : ""}`}
        style={indeterminate ? undefined : { width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
      />
      {label ? <div className="progress-label">{label}</div> : null}
    </div>
  );
}