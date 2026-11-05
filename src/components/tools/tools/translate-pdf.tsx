"use client";

// Překlad PDF — textová vrstva přes pdf.js + sdílený layout engine, stránky
// ohraničené značkami "=== STRANA N ===" se pošlou na /tools/api/ai/translate-pdf
// (NDJSON stream), překlad se složí zpět do PDF (pdf-lib, Helvetica). Překlad
// běží na serveru (AI) — posílá se jen text, ne celý soubor.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";
import {
  buildPageBlocks,
  type PdfTextItem, type PageBlocks,
} from "@/lib/pdf-text-layout";

interface PdfjsTextItem { str: string; transform: number[]; width: number; height: number; fontName?: string; }
interface PdfjsTextContent { items: PdfjsTextItem[]; }
interface PdfjsPage { getTextContent(): Promise<PdfjsTextContent>; getViewport(opts: { scale: number }): { width: number; height: number }; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }
interface PdfFont { widthOfTextAtSize(text: string, size: number): number; }
interface PdfPage { drawText(text: string, opts: unknown): void; }
interface PdfDoc {
  embedFont(font: unknown): Promise<PdfFont>;
  addPage(size: [number, number]): PdfPage;
  save(): Promise<Uint8Array>;
}
interface PdfLib {
  PDFDocument: { create(): Promise<PdfDoc>; load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean }): Promise<PdfDoc> };
  rgb: (r: number, g: number, b: number) => unknown;
  StandardFonts: { Helvetica: unknown };
}

function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }
function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = ".pdf,application/pdf";
const LANGS = ["čeština", "angličtina", "němčina", "francouzština", "španělština", "italština", "ruština"];
const CHAR_LIMIT = 15000;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const LINE_W = 500;
const LINE_H = 14;
const FONT_SIZE = 11;

/**
 * Záloha pro standardní písmo Helvetica (WinAnsi): diakritika mimo jeho sadu
 * (č, ě, ů, cyrilice…) se zjednoduší / nahradí otazníkem, ať překlad PDF
 * nezhaví celý drawText.
 */
function winAnsiSafe(s: string): string {
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\xA1-\xFF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u20AC]/g, "?");
}

