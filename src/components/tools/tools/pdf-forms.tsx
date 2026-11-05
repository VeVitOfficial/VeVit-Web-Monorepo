"use client";

// Vyplnění formulářů PDF — načte AcroForm pole (pdf-lib getForm().getFields()),
// podle typu pole (text / checkbox / dropdown / radio) vykreslí vstup a po
// vyplnění uloží nové PDF. Některé PDF při čtení polí vyhazují výjimky,
// proto je všechno ošetřené try/catchem. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

/** volně typované pole pdf-lib (PDFField) — volitelné metody podle typu */
interface PdfFieldLoose {
  getName(): string;
  getText?: () => string;
  setText?: (v: string) => void;
  isChecked?: () => boolean;
  check?: () => void;
  uncheck?: () => void;
  getOptions?: () => string[];
  getSelected?: () => string[];
  select?: (v: string) => void;
}
interface PdfForm { getFields(): PdfFieldLoose[]; }
interface PdfDoc {
  getForm(): PdfForm;
  save(): Promise<Uint8Array>;
  load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean; updateMetadata?: boolean }): Promise<PdfDoc>;
}
interface PdfLib { PDFDocument: PdfDocCtor; }
interface PdfDocCtor { load(data: Uint8Array | ArrayBuffer, opts?: { ignoreEncryption?: boolean; updateMetadata?: boolean }): Promise<PdfDoc>; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }

const ACCEPT = ".pdf,application/pdf";

type FieldKind = "text" | "checkbox" | "choice" | "other";

/** UI deskriptor pole (samotné objekty polí držíme mimo state, v refu) */
interface FieldDesc {
  name: string;
  kind: FieldKind;
  options: string[];
  textValue: string;
  checked: boolean;
}

/** typ pole: dle constructor.name (PDFTextField/PDFCheckBox/PDFDropdown/…) s duck-typing fallbackem */
function detectKind(field: PdfFieldLoose): FieldKind {
  const cn: string = field.constructor?.name ?? "";
  if (cn.includes("PDFTextField")) return "text";
  if (cn.includes("PDFCheckBox")) return "checkbox";
  if (cn.includes("PDFDropdown") || cn.includes("PDFRadioGroup") || cn.includes("PDFOptionList")) return "choice";
  // fallback pro minifikovaný build (constructor.name se může zkrátit)
  if (typeof field.setText === "function" && typeof field.getText === "function") return "text";
  if (typeof field.check === "function" && typeof field.uncheck === "function") return "checkbox";
  if (typeof field.select === "function" && typeof field.getOptions === "function") return "choice";
  return "other";
}

function readField(field: PdfFieldLoose, kind: FieldKind): FieldDesc {
  const desc: FieldDesc = { name: "", kind, options: [], textValue: "", checked: false };
  try { desc.name = field.getName(); } catch { desc.name = "(bez názvu)"; }
  try { if (kind === "choice") desc.options = (field.getOptions?.() ?? []).map(String); } catch { desc.options = []; }
  try { if (kind === "text") desc.textValue = field.getText?.() ?? ""; } catch { desc.textValue = ""; }
  try { if (kind === "checkbox") desc.checked = !!field.isChecked?.(); } catch { desc.checked = false; }
  return desc;
}

