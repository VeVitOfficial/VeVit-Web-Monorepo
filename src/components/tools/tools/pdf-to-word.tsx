"use client";

// PDF → Word (DOCX) v prohlížeči: pdf.js 6 ve web workeru, rekonstrukce odstavců, tabulek,
// záhlaví/zápatí a stylů (upravitelný režim) nebo absolutně umístěné prvky (přesný režim),
// OCR skenů přes tesseract.js. Soubor se nikam neodesílá. Návrh a měření: docs/converter/.
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolState, fmtSize, toastSuccess, Icon } from "@/components/tools/tool-runtime";
import { ConverterDropzone, ConverterProgress, ConverterWarnings, ConverterPreview, PrivacyNote, downloadBlob, type PhaseState } from "@/components/tools/converter-ui";
import { DOCX_PDF_I18N, PDF_DOCX_I18N, fmt } from "@/lib/converter/i18n";
import { convertPdfToDocx, ConverterError, type PdfProgress } from "@/lib/converter/pdf-docx-client";
import { convertDocxToPdf, defaultLimits } from "@/lib/converter/docx-pdf-client";
import { deviceProfile, limitsFor } from "@/lib/converter/limits";
import { isCached } from "@/lib/converter/assets";
import { previewFirstPage } from "@/lib/converter/preview";
import type { PdfToDocxResult } from "@/lib/converter/protocol";

const ACCEPT = ".pdf,application/pdf";
const noopSubscribe = () => () => {};
const SERVER_LIMITS = limitsFor(deviceProfile({}));
let clientLimits: ReturnType<typeof defaultLimits> | null = null;

interface Done { docx: Blob; name: string; result: PdfToDocxResult; preview?: string }

