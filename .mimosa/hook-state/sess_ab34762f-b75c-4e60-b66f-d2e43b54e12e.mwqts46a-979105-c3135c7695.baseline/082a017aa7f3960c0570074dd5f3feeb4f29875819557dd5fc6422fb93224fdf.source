"use client";

// PDF na Markdown — pdf.js extrakce textu → sdílený layout engine
// (src/lib/pdf-text-layout.ts) → markdown (nadpisy dle poměru velikosti písma,
// centrované odstavce přes <div align="center">, tabulky jako pipe tabulky).
// Čistě client-side, port stejného pipeline jako pdf-to-word.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState, useCopy,
} from "@/components/tools/tool-runtime";
import {
  buildPageBlocks,
  type PdfTextItem, type PageBlocks, type TextBlock,
} from "@/lib/pdf-text-layout";

interface PdfjsTextItem { str: string; transform: number[]; width: number; height: number; fontName?: string; }
interface PdfjsTextContent { items: PdfjsTextItem[]; }
interface PdfjsPage { getTextContent(): Promise<PdfjsTextContent>; getViewport(opts: { scale: number }): { width: number; height: number }; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }

function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }

const ACCEPT = ".pdf,application/pdf";

/** Escape pipe a změtu řádků v buňce — markdown tabulka je jednořádková. */
function mdCell(s: string): string {
  return (s ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

/** Bloky jedné stránky → markdown. bodySize = medián velikostí textu celého dokumentu. */
function blocksToMarkdown(blocks: TextBlock[], bodySize: number): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.kind === "table") {
      const rows = b.rows.map((r) => r.map(mdCell));
      const cols = Math.max(...rows.map((r) => r.length), 1);
      const norm = rows.map((r) => Array.from({ length: cols }, (_, i) => r[i] ?? ""));
      out.push("| " + norm[0].join(" | ") + " |");
      out.push("| " + Array.from({ length: cols }, () => "---").join(" | ") + " |");
      for (const r of norm.slice(1)) out.push("| " + r.join(" | ") + " |");
      out.push("");
    } else if (b.kind === "heading") {
      // úroveň nadpisu podle poměru k velikosti těla dokumentu
      const ratio = b.fontSize / bodySize;
      const level = ratio >= 1.7 ? 2 : ratio >= 1.4 ? 3 : 4;
      const hashes = "#".repeat(level);
      const text = b.text.replace(/\|/g, "\\|");
      out.push(b.align === "center" ? `<div align="center">\n\n${hashes} ${text}\n\n</div>` : `${hashes} ${text}`);
      out.push("");
    } else {
      const text = b.text.replace(/\|/g, "\\|");
      out.push(b.align === "center" ? `<div align="center">\n\n${text}\n\n</div>` : text);
      out.push("");
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export default function PdfToMarkdown({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [done, setDone] = useState(false);
  const blobUrlRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const copy = useCopy(locale);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const ensurePdfjs = async () => {
    if ((window as unknown as { pdfjsLib?: unknown }).pdfjsLib) return;
    await loadScript("/tools/assets/js/lib/pdf.min.js");
    pdfjs().GlobalWorkerOptions.workerSrc = "/tools/assets/js/lib/pdf.worker.min.js";
  };

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setInfo(""); setMarkdown(""); setDone(false); if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; } setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setInfo(""); setMarkdown(""); setDone(false); if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; } setState("idle"); };

  const run = async () => {
    if (!file) return;
    setError(""); setInfo(""); setMarkdown(""); setDone(false); setState("processing"); setProgress({ pct: 5, label: "Načítám pdf.js…" });
    try {
      await ensurePdfjs();
      setProgress({ pct: 15, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = doc.numPages;
      const pages: PageBlocks[] = [];
      for (let i = 1; i <= total; i++) {
        setProgress({ pct: 15 + Math.round((70 * i) / total), label: `Extrahuji stranu ${i}/${total}` });
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });
        const items: PdfTextItem[] = content.items
          .filter((it) => typeof it.str === "string" && it.str.trim())
          .map((it) => ({
            str: it.str,
            x: it.transform[4],
            y: it.transform[5],
            width: it.width,
            height: it.height,
            fontName: it.fontName,
          }));
        pages.push(buildPageBlocks({ items, width: viewport.width, height: viewport.height }));
      }
      const blockCount = pages.reduce((n, p) => n + p.blocks.length, 0);
      if (!blockCount) {
        setInfo("PDF neobsahuje textovou vrstvu (pravděpodobně je to sken). Převod nelze provést.");
        setProgress(null); setState("error", "PDF neobsahuje textovou vrstvu.");
        return;
      }
      // medián velikosti písma přes celý dokument → reference pro úrovně nadpisů
      const sizes = pages.flatMap((p) => p.blocks).filter((b) => b.kind !== "table").map((b) => b.fontSize).sort((a, b) => a - b);
      const bodySize = sizes[Math.floor(sizes.length / 2)] || 11;
      setProgress({ pct: 92, label: "Sestavuji Markdown…" });
      const md = pages.map((p) => blocksToMarkdown(p.blocks, bodySize)).join("\n\n---\n\n");
      setMarkdown(md);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("PDF bylo převedeno na Markdown");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Převod na Markdown selhal.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrlRef.current) { const a = document.createElement("a"); a.href = blobUrlRef.current; a.download = "prevedeno.md"; document.body.appendChild(a); a.click(); a.remove(); } };
  const onCopy = async () => { await copy.copy(markdown); };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="pm-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem PDF soubor</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .pdf · jeden soubor</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} aria-hidden="true" onChange={onInputChange} />
      </div>

      {file && (
        <div className="file-list" aria-label="Vybraný soubor">
          <div className="file-item">
            <span className="fi-ico"><Icon name="File" size={18} /></span>
            <span className="fi-meta"><span className="fi-name">{file.name}</span><span className="fi-size">{fmtSize(file.size)}</span></span>
            <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: file.name })} onClick={clearAll}><Icon name="X" size={16} /></button>
          </div>
        </div>
      )}

      <div className="stack-sm" id="pm-work">
        <p className="muted" id="pm-info" style={{ fontSize: "0.85rem" }}>{info || "Nástroj převede textovou vrstvu PDF do Markdownu — nadpisy (##/###), centrované odstavce a tabulky. Skeny bez textové vrstvy nelze převést."}</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="pm-run" type="button" disabled={!file} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v6h6" /><path d="M4 4h10l6 6v10H4z" /><path d="M8 14h8" /><path d="M8 18h5" /></svg> Převést na Markdown
          </button>
        </div>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && (
        <div className="stack-sm">
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-ghost" id="pm-copy" type="button" onClick={onCopy}>
              {copy.copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} {copy.copied ? t("copied") : t("copy")}
            </button>
            <button className="btn btn-primary" id="pm-dl" type="button" onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout .md
            </button>
          </div>
          <textarea id="pm-out" className="textarea" readOnly value={markdown} aria-label={t("result_ready")} rows={14} style={{ fontFamily: "var(--mono, monospace)", fontSize: "0.85rem" }} />
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Převod běží lokálně přes pdf.js — soubor neopustí váš počítač. Přenáší se text, struktura odstavců a tabulky, ne obrázky.</div>
    </div>
  );
}
