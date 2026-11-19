"use client";
/* eslint-disable @next/next/no-img-element -- miniatury stran jsou dataURL z canvasu */

// Rozdělení PDF — vizuálně: náhledy stran s dělicími čarami mezi nimi (klik čáru zčervená = řez),
// vpravo panel stahování (všechny části v ZIP, jednotlivé části, pole „Rozdělit po stránce“).
// Čistě client-side přes pdf-lib + JSZip (líně načtené z public URL).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, useToolState,
} from "@/components/tools/tool-runtime";
import { PdfLightbox, openPdf, renderPdfPage } from "@/components/tools/file-preview";

type PdfPage = unknown;
interface PdfDoc {
  getPageCount(): number;
  getPageIndices(): number[];
  copyPages(src: PdfDoc, indices: number[]): Promise<PdfPage[]>;
  addPage(p?: PdfPage): PdfPage;
  save(opts?: { useObjectStreams?: boolean }): Promise<Uint8Array>;
}
interface PdfLib {
  PDFDocument: {
    create(): Promise<PdfDoc>;
    load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc>;
  };
}
interface JSZip {
  file(name: string, data: Uint8Array | Blob): unknown;
  generateAsync(opts: { type: string }): Promise<Blob>;
}
function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function jszip(): { new (): JSZip } { return (window as unknown as { JSZip: { new (): JSZip } }).JSZip; }

const ACCEPT = ".pdf,application/pdf";

const baseName = (n: string) => n.replace(/\.pdf$/i, "") || "dokument";
const pagesWord = (n: number) => (n === 1 ? "strana" : n < 5 ? "strany" : "stran");

interface Part { from: number; to: number } // 1-based, včetně
const partsFrom = (cuts: number[], total: number): Part[] => {
  const out: Part[] = []; let start = 1;
  for (const c of [...cuts].sort((a, b) => a - b)) { out.push({ from: start, to: c }); start = c + 1; }
  out.push({ from: start, to: total });
  return out;
};
const partLabel = (p: Part) => (p.from === p.to ? `str. ${p.from}` : `str. ${p.from}–${p.to}`);
const PART_COLORS = ["#3fd496", "#4aa3ff", "#f5a524", "#c084fc", "#ff7a90", "#2dd4bf"];

