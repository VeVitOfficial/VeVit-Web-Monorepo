"use client";

// Word (DOCX) → PDF v prohlížeči: engine vetext (Rust → WASM) ve web workeru, sazba podobná
// Wordu, text zůstává textem, fonty vložené i metricky kompatibilní náhrady, volitelně PDF/A-2b.
// Soubor se nikam neodesílá. Návrh a měření: docs/converter/.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolState, fmtSize, toastSuccess, Icon } from "@/components/tools/tool-runtime";
import { ConverterDropzone, ConverterProgress, ConverterWarnings, ConverterPreview, PrivacyNote, downloadBlob, type PhaseState } from "@/components/tools/converter-ui";
import { DOCX_PDF_I18N, fmt, type DocxPdfStrings } from "@/lib/converter/i18n";
import { convertDocxToPdf, ConverterError, defaultLimits, localFontsSupported, readLocalFonts, requestedFamilies, type ProgressEvent } from "@/lib/converter/docx-pdf-client";
import { deviceProfile, limitsFor } from "@/lib/converter/limits";
import { isCached } from "@/lib/converter/assets";
import { previewFirstPage } from "@/lib/converter/preview";
import type { DocxToPdfResult } from "@/lib/converter/protocol";

const ACCEPT = ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const noopSubscribe = () => () => {};
const SERVER_LIMITS = limitsFor(deviceProfile({}));
let clientLimits: ReturnType<typeof defaultLimits> | null = null;
const CLIENT = {
  limits: () => (clientLimits ??= defaultLimits()),
  profile: () => deviceProfile(),
};

interface Done { pdf: Blob; name: string; result: DocxToPdfResult; preview?: string; pages?: number }

function errorText(s: DocxPdfStrings, e: unknown): string {
  if (!(e instanceof ConverterError)) return fmt(s.err_convert_failed, { message: String((e as Error)?.message ?? e) });
  const d = e.detail ?? {};
  switch (e.code) {
    case "file_too_large": return fmt(s.err_file_too_large, { limit: fmtSize(Number(d.limit ?? 0)) });
    case "zip_bomb": return s.err_zip_bomb;
    case "encrypted": return s.err_encrypted;
    case "wrong_password": return s.err_wrong_password;
    case "invalid_file": return s.err_invalid_file;
    case "out_of_memory": return s.err_out_of_memory;
    case "engine_load": return s.err_engine_load;
    case "too_many_pages": return fmt(s.err_too_many_pages, { limit: d.limit ?? "" });
    default: return /validat|PDF\/A|archival/i.test(e.message) ? fmt(s.err_pdfa, { message: e.message }) : fmt(s.err_convert_failed, { message: e.message });
  }
}

