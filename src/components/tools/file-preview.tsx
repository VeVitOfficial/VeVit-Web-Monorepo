"use client";
/* eslint-disable @next/next/no-img-element -- náhledy z dataURL / object URL nahraných souborů, optimalizace obrázků nedává smysl */

// Sdílené prvky pro nástroje se seznamem souborů:
//  • SortableFileList — seznam s přetažením (drag & drop) pro změnu pořadí, přidáním souborů puštěním
//    na seznam a náhledem u každého souboru; klik na náhled otevře velké okno.
//  • Lightbox — vyskakovací velký náhled (PDF listuje stránky, obrázky/video/audio procházejí soubory),
//    zavře se klikem mimo, Esc nebo křížkem; šipky vlevo/vpravo listují.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/components/tools/registry/data";
import { fmtSize, loadScript, useToolUi } from "@/components/tools/tool-runtime";

// ── pdf.js (líně z public URL, stejně jako ostatní PDF nástroje) ───────────
interface PdfjsViewport { width: number; height: number }
interface PdfjsPage {
  getViewport(o: { scale: number }): PdfjsViewport;
  render(o: { canvasContext: CanvasRenderingContext2D; viewport: PdfjsViewport }): { promise: Promise<void> };
}
export interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage> }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(o: { data: Uint8Array }): { promise: Promise<PdfjsDoc> } }

export async function loadPdfjs(): Promise<PdfjsLib> {
  const w = window as unknown as { pdfjsLib?: PdfjsLib };
  if (!w.pdfjsLib) {
    await loadScript("/tools/assets/js/lib/pdf.min.js");
    w.pdfjsLib!.GlobalWorkerOptions.workerSrc = "/tools/assets/js/lib/pdf.worker.min.js";
  }
  return w.pdfjsLib!;
}

const docCache = new WeakMap<File, Promise<PdfjsDoc>>();
/** Otevře PDF (výsledek se pro stejný File drží v paměti, aby se nenačítalo znovu). */
export function openPdf(file: File): Promise<PdfjsDoc> {
  let p = docCache.get(file);
  if (!p) {
    p = (async () => {
      const lib = await loadPdfjs();
      return lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    })();
    p.catch(() => docCache.delete(file));
    docCache.set(file, p);
  }
  return p;
}

/** Vykreslí stranu PDF do dataURL tak, aby se vešla do dané šířky/výšky (CSS px). */
export async function renderPdfPage(doc: PdfjsDoc, n: number, fitW: number, fitH: number, quality = 0.92): Promise<string> {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.min(fitW / base.width, fitH / base.height) * dpr;
  const vp = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return canvas.toDataURL("image/jpeg", quality);
}

export const fileKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
export interface PdfMeta { pages: number; thumb?: string }

/** Počet stran a miniatura první strany pro každé PDF v seznamu (běží na pozadí, chyby tiše). */
export function usePdfMeta(files: File[]): Record<string, PdfMeta> {
  const [meta, setMeta] = useState<Record<string, PdfMeta>>({});
  const done = useRef(new Set<string>());
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const f of files) {
        if (!isPdf(f)) continue;
        const key = fileKey(f);
        if (done.current.has(key)) continue;
        done.current.add(key);
        try {
          const doc = await openPdf(f);
          let thumb: string | undefined;
          try { thumb = await renderPdfPage(doc, 1, 120, 160, 0.6); } catch { /* miniatura je volitelná */ }
          if (!cancelled) setMeta((prev) => ({ ...prev, [key]: { pages: doc.numPages, thumb } }));
          else done.current.delete(key);
        } catch { /* náhledy jsou doplňkové */ }
      }
    })();
    return () => { cancelled = true; };
  }, [files]);
  return meta;
}