export default function PdfSplit({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [total, setTotal] = useState(0);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [cuts, setCuts] = useState<number[]>([]);          // „rozdělit za stranou N“
  const [afterText, setAfterText] = useState("");
  const [picked, setPicked] = useState<number[]>([]);       // vybrané části (od 4 částí výš)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);

  const announce = useCallback((msg: string) => {
    const live = document.getElementById("tool-live-status");
    if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20);
  }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => {
    setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n));
  }, [setToolState, announce, t]);

  // Počet stran a miniatury (postupně, ať se stránka nezasekne u dlouhých dokumentů).
  useEffect(() => {
    if (!file) return;
    let off = false;
    (async () => {
      try {
        const doc = await openPdf(file);
        if (off) return;
        setTotal(doc.numPages);
        for (let n = 1; n <= doc.numPages && n <= 400; n++) {
          const url = await renderPdfPage(doc, n, 110, 150, 0.6);
          if (off) return;
          setThumbs((prev) => ({ ...prev, [n]: url }));
        }
      } catch {
        if (!off) { setError("PDF se nepodařilo načíst (je poškozené nebo chráněné heslem)."); setState("error", "PDF se nepodařilo načíst."); }
      }
    })();
    return () => { off = true; };
  }, [file, setState]);

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setTotal(0); setThumbs({}); setCuts([]); setAfterText(""); setPicked([]); setError(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };

  const clearAll = () => { setFile(null); setTotal(0); setThumbs({}); setCuts([]); setAfterText(""); setPicked([]); setError(""); setState("idle"); };

  const toggleCut = (p: number) => { setCuts((c) => (c.includes(p) ? c.filter((x) => x !== p) : [...c, p].sort((a, b) => a - b))); setPicked([]); setError(""); };

  // „Rozdělit po stránce“: číslo se po chvíli (nebo Enterem) automaticky označí jako řez.
  const applyAfter = useCallback((text: string) => {
    const v = text.trim();
    if (!v) return;
    const n = Number(v);
    if (!/^\d+$/.test(v) || n < 1 || n >= total) {
      setError(`Za stranou ${v} nelze dělit — zadejte číslo od 1 do ${Math.max(1, total - 1)}.`);
      return;
    }
    setError("");
    setCuts((c) => (c.includes(n) ? c : [...c, n].sort((a, b) => a - b)));
    setPicked([]); setAfterText("");
  }, [total]);
  useEffect(() => {
    if (!afterText.trim()) return;
    const id = window.setTimeout(() => applyAfter(afterText), 700);
    return () => window.clearTimeout(id);
  }, [afterText, applyAfter]);

  const parts = useMemo(() => (total ? partsFrom(cuts, total) : []), [cuts, total]);
  const partOf = useCallback((page: number) => parts.findIndex((p) => page >= p.from && page <= p.to), [parts]);

  // ── stažení ────────────────────────────────────────────────────────────
  const saveBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const build = async (indices: number[]) => {
    if (!file) return;
    setBusy(true); setError(""); setState("processing");
    try {
      await Promise.all([loadScript("/tools/assets/js/lib/pdf-lib.min.js"), loadScript("/tools/assets/js/lib/jszip.min.js")]);
      const P = pdfLib();
      const src = await P.PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const base = baseName(file.name);
      const files: { name: string; bytes: Uint8Array }[] = [];
      for (const i of indices) {
        const part = parts[i];
        const ndoc = await P.PDFDocument.create();
        const pageIdx: number[] = []; for (let p = part.from; p <= part.to; p++) pageIdx.push(p - 1);
        (await ndoc.copyPages(src, pageIdx)).forEach((pg) => ndoc.addPage(pg));
        files.push({ name: `${base}_cast-${i + 1}_str-${part.from}${part.to > part.from ? `-${part.to}` : ""}.pdf`, bytes: await ndoc.save() });
      }
      if (files.length === 1) {
        saveBlob(new Blob([files[0].bytes as BlobPart], { type: "application/pdf" }), files[0].name);
      } else {
        const zip = new (jszip())();
        files.forEach((f) => zip.file(f.name, f.bytes));
        const blob = await zip.generateAsync({ type: "blob" });
        saveBlob(blob, `${base}_rozdeleno.zip`);
      }
      setState("success");
      toastSuccess(files.length === 1 ? "Část PDF byla stažena" : "Části PDF byly staženy v ZIP");
    } catch (e) {
      const m = (e as Error).message || "Rozdělení selhalo.";
      setError(m); setState("error", m);
    } finally {
      setBusy(false);
    }
  };

  const nParts = parts.length;
  const canSplit = !!file && total > 0 && nParts > 1 && !busy;
  const allIdx = parts.map((_, i) => i);
  const few = nParts >= 2 && nParts <= 3;
  const togglePick = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i].sort((a, b) => a - b)));

  return (
    <div className="stack" style={{ maxWidth: file ? "62rem" : "42rem", margin: "0 auto" }}>
      <div
        className={`dropzone${dragOver ? " dragover" : ""}`} id="ps-drop" role="button" tabIndex={0}
        aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}
      >
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">{file ? file.name : "Přetáhněte sem PDF soubor"}</span>
        <span className="dz-hint">{file ? `${fmtSize(file.size)}${total ? ` · ${total} ${pagesWord(total)}` : ""} · klikněte pro výměnu souboru` : "nebo klikněte pro výběr"}</span>
        <span className="dz-accept">Pouze .pdf · jeden soubor</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} aria-hidden="true" onChange={onInputChange} />
      </div>

      {file && (
        <div className="split-layout">
          <div className="split-pages-wrap">
            <p className="muted split-hint">Klikněte na čáru mezi stránkami (zčervená) a tam se dokument rozdělí. Klik na náhled ho zvětší.</p>
            <div className="split-pages" role="group" aria-label="Stránky dokumentu">
              {Array.from({ length: total }, (_, k) => k + 1).map((n) => {
                const pi = partOf(n);
                const color = PART_COLORS[Math.max(0, pi) % PART_COLORS.length];
                return (
                  <div className="split-cell" key={n}>
                    <button type="button" className="split-page" style={{ ["--pc" as string]: color }} onClick={() => setOpen(n)} aria-label={`Zvětšit stranu ${n}`}>
                      {thumbs[n] ? <img src={thumbs[n]} alt="" draggable={false} /> : <span className="split-ph" />}
                      <span className="split-num">{n}</span>
                    </button>
                    {n < total ? (
                      <button type="button" className={`split-cut${cuts.includes(n) ? " is-on" : ""}`} aria-pressed={cuts.includes(n)}
                        aria-label={`Rozdělit za stranou ${n}`} title={cuts.includes(n) ? `Zrušit dělení za stranou ${n}` : `Rozdělit za stranou ${n}`}
                        onClick={() => toggleCut(n)}>
                        <span className="split-cut-line" />
                        <svg className="split-cut-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" /></svg>
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {!total && !error ? <p className="muted">Načítám náhledy…</p> : null}
            </div>
          </div>

          <aside className="split-panel" aria-label="Stažení">
            <div className="stack-sm">
              <label className="field-label" htmlFor="ps-after">Rozdělit po stránce:</label>
              <input className="input" id="ps-after" type="text" inputMode="numeric" autoComplete="off" placeholder={total > 1 ? `1 – ${total - 1}` : ""}
                value={afterText} onChange={(e) => setAfterText(e.target.value.replace(/[^\d]/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyAfter(afterText); } }} disabled={total < 2} />
              {cuts.length > 0 && (
                <div className="split-chips" aria-label="Místa dělení">
                  {cuts.map((c) => (
                    <span className="split-chip" key={c}>
                      {c}
                      <button type="button" aria-label={`Zrušit dělení za stranou ${c}`} onClick={() => toggleCut(c)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="muted split-count">
              {nParts > 1 ? `${nParts} ${nParts < 5 ? "části" : "částí"}` : "Zatím žádné dělení"}
            </p>

            <button type="button" className="btn btn-primary btn-block" id="ps-zip" disabled={!canSplit} onClick={() => build(allIdx)}>
              {nParts === 2 ? "Stáhnout obě části v .zip" : "Stáhnout všechny části v .zip"}
            </button>

            {few && (
              <div className="split-parts">
                <button type="button" className="btn btn-outline" disabled={!canSplit} onClick={() => build([0])}>Stáhnout první část <small>{partLabel(parts[0])}</small></button>
                <button type="button" className="btn btn-outline" disabled={!canSplit || nParts < 3} onClick={() => build([1])}>
                  Stáhnout prostřední část {nParts === 3 ? <small>{partLabel(parts[1])}</small> : null}
                </button>
                <button type="button" className="btn btn-outline" disabled={!canSplit} onClick={() => build([nParts - 1])}>Stáhnout poslední část <small>{partLabel(parts[nParts - 1])}</small></button>
              </div>
            )}

            {nParts >= 4 && (
              <div className="stack-sm">
                <div className="split-pick" role="group" aria-label="Vyberte části ke stažení">
                  {parts.map((p, i) => (
                    <label className="checkbox-row" key={i}>
                      <input type="checkbox" checked={picked.includes(i)} onChange={() => togglePick(i)} />
                      <span><span className="split-dot" style={{ background: PART_COLORS[i % PART_COLORS.length] }} />Část {i + 1} <small className="muted">{partLabel(p)}</small></span>
                    </label>
                  ))}
                </div>
                <div className="row" style={{ gap: ".4rem", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked(allIdx)}>Vybrat vše</button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!picked.length} onClick={() => setPicked([])}>Zrušit výběr</button>
                </div>
                <button type="button" className="btn btn-secondary btn-block" disabled={!canSplit || !picked.length} onClick={() => build(picked)}>
                  {picked.length > 1 ? `Stáhnout vybrané (${picked.length}) v .zip` : picked.length === 1 ? `Stáhnout část ${picked[0] + 1}` : "Vyberte části ke stažení"}
                </button>
              </div>
            )}

            <button className="btn btn-ghost btn-block" id="ps-clear" type="button" onClick={clearAll}>Vyčistit</button>
          </aside>
        </div>
      )}

      {error && <p className="error-text" role="alert">{error}</p>}
      {busy && <p className="progress-label" role="status">Vytvářím PDF…</p>}
      {file && open != null ? <PdfLightbox file={file} initialPage={open} locale={locale} onClose={() => setOpen(null)} /> : null}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> PDF se rozděluje lokálně přes pdf-lib a JSZip. Soubor se neodesílá na server.</div>
    </div>
  );
}