export default function WordToPdf({ locale }: ToolComponentProps) {
  const s = DOCX_PDF_I18N[locale] ?? DOCX_PDF_I18N.cs;
  const { setState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pdfa, setPdfa] = useState(false);
  const [useLocal, setUseLocal] = useState(false);
  const [running, setRunning] = useState(false);
  const [download, setDownload] = useState<PhaseState | null>(null);
  const [work, setWork] = useState<PhaseState | null>(null);
  const [error, setError] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [engineCached, setEngineCached] = useState<boolean | null>(null);
  const [engineSize, setEngineSize] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  // Zařízení zná jen prohlížeč: na serveru (a při hydrataci) výchozí hodnoty.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const limits = hydrated ? CLIENT.limits() : SERVER_LIMITS;
  const weak = hydrated && CLIENT.profile().weak;
  const canLocal = hydrated && localFontsSupported();

  useEffect(() => {
    rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null;
    fetch("/tools/assets/js/lib/converter/docx-pdf/build.json", { cache: "no-cache" })
      .then((r) => r.json())
      .then(async (b: { version: string; brotliBytes?: number }) => {
        setEngineSize(b.brotliBytes ?? 0);
        setEngineCached(await isCached(`docx-pdf/vevit_docx_pdf_bg.wasm?v=${b.version}`));
      })
      .catch(() => setEngineCached(null));
  }, [rootRef]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setFile(null); setDone(null); setError(""); setDownload(null); setWork(null); setNeedPassword(false); setPassword(""); setRunning(false);
    setState("idle");
  }, [setState]);

  const pick = (f: File) => {
    if (!/\.docx$/i.test(f.name) && f.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") { setError(s.err_invalid_file); return; }
    if (f.size > limits.maxFileBytes) { setError(fmt(s.err_file_too_large, { limit: fmtSize(limits.maxFileBytes) })); return; }
    setFile(f); setDone(null); setError(""); setNeedPassword(false); setPassword(""); setState("ready");
  };

  const onProgress = (e: ProgressEvent) => {
    if (e.phase === "download" && e.download) {
      const d = e.download;
      const label = d.label === "engine"
        ? (d.cached ? s.phase_engine_cached : fmt(s.phase_engine, { loaded: fmtSize(d.loaded), total: fmtSize(d.total || engineSize) }))
        : fmt(s.phase_fonts, { loaded: fmtSize(d.loaded), total: fmtSize(d.total) });
      setDownload({ label, ratio: d.total ? d.loaded / d.total : undefined });
    } else if (e.phase === "prepare") setWork({ label: s.phase_prepare });
    else if (e.phase === "convert") setWork({ label: s.phase_convert });
    else if (e.phase === "finish") setWork({ label: s.phase_finish });
  };

  const run = async () => {
    if (!file) return;
    setRunning(true); setError(""); setDone(null); setDownload(null); setWork({ label: s.phase_prepare });
    setState("processing");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const localFonts = useLocal && canLocal ? await readLocalFonts(await requestedFamilies(file)) : [];
      const { pdf, result } = await convertDocxToPdf(file, { tagged: true, pdfa, password: password || undefined, localFonts }, onProgress, ac.signal, limits);
      const name = file.name.replace(/\.docx$/i, "") + ".pdf";
      let preview: string | undefined, pages: number | undefined;
      try { const p = await previewFirstPage(pdf); preview = p.dataUrl; pages = p.pages; } catch { /* náhled je doplněk, převod se povedl */ }
      setDone({ pdf, name, result, preview, pages });
      setEngineCached(true);
      setState("success");
      toastSuccess(s.done);
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
      if (e instanceof ConverterError && (e.code === "encrypted" || e.code === "wrong_password")) setNeedPassword(true);
      setError(errorText(s, e));
      setState("error");
    } finally {
      setRunning(false); setDownload(null); setWork(null);
      abortRef.current = null;
    }
  };

  const warnings: string[] = [];
  if (done) {
    const r = done.result;
    for (const w of r.fontWarnings) warnings.push(fmt(w.metricCompatible ? s.warn_font_metric : s.warn_font, { requested: w.requested, used: w.used }));
    if (r.embeddedFonts.length) warnings.push(fmt(s.warn_embedded, { list: r.embeddedFonts.join(", ") }));
    if (r.localFonts.length) warnings.push(fmt(s.warn_local, { list: r.localFonts.join(", ") }));
    if (r.macrosIgnored) warnings.push(s.warn_macros);
  }

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }} data-converter="docx-pdf" data-ready={hydrated ? "1" : undefined}>
      <ConverterDropzone title={s.dz_title} hint={s.dz_hint} accept={ACCEPT} acceptLabel={s.dz_accept} file={file} onFile={pick} disabled={running} />

      {weak && <p className="conv-note">{fmt(s.weak_device, { size: fmtSize(limits.maxFileBytes) })}</p>}
      {engineCached === false && engineSize > 0 && <p className="conv-note" data-testid="first-use">{fmt(s.first_use, { size: fmtSize(engineSize) })}</p>}
      {file && file.size > limits.warnFileBytes && <p className="conv-note">{s.big_file}</p>}

      {file && !done && (
        <>
          <div className="conv-options">
            <label className="conv-option">
              <input type="checkbox" checked={pdfa} onChange={(e) => setPdfa(e.target.checked)} disabled={running} data-testid="pdfa" />
              <span>{s.opt_pdfa}<small>{s.opt_pdfa_hint}</small></span>
            </label>
            {canLocal && (
              <label className="conv-option">
                <input type="checkbox" checked={useLocal} onChange={(e) => setUseLocal(e.target.checked)} disabled={running} data-testid="local-fonts" />
                <span>{s.opt_local_fonts}<small>{s.opt_local_fonts_hint}</small></span>
              </label>
            )}
          </div>
          {needPassword && (
            <div className="stack-sm">
              <label className="field-label" htmlFor="w2p-password">{s.password_label}</label>
              <input id="w2p-password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
            </div>
          )}
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-touch" type="button" disabled={running} onClick={run} data-testid="convert">
              <Icon name="File" size={18} /> {needPassword ? s.password_submit : s.convert}
            </button>
            {running && <button className="btn btn-ghost" type="button" onClick={reset}><Icon name="X" size={16} /> {s.cancel}</button>}
          </div>
        </>
      )}

      {running && <ConverterProgress download={download} work={work} />}
      {error && <p className="error-text" role="alert" data-testid="error">{error}</p>}

      {done && (
        <>
          <div className="result-card">
            <span className="rc-ico"><Icon name="Check" size={24} /></span>
            <div className="rc-meta">
              <span className="rc-title">{done.name}</span>
              <span className="rc-sub">{fmt(s.result_meta, { pages: done.pages ?? "?", size: fmtSize(done.pdf.size) })}{done.result.pdfa ? " · PDF/A-2b" : ""}</span>
            </div>
            <button className="btn btn-primary" type="button" onClick={() => downloadBlob(done.pdf, done.name)} data-testid="download">
              <Icon name="Download" size={16} /> {s.download}
            </button>
          </div>
          <ConverterWarnings title={s.warnings_title} items={warnings} />
          {done.preview && <ConverterPreview src={done.preview} alt={s.preview_alt} />}
          <div className="row"><button className="btn btn-ghost" type="button" onClick={reset}>{s.reset}</button></div>
        </>
      )}

      <PrivacyNote>{s.privacy}</PrivacyNote>
    </div>
  );
}