export const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
export const isImage = (f: File) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif|svg|heic)$/i.test(f.name);
const isVideo = (f: File) => f.type.startsWith("video/");
const isAudio = (f: File) => f.type.startsWith("audio/");
export type PreviewKind = "pdf" | "image" | "video" | "audio" | null;
export const previewKind = (f: File): PreviewKind => isPdf(f) ? "pdf" : isImage(f) ? "image" : isVideo(f) ? "video" : isAudio(f) ? "audio" : null;

/** Object URL pro každý soubor (zůstává stejná při přeřazení, uvolní se při odebrání / odmontování). */
export function useObjectUrls(files: File[]): Map<File, string> {
  const [urls, setUrls] = useState<Map<File, string>>(() => new Map());
  const cache = useRef(new Map<File, string>());
  useEffect(() => {
    const c = cache.current;
    for (const f of files) if (!c.has(f)) c.set(f, URL.createObjectURL(f));
    for (const [f, u] of c) if (!files.includes(f)) { URL.revokeObjectURL(u); c.delete(f); }
    const snapshot = new Map(c);
    Promise.resolve().then(() => setUrls(snapshot));
  }, [files]);
  useEffect(() => { const c = cache.current; return () => { for (const u of c.values()) URL.revokeObjectURL(u); c.clear(); }; }, []);
  return urls;
}

// ── Texty ────────────────────────────────────────────────────────────────
const LB = {
  cs: { close: "Zavřít náhled", prev: "Předchozí", next: "Další", preview: "Zobrazit velký náhled", page: "Strana", dragHint: "Přetažením změníte pořadí", dropHere: "Pusťte soubory sem", loading: "Načítám…", failed: "Náhled se nepodařilo zobrazit." },
  en: { close: "Close preview", prev: "Previous", next: "Next", preview: "Show large preview", page: "Page", dragHint: "Drag to reorder", dropHere: "Drop files here", loading: "Loading…", failed: "Preview could not be shown." },
};
const lb = (locale: Locale) => (locale === "cs" || locale === "sk" ? LB.cs : LB.en);

// ── Lightbox ─────────────────────────────────────────────────────────────
export function Lightbox({ onClose, onPrev, onNext, caption, label, locale, children }: {
  onClose: () => void; onPrev?: () => void; onNext?: () => void; caption?: string; label: string; locale: Locale; children: React.ReactNode;
}) {
  const s = lb(locale);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowLeft" && onPrev) { e.preventDefault(); onPrev(); }
      else if (e.key === "ArrowRight" && onNext) { e.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose, onPrev, onNext]);
  return createPortal(
    <div className="vv-lb" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button ref={closeRef} type="button" className="vv-lb-close" aria-label={s.close} onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
      {onPrev ? (
        <button type="button" className="vv-lb-nav prev" aria-label={s.prev} onClick={onPrev}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      ) : null}
      <div className="vv-lb-stage" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>{children}</div>
      {onNext ? (
        <button type="button" className="vv-lb-nav next" aria-label={s.next} onClick={onNext}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      ) : null}
      {caption ? <div className="vv-lb-caption">{caption}</div> : null}
    </div>,
    document.body,
  );
}

/** Velký náhled PDF — šipky listují stranami. */
export function PdfLightbox({ file, initialPage = 1, onClose, locale }: { file: File; initialPage?: number; onClose: () => void; locale: Locale }) {
  const s = lb(locale);
  const [doc, setDoc] = useState<PdfjsDoc | null>(null);
  const [page, setPage] = useState(initialPage);
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let off = false;
    openPdf(file).then((d) => { if (!off) setDoc(d); }, () => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, [file]);
  useEffect(() => {
    if (!doc) return;
    let off = false;
    renderPdfPage(doc, page, Math.min(window.innerWidth * 0.82, 900), window.innerHeight * 0.8)
      .then((u) => { if (!off) setSrc(u); }, () => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, [doc, page]);
  const total = doc?.numPages ?? 0;
  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(total, p + 1)), [total]);
  return (
    <Lightbox locale={locale} label={file.name} onClose={onClose}
      onPrev={page > 1 ? prev : undefined} onNext={page < total ? next : undefined}
      caption={`${file.name}${total ? ` · ${s.page} ${page} / ${total}` : ""}`}>
      {failed ? <p className="vv-lb-msg">{s.failed}</p>
        : src ? <img className="vv-lb-media" src={src} alt={`${file.name} — ${s.page} ${page}`} />
        : <p className="vv-lb-msg">{s.loading}</p>}
    </Lightbox>
  );
}

