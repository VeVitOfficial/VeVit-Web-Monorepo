"use client";

// Ochrana PDF heslem — čistě client-side přes qpdf.js (emscripten build QPDF,
// běží ve web workeru). Dřív to byl server-side placeholder (vyžadoval by
// shell_exec/qpdf na VPS, což na Vercelu nejde) — qpdf.js soubor nikdy
// neopustí prohlížeč, stejně jako pdf-merge. Vendorováno v
// public/tools/assets/js/lib/qpdf.js (+ qpdf/ podadresář s workerem a wasm).
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState } from "@/components/tools/tool-runtime";

const QPDF_BASE = "/tools/assets/js/lib/qpdf/";

interface QpdfInstance {
  save(filename: string, arrayBuffer: ArrayBuffer, callback: (err: Error | null) => void): void;
  load(filename: string, callback: (err: Error | null, arrayBuffer?: ArrayBuffer) => void): void;
  execute(args: string[], callback: (err: Error | null) => void): void;
  terminate(): void;
}
interface QpdfCtor {
  (options: { path?: string; ready: (qpdf: QpdfInstance) => void; logger?: (msg: string) => void }): void;
  path?: string;
  encrypt(options: {
    arrayBuffer: ArrayBuffer;
    userPassword?: string;
    ownerPassword?: string;
    keyLength?: number;
    callback: (err: Error | null, out?: ArrayBuffer) => void;
  }): void;
}
function qpdfLib(): QpdfCtor { return (window as unknown as { QPDF: QpdfCtor }).QPDF; }

async function ensureQpdf(): Promise<QpdfCtor> {
  await loadScript("/tools/assets/js/lib/qpdf.js");
  const QPDF = qpdfLib();
  QPDF.path = QPDF_BASE;
  return QPDF;
}

/** Nízkoúrovňová dekrypce — QPDF.encrypt() má knihovna jako helper, remove ne, takže sestavíme stejným vzorem. */
function qpdfDecrypt(QPDF: QpdfCtor, arrayBuffer: ArrayBuffer, password: string, callback: (err: Error | null, out?: ArrayBuffer) => void): void {
  let done = false;
  const finish = (err: Error | null, out?: ArrayBuffer) => { if (!done) { done = true; callback(err, out); } };
  QPDF({
    path: QPDF_BASE,
    ready(qpdf) {
      qpdf.save("input.pdf", arrayBuffer, (err) => { if (err) finish(err); });
      qpdf.execute(["--decrypt", "--password=" + password, "--", "input.pdf", "output.pdf"], (err) => { if (err) finish(err); });
      qpdf.load("output.pdf", (err, out) => finish(err, out));
    },
  });
}

const ACCEPT = ".pdf,application/pdf";
type Mode = "set" | "remove";