export default function PdfForms({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FieldDesc[]>([]);
  const [parsing, setParsing] = useState(false);
  const [noFields, setNoFields] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState("");
  /** načtený pdf-lib dokument a objekty polí (mimo React state) */
  const docRef = useRef<PdfDoc | null>(null);
  const fieldObjsRef = useRef<PdfFieldLoose[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setProgress(null); setBlobUrl(""); setFields([]); setNoFields(false);
    docRef.current = null; fieldObjsRef.current = [];
    setState("ready");
    Promise.resolve().then(() => { void parseFields(f); });
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setBlobUrl(""); setFields([]); setNoFields(false); docRef.current = null; fieldObjsRef.current = []; setState("idle"); };

  // načtení PDF a rozbor polí (getFields může u rozbitých PDF vyhodit výjimku)
  const parseFields = async (f: File) => {
    setParsing(true); setError("");
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      const buf = await f.arrayBuffer();
      const doc = await pdfLib().PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
      docRef.current = doc;
      let raw: PdfFieldLoose[] = [];
      try {
        raw = doc.getForm().getFields();
      } catch {
        raw = []; // PDF bez AcroFormu nebo s rozbitým katalogem polí
      }
      const descs: FieldDesc[] = [];
      const objs: PdfFieldLoose[] = [];
      for (const field of raw) {
        try {
          descs.push(readField(field, detectKind(field)));
          objs.push(field);
        } catch { /* pole přeskočíme, ať nerozbije zbytek formuláře */ }
      }
      fieldObjsRef.current = objs;
      setFields(descs);
      setNoFields(descs.length === 0);
    } catch (e) {
      const m = (e as Error).message || "Pole formuláře se nepodařilo načíst.";
      setError(m);
      setNoFields(true);
    } finally { setParsing(false); }
  };

  const setTextValue = (idx: number, v: string) => setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, textValue: v } : f)));
  const setChecked = (idx: number, v: boolean) => setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, checked: v } : f)));
  const setChoice = (idx: number, v: string) => setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, textValue: v } : f)));

  const run = async () => {
    if (!file || !docRef.current) return;
    setError(""); setState("processing"); setProgress({ pct: 30, label: "Zapisuji hodnoty…" });
    try {
      const doc = docRef.current;
      fields.forEach((desc, idx) => {
        const field = fieldObjsRef.current[idx];
        if (!field) return;
        try {
          if (desc.kind === "text") field.setText?.(desc.textValue);
          else if (desc.kind === "checkbox") { if (desc.checked) field.check?.(); else field.uncheck?.(); }
          else if (desc.kind === "choice" && desc.textValue) field.select?.(desc.textValue);
        } catch { /* jednotlivá pole můžou selhat, ostatní se vyplní */ }
      });
      setProgress({ pct: 75, label: "Ukládám vyplněné PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setState("success");
      toastSuccess("Formulář byl vyplněn");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Uložení formuláře selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "vyplneno.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  const filledCount = fields.filter((f) => (f.kind === "checkbox" ? f.checked : f.textValue !== "")).length;

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="fm-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
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

      {parsing && <p className="muted" aria-live="polite">Načítám pole formuláře…</p>}

      {noFields && !parsing && file && (
        <p className="muted" role="status">PDF neobsahuje vyplnitelná pole.</p>
      )}

      {fields.length > 0 && (
        <div className="stack-sm" id="fm-work">
          <p className="muted" style={{ fontSize: "0.85rem" }}>Nalezeno {fields.length} polí ({filledCount} vyplněných). Doplňte hodnoty a uložte.</p>
          <div className="stack-sm">
            {fields.map((f, idx) => (
              <div className="stack-sm" key={`${f.name}-${idx}`}>
                {f.kind === "checkbox" ? (
                  <label className="checkbox-row" htmlFor={`fm-${idx}`}>
                    <input id={`fm-${idx}`} type="checkbox" checked={f.checked} onChange={(e) => setChecked(idx, e.target.checked)} />
                    <span>{f.name}</span>
                  </label>
                ) : (
                  <>
                    <label className="field-label" htmlFor={`fm-${idx}`}>{f.name}</label>
                    {f.kind === "text" && (
                      <input id={`fm-${idx}`} className="input" type="text" value={f.textValue} onChange={(e) => setTextValue(idx, e.target.value)} />
                    )}
                    {f.kind === "choice" && (
                      <select id={`fm-${idx}`} className="select" value={f.textValue} onChange={(e) => setChoice(idx, e.target.value)}>
                        <option value="">— nevybráno —</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {f.kind === "other" && (
                      <input className="input" type="text" value="Tento typ pole nelze vyplnit" readOnly aria-readonly="true" />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="fm-run" type="button" disabled={!file || fields.length === 0 || parsing} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v6h6" /><path d="M4 4h10l6 6v10H4z" /><path d="M8 12h8" /><path d="M8 16h5" /></svg> Uložit vyplněné
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">vyplneno.pdf</span><span className="rc-sub">{fields.length} polí · {filledCount} vyplněno</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Vyplňování formulářů běží lokálně přes pdf-lib.</div>
    </div>
  );
}