/** Velký náhled souborů jednoho druhu (obrázky / video / audio) — šipky přecházejí mezi soubory. */
export function MediaLightbox({ files, urls, index, onIndex, onClose, locale }: {
  files: File[]; urls: Map<File, string>; index: number; onIndex: (i: number) => void; onClose: () => void; locale: Locale;
}) {
  const f = files[index];
  const url = f ? urls.get(f) : undefined;
  const kind = f ? previewKind(f) : null;
  const prev = useCallback(() => onIndex(index - 1), [index, onIndex]);
  const next = useCallback(() => onIndex(index + 1), [index, onIndex]);
  if (!f) return null;
  return (
    <Lightbox locale={locale} label={f.name} onClose={onClose}
      onPrev={index > 0 ? prev : undefined} onNext={index < files.length - 1 ? next : undefined}
      caption={`${f.name}${files.length > 1 ? ` · ${index + 1} / ${files.length}` : ""}`}>
      {!url ? <p className="vv-lb-msg">{lb(locale).loading}</p>
        : kind === "video" ? <video key={url} className="vv-lb-media" src={url} controls autoPlay />
        : kind === "audio" ? <audio key={url} src={url} controls autoPlay />
        : <img key={url} className="vv-lb-media" src={url} alt={f.name} />}
    </Lightbox>
  );
}

// ── Seznam s přetažením ──────────────────────────────────────────────────
const idOf = (() => { let n = 0; const m = new WeakMap<object, number>(); return (o: object) => { let v = m.get(o); if (v == null) { v = ++n; m.set(o, v); } return v; }; })();
const DRAG_TYPE = "application/x-vv-reorder";