export default function PdfPassword({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("set");
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [removePassword, setRemovePassword] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<{ name: string; sub: string } | null>(null);
  const blobUrlRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }; }, [rootRef]);

  const announce = useCallback((msg: string) => {
    const live = document.getElementById("tool-live-status");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(() => { live.textContent = msg; }, 20);
  }, []);

  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => {
    setToolState(s);
    announce(msg ?? t(`state_${s}` as keyof ToolUiI18n));
  }, [setToolState, announce, t]);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setResult(null); setState("ready");
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0;
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const clearAll = () => {
    setFile(null); setError(""); setResult(null); setUserPassword(""); setOwnerPassword(""); setRemovePassword("");
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = ""; }
    setState("idle");
  };

  const run = async () => {
    if (!file) return;
    if (mode === "set" && userPassword.trim() === "" && ownerPassword.trim() === "") {
      setError("Zadejte alespoň jedno heslo (uživatelské nebo vlastnické)."); return;
    }
    if (mode === "remove" && removePassword.trim() === "") {
      setError("Zadejte aktuální heslo PDF."); return;
    }
    setError(""); setResult(null); setRunning(true);
    setState("processing");
    try {
      const QPDF = await ensureQpdf();
      const buf = await file.arrayBuffer();
      const out = await new Promise<ArrayBuffer>((resolve, reject) => {
        if (mode === "set") {
          QPDF.encrypt({
            arrayBuffer: buf,
            userPassword: userPassword.trim(),
            ownerPassword: ownerPassword.trim() || userPassword.trim(),
            keyLength: 256,
            callback: (err, arrayBuffer) => (err || !arrayBuffer ? reject(err ?? new Error("Šifrování selhalo.")) : resolve(arrayBuffer)),
          });
        } else {
          qpdfDecrypt(QPDF, buf, removePassword.trim(), (err, arrayBuffer) =>
            (err || !arrayBuffer ? reject(err ?? new Error("Odstranění hesla selhalo. Zkontrolujte heslo.")) : resolve(arrayBuffer)));
        }
      });
      const blob = new Blob([out], { type: "application/pdf" });
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(blob);
      const outName = file.name.replace(/\.pdf$/i, "") + (mode === "set" ? "-zabezpeceno.pdf" : "-bez-hesla.pdf");
      setResult({ name: outName, sub: fmtSize(blob.size) });
      setRunning(false);
      setState("success");
      toastSuccess(mode === "set" ? "Heslo bylo nastaveno" : "Heslo bylo odstraněno");
    } catch (e) {
      setRunning(false);
      const msg = (e as Error)?.message || (mode === "set" ? "Šifrování selhalo." : "Zkontrolujte heslo — odstranění se nezdařilo.");
      setError(msg);
      setState("error", msg);
    }
  };

  const download = () => {
    if (blobUrlRef.current && result) {
      const a = document.createElement("a");
      a.href = blobUrlRef.current; a.download = result.name;
      document.body.appendChild(a); a.click(); a.remove();
    }
  };

  const dzTitle = "Přetáhněte sem PDF soubor";
  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div
        className={`dropzone${dragOver ? " dragover" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={dzTitle}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}
      >
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
        <span className="dz-title">{file ? file.name : dzTitle}</span>
        <span className="dz-hint">{file ? fmtSize(file.size) : "nebo klikněte pro výběr"}</span>
        <span className="dz-accept">Pouze .pdf · jeden soubor</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} aria-hidden="true" onChange={onInputChange} />
      </div>

      {file && (
        <>
          <div className="row" role="radiogroup" aria-label="Operace" style={{ flexWrap: "wrap" }}>
            <button type="button" className={`btn ${mode === "set" ? "btn-primary" : "btn-ghost"}`} role="radio" aria-checked={mode === "set"} onClick={() => { setMode("set"); setError(""); }}>
              Nastavit heslo
            </button>
            <button type="button" className={`btn ${mode === "remove" ? "btn-primary" : "btn-ghost"}`} role="radio" aria-checked={mode === "remove"} onClick={() => { setMode("remove"); setError(""); }}>
              Odstranit heslo
            </button>
          </div>

          {mode === "set" ? (
            <div className="stack" style={{ gap: "0.5rem" }}>
              <div className="stack-sm">
                <label className="field-label" htmlFor="pp-user-pw">Uživatelské heslo (pro otevření)</label>
                <input id="pp-user-pw" type="password" className="input" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="stack-sm">
                <label className="field-label" htmlFor="pp-owner-pw">Vlastnické heslo (volitelné — pro úpravy/tisk; jinak stejné jako výše)</label>
                <input id="pp-owner-pw" type="password" className="input" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} autoComplete="new-password" />
              </div>
            </div>
          ) : (
            <div className="stack-sm">
              <label className="field-label" htmlFor="pp-remove-pw">Aktuální heslo PDF</label>
              <input id="pp-remove-pw" type="password" className="input" value={removePassword} onChange={(e) => setRemovePassword(e.target.value)} autoComplete="current-password" />
            </div>
          )}

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-touch" type="button" disabled={running} onClick={run}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> {mode === "set" ? "Zašifrovat PDF" : "Odstranit heslo"}
            </button>
            <button className="btn btn-ghost" type="button" disabled={running} onClick={clearAll}>
              <Icon name="X" size={16} /> Vyčistit
            </button>
          </div>
        </>
      )}

      {running && (
        <>
          <div className="progress-track" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: "50%" }} /></div>
          <p className="progress-label">Zpracovávám PDF…</p>
        </>
      )}
      {error && <p className="error-text" role="alert">{error}</p>}

      {result && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
          <div className="rc-meta">
            <span className="rc-title">{result.name}</span>
            <span className="rc-sub">{result.sub}</span>
          </div>
          <button className="btn btn-primary" type="button" onClick={download}>
            <Icon name="Download" size={16} /> Stáhnout
          </button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> PDF se zpracovává lokálně v prohlížeči přes qpdf.js (WASM). Soubor ani heslo se nikdy neodesílají na server.
      </div>
    </div>
  );
}