/** Zalomení textu na šířku (pdf-lib neumí wrap — měříme font.widthOfTextAtSize). */
function wrapText(text: string, font: PdfFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const words = raw.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let line = "";
    for (const w of words) {
      const next = line ? line + " " + w : w;
      let fits = false;
      try { fits = font.widthOfTextAtSize(next, size) <= maxWidth; } catch { fits = font.widthOfTextAtSize(winAnsiSafe(next), size) <= maxWidth; }
      if (fits || !line) line = fits ? next : w;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

export default function TranslatePdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState("čeština");
  const [source, setSource] = useState("auto");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null;
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); if (ctrlRef.current) ctrlRef.current.abort(); };
  }, [rootRef, blobUrl]);
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
    setFile(f); setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setInfo(""); setDone(false); setBlobUrl(""); setState("idle"); };

  // Bloky stránky → text se strukturními značkami (odstavce \n\n, tabulky taby).
  const pageToText = (blocks: PageBlocks): string => {
    const parts: string[] = [];
    for (const b of blocks.blocks) {
      if (b.kind === "table") parts.push(b.rows.map((r) => r.map((c) => c ?? "").join("\t")).join("\n"));
      else if (b.text.trim()) parts.push(b.text.trim());
    }
    return parts.join("\n\n");
  };

  const run = async () => {
    if (!file) return;
    setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("processing"); setProgress({ pct: 5, label: "Načítám pdf.js…" });
    try {
      await ensurePdfjs();
      setProgress({ pct: 10, label: "Extrahuji text…" });
      const buf = await file.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = doc.numPages;
      const pageTexts: string[] = [];
      for (let i = 1; i <= total; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });
        const items: PdfTextItem[] = content.items
          .filter((it) => typeof it.str === "string" && it.str.trim())
          .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], width: it.width, height: it.height, fontName: it.fontName }));
        const blocks = buildPageBlocks({ items, width: viewport.width, height: viewport.height });
        pageTexts.push(`=== STRANA ${i} ===\n${pageToText(blocks)}`.trimEnd());
      }
      const text = pageTexts.join("\n\n");
      const charCount = text.length;
      if (!charCount) {
        setProgress(null);
        setInfo("PDF neobsahuje textovou vrstvu (pravděpodobně je to sken).");
        setState("error", "PDF neobsahuje textovou vrstvu.");
        return;
      }
      if (charCount > CHAR_LIMIT) {
        setProgress(null);
        const m = "Dokument je příliš dlouhý pro překlad (limit ~15 000 znaků). Rozdělte PDF.";
        setError(m); setState("error", m);
        return;
      }

      // Překlad přes AI server (NDJSON stream) — reader loop jako v _ai-shared aiRun.
      setProgress({ pct: 25, label: "Překládám… 0 znaků" });
      const controller = new AbortController();
      ctrlRef.current = controller;
      const src = source === "auto" ? "originálního jazyka" : source;
      const prompt = `Přelož z ${src} do ${target}:\n\n${text}`;
      const res = await fetch("/tools/api/ai/translate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tool: "translate-pdf", stream: true }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(d.message || d.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf2 = "";
      let full = "";
      let lastReported = 0;
      for (;;) {
        const ch = await reader.read();
        if (ch.done) break;
        buf2 += dec.decode(ch.value, { stream: true });
        const lines = buf2.split("\n");
        buf2 = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const p = JSON.parse(line) as { response?: string; text?: string; done?: boolean };
            const piece = p.response || p.text;
            if (piece) full += piece;
            if (full.length - lastReported > 400) {
              lastReported = full.length;
              setProgress({ pct: 25 + Math.min(45, Math.round((45 * full.length) / charCount)), label: `Překládám… ${full.length} znaků` });
            }
            if (p.done) break;
          } catch { /* ignoruj nevalidní řádek */ }
        }
      }
      ctrlRef.current = null;
      const translated = full.trim();
      if (!translated) throw new Error("Server nevrátil překlad. Zkuste to znovu.");

      // Sestavení PDF z překladu (pdf-lib, stránky dle značek === STRANA N ===)
      setProgress({ pct: 75, label: "Sestavuji PDF…" });
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const P = pdfLib();
      const pdf = await P.PDFDocument.create();
      const font = await pdf.embedFont(P.StandardFonts.Helvetica);
      const black = P.rgb(0, 0, 0);
      const sections = translated.split(/===\s*STRANA\s*\d+\s*===/i);
      const pages = sections.length > 1 ? sections.slice(1) : [translated];
      let replacedChars = false;
      pages.forEach((section) => {
        const page = pdf.addPage([PAGE_W, PAGE_H]);
        let y = PAGE_H - MARGIN;
        for (const line of wrapText(section.trim(), font, FONT_SIZE, LINE_W)) {
          if (y < MARGIN) break; // dlouhá stránka se ořízne (bez zalomení uprostřed sekce)
          try {
            page.drawText(line, { x: MARGIN, y, size: FONT_SIZE, font, color: black, lineHeight: LINE_H });
          } catch {
            replacedChars = true;
            page.drawText(winAnsiSafe(line), { x: MARGIN, y, size: FONT_SIZE, font, color: black, lineHeight: LINE_H });
          }
          y -= LINE_H;
        }
      });
      if (replacedChars) setInfo("Pozor: některé znaky překladu neumí standardní písmo Helvetica (WinAnsi) zobrazit — byly nahrazeny zjednodušenými.");
      setProgress({ pct: 95, label: "Ukládám PDF…" });
      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("Překlad byl uložen do PDF");
    } catch (e) {
      ctrlRef.current = null;
      setProgress(null);
      const err = e as Error;
      if (err?.name === "AbortError") return;
      const m = err.message || "Překlad selhal.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "prelozeno.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span></div>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="tp-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem PDF soubor</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .pdf · text do 15 000 znaků</span>
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

      <div className="stack-sm" id="tp-work">
        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="tp-src">Přeložit z</label>
            <select id="tp-src" className="select" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="auto">Automaticky (detekovat)</option>
              {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="tp-tgt">Přeložit do</label>
            <select id="tp-tgt" className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
              {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <p className="muted" id="tp-info" style={{ fontSize: "0.85rem" }}>{info || "Překlad probíhá přes AI (server) — textová vrstva, zachová struktura odstavců."}</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="tp-run" type="button" disabled={!file} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg> Přeložit PDF
          </button>
        </div>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">prelozeno.pdf</span><span className="rc-sub">{source === "auto" ? "auto" : source} → {target}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Extrakce textu i sestavení PDF běží lokálně; na AI server se posílá jen extrahovaný text (bez obrázků), nikoli celý soubor.</div>
    </div>
  );
}