const IconSvg = ({ children, size = 16 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export function SortableFileList({ files, onChange, onAddFiles, locale, ariaLabel, reorder = true, id }: {
  files: File[];
  onChange: (next: File[]) => void;
  /** soubory puštěné z plochy přímo na seznam */
  onAddFiles?: (files: File[]) => void;
  locale: Locale;
  ariaLabel?: string;
  reorder?: boolean;
  id?: string;
}) {
  const { t } = useToolUi(locale);
  const s = lb(locale);
  const meta = usePdfMeta(files);
  const urls = useObjectUrls(files);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<{ i: number; after: boolean } | null>(null);
  const [filesOver, setFilesOver] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const moveTo = useCallback((from: number, to: number) => {
    if (from === to || to < 0 || to > files.length) return;
    const next = files.slice();
    const [m] = next.splice(from, 1);
    next.splice(from < to ? to - 1 : to, 0, m);
    onChange(next);
  }, [files, onChange]);

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");
  const internal = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes(DRAG_TYPE);

  // Pro obrázky/video/audio listují šipky mezi soubory téhož druhu.
  const openFile = open != null ? files[open] : undefined;
  const openKind = openFile ? previewKind(openFile) : null;
  const sameKind = useMemo(() => (openKind && openKind !== "pdf" ? files.filter((f) => previewKind(f) === openKind) : []), [files, openKind]);

  return (
    <>
      <div
        className={`file-list sortable-list${filesOver ? " files-over" : ""}`}
        id={id}
        aria-label={ariaLabel}
        onDragOver={(e) => { if (onAddFiles && hasFiles(e)) { e.preventDefault(); e.stopPropagation(); setFilesOver(true); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFilesOver(false); }}
        onDrop={(e) => {
          setFilesOver(false);
          if (onAddFiles && hasFiles(e)) { e.preventDefault(); e.stopPropagation(); onAddFiles(Array.from(e.dataTransfer.files)); }
        }}
      >
        {files.map((f, i) => {
          const kind = previewKind(f);
          const m = meta[fileKey(f)];
          const thumb = kind === "pdf" ? m?.thumb : kind === "image" ? urls.get(f) : undefined;
          const extra = kind === "pdf" && m ? ` · ${m.pages} ${m.pages === 1 ? "strana" : m.pages < 5 ? "strany" : "stran"}` : "";
          const cls = ["file-item", "sortable-item", drag === i ? "is-dragging" : "", over?.i === i ? (over.after ? "drop-after" : "drop-before") : ""].filter(Boolean).join(" ");
          return (
            <div
              className={cls}
              key={idOf(f)}
              draggable={reorder}
              onDragStart={(e) => { if (!reorder) return; setDrag(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData(DRAG_TYPE, String(i)); }}
              onDragOver={(e) => {
                if (!internal(e) || drag == null) return;
                e.preventDefault(); e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                const after = e.clientY > r.top + r.height / 2;
                setOver((o) => (o && o.i === i && o.after === after ? o : { i, after }));
              }}
              onDrop={(e) => {
                if (!internal(e) || drag == null) return;
                e.preventDefault(); e.stopPropagation();
                const after = over?.i === i ? over.after : false;
                moveTo(drag, after ? i + 1 : i);
                setDrag(null); setOver(null);
              }}
              onDragEnd={() => { setDrag(null); setOver(null); }}
            >
              {reorder ? <span className="fi-grip" title={s.dragHint} aria-hidden="true"><IconSvg><circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" /></IconSvg></span> : null}
              {kind ? (
                <button type="button" className="fi-ico fi-ico-thumb fi-preview" aria-label={`${s.preview}: ${f.name}`} title={s.preview} onClick={() => setOpen(i)} draggable={false}>
                  {thumb ? <img src={thumb} alt="" draggable={false} />
                    : <IconSvg size={20}>{kind === "video" ? <><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m22 8-6 4 6 4z" /></> : kind === "audio" ? <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></> : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>}</IconSvg>}
                  <span className="fi-zoom"><IconSvg size={14}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6" /><path d="M8 11h6" /></IconSvg></span>
                </button>
              ) : (
                <span className="fi-ico"><IconSvg size={18}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></IconSvg></span>
              )}
              <span className="fi-meta">
                <span className="fi-name">{f.name}</span>
                <span className="fi-size">{fmtSize(f.size)}{extra}</span>
              </span>
              {reorder ? (
                <>
                  <button type="button" className="btn btn-ghost btn-icon-sm fi-move" aria-label={t("move_up", { name: f.name })} disabled={i === 0} onClick={() => moveTo(i, i - 1)}>
                    <IconSvg><path d="m18 15-6-6-6 6" /></IconSvg>
                  </button>
                  <button type="button" className="btn btn-ghost btn-icon-sm fi-move" aria-label={t("move_down", { name: f.name })} disabled={i === files.length - 1} onClick={() => moveTo(i, i + 2)}>
                    <IconSvg><path d="m6 9 6 6 6-6" /></IconSvg>
                  </button>
                </>
              ) : null}
              <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: f.name })} onClick={() => onChange(files.filter((_, k) => k !== i))}>
                <IconSvg><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconSvg>
              </button>
            </div>
          );
        })}
        {filesOver ? <div className="sortable-drop-note">{s.dropHere}</div> : null}
      </div>
      {openFile && openKind === "pdf" ? <PdfLightbox file={openFile} locale={locale} onClose={() => setOpen(null)} /> : null}
      {openFile && openKind && openKind !== "pdf" ? (
        <MediaLightbox files={sameKind} urls={urls} index={sameKind.indexOf(openFile)} locale={locale} onClose={() => setOpen(null)}
          onIndex={(k) => { const target = sameKind[k]; if (target) setOpen(files.indexOf(target)); }} />
      ) : null}
    </>
  );
}