export default function PdfToWord({ locale }: ToolComponentProps) {
  const s = PDF_DOCX_I18N[locale] ?? PDF_DOCX_I18N.cs;
  const c = DOCX_PDF_I18N[locale] ?? DOCX_PDF_I18N.cs;
  const { setState } = useToolState("idle");
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const limits = hydrated ? (clientLimits ??= defaultLimits()) : SERVER_LIMITS;
  const weak = hydrated && deviceProfile().weak;
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"editable" | "exact">("editable");
  const [ocr, setOcr] = useState(true);
  const [running, setRunning] = useState(false);
  const [download, setDownload] = useState<PhaseState | null>(null);
  const [work, setWork] = useState<PhaseState | null>(null);
  const [error, setError] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFile(null); setDone(null); setError(""); setDownload(null); setWork(null); setNeedPassword(false); setPassword(""); setRunning(false);
    setState("idle");
  }, [setState]);

  const pick = (f: File) => {
    if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") { setError(c.err_invalid_file); return; }
    if (f.size > limits.maxFileBytes) { setError(fmt(c.err_file_too_large, { limit: fmtSize(limits.maxFileBytes) })); return; }
    setFile(f); setDone(null); setError(""); setNeedPassword(false); setPassword(""); setState("ready");
  };

  const onProgress = (p: PdfProgress) => {
    if (p.phase === "prepare") setWork({ label: s.phase_prepare });
    else if (p.phase === "convert") setWork({ label: fmt(s.phase_page, { page: p.page ?? 1, pages: p.pages ?? "?" }), ratio: p.page && p.pages ? p.page / p.pages : undefined });
    else if (p.phase === "ocr-load") setDownload({ label: s.phase_ocr_load });
    else if (p.phase === "ocr") { setDownload(null); setWork({ label: fmt(s.phase_ocr, { page: p.page ?? 1 }) }); }
  };

  const errorText = (e: unknown): string => {
    if (!(e instanceof ConverterError)) return fmt(c.err_convert_failed, { message: String((e as Error)?.message ?? e) });
    const d = e.detail ?? {};
    switch (e.code) {
      case "file_too_large": return fmt(c.err_file_too_large, { limit: fmtSize(Number(d.limit ?? 0)) });
      case "too_many_pages": return fmt(c.err_too_many_pages, { limit: d.limit ?? "" });
      case "encrypted": return s.err_encrypted;
      case "wrong_password": return c.err_wrong_password;
      case "invalid_file": return c.err_invalid_file.replace("Word (.docx)", "PDF");
      case "out_of_memory": return c.err_out_of_memory;
      case "engine_load": return c.err_engine_load;
      default: return fmt(c.err_convert_failed, { message: e.message });
    }
  };

  const run = async () => {
    if (!file) return;
    setRunning(true); setError(""); setDone(null); setDownload(null); setWork({ label: s.phase_engine });
    setState("processing");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const { docx, result } = await convertPdfToDocx(file, { mode, ocr, password: password || undefined }, onProgress, ac.signal, limits);
      const name = file.name.replace(/\.pdf$/i, "") + ".docx";
      setDone({ docx, name, result });
      setState("success");
      toastSuccess(c.done.replace("PDF", "DOCX"));
      // Náhled jen když je Word → PDF engine už v mezipaměti (jinak na tlačítko, ať nestahujeme bez ptaní).
      const build = await fetch("/tools/assets/js/lib/converter/docx-pdf/build.json", { cache: "no-cache" }).then((r) => r.json()).catch(() => null) as { version: string } | null;
      if (build && (await isCached(`docx-pdf/vevit_docx_pdf_bg.wasm?v=${build.version}`))) void showPreview(docx, name, result);
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
      if (e instanceof ConverterError && (e.code === "encrypted" || e.code === "wrong_password")) setNeedPassword(true);
      setError(errorText(e));
      setState("error");
    } finally {
      setRunning(false); setDownload(null); setWork(null);
      abortRef.current = null;
    }
  };

  const showPreview = async (docx: Blob, name: string, result: PdfToDocxResult) => {
    setPreviewing(true);
    try {
      const { pdf } = await convertDocxToPdf(docx, { tagged: false, pdfa: false });
      const p = await previewFirstPage(pdf);
      setDone({ docx, name, result, preview: p.dataUrl });
    } catch { /* náhled je doplněk */ }
    setPreviewing(false);
  };

  const warnings: string[] = [];
  if (done) {
    const r = done.result;
    const list = (v: number[]) => v.join(", ");
    for (const f of r.fonts) warnings.push(fmt(f.note === "metric" ? s.warn_font_metric : f.note === "name" ? s.warn_font_name : s.warn_font_uncommon, { source: f.source, used: f.used }));
    if (r.ocrPages.length) warnings.push(fmt(s.warn_ocr, { pages: list(r.ocrPages) }));
    if (r.lowConfidencePages.length) warnings.push(fmt(s.warn_low, { pages: list(r.lowConfidencePages) }));
    if (r.scannedWithoutOcr.length) warnings.push(fmt(s.warn_scanned, { pages: list(r.scannedWithoutOcr) }));
    if (r.multiColumnOcrPages?.length) warnings.push(fmt(s.warn_columns, { pages: list(r.multiColumnOcrPages) }));
  }

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }} data-converter="pdf-docx" data-ready={hydrated ? "1" : undefined}>
      <ConverterDropzone title={s.dz_title} hint={c.dz_hint} accept={ACCEPT} acceptLabel={s.dz_accept} file={file} onFile={pick} disabled={running} />
      {weak && <p className="conv-note">{fmt(c.weak_device, { size: fmtSize(limits.maxFileBytes) })}</p>}
      {file && file.size > limits.warnFileBytes && <p className="conv-note">{c.big_file}</p>}

      {file && !done && (
        <>
          <fieldset className="conv-modes" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field-label">{s.mode_label}</legend>
            {(["editable", "exact"] as const).map((m) => (
              <label key={m} className="conv-mode">
                <input type="radio" name="p2w-mode" value={m} checked={mode === m} onChange={() => setMode(m)} disabled={running} data-testid={`mode-${m}`} />
                <span><strong>{m === "editable" ? s.mode_editable : s.mode_exact}</strong><small>{m === "editable" ? s.mode_editable_hint : s.mode_exact_hint}</small></span>
              </label>
            ))}
          </fieldset>
          <div className="conv-options">
            <label className="conv-option">
              <input type="checkbox" checked={ocr} onChange={(e) => setOcr(e.target.checked)} disabled={running} data-testid="ocr" />
              <span>{s.opt_ocr}<small>{s.opt_ocr_hint}</small></span>
            </label>
          </div>
          {needPassword && (
            <div className="stack-sm">
              <label className="field-label" htmlFor="p2w-password">{c.password_label}</label>
              <input id="p2w-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
            </div>
          )}
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-touch" type="button" disabled={running} onClick={run} data-testid="convert">
              <Icon name="File" size={18} /> {needPassword ? c.password_submit : s.convert}
            </button>
            {running && <button className="btn btn-ghost" type="button" onClick={reset}><Icon name="X" size={16} /> {c.cancel}</button>}
          </div>
        </>
      )}

      {running && <ConverterProgress download={download} work={work} />}
      {error && (
        <p className="error-text" role="alert" data-testid="error">
          {error}{needPassword && error === s.err_encrypted ? <> <a href={`/${locale}/tools/pdf-password`}>{s.pdf_password_link}</a>.</> : null}
        </p>
      )}

      {done && (
        <>
          <div className="result-card">
            <span className="rc-ico"><Icon name="Check" size={24} /></span>
            <div className="rc-meta">
              <span className="rc-title">{done.name}</span>
              <span className="rc-sub">{fmt(s.result_meta, { pages: done.result.pages, tables: done.result.tables, size: fmtSize(done.docx.size) })} · {done.result.mode === "editable" ? s.mode_editable : s.mode_exact}</span>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => downloadBlob(done.docx, done.name)} data-testid="download">
              <Icon name="Download" size={16} /> {s.download}
            </button>
          </div>
          <ConverterWarnings title={c.warnings_title} items={warnings} />
          {done.preview ? <ConverterPreview src={done.preview} alt={c.preview_alt} /> : (
            <div className="row">
              <button className="btn btn-ghost" type="button" disabled={previewing} onClick={() => showPreview(done.docx, done.name, done.result)} data-testid="preview-button">
                <Icon name="Eye" size={16} /> {s.preview_show}
              </button>
            </div>
          )}
          <div className="row"><button className="btn btn-ghost" type="button" onClick={reset}>{c.reset}</button></div>
        </>
      )}

      <PrivacyNote licenses={c.licenses}>{c.privacy}</PrivacyNote>
    </div>
  );
}
