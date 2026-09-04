"use client";

// Base64 kodér/dekodér (text + soubor) — port legacy base64-tool.js.
// UTF-8 safe přes TextEncoder/Decoder. Čistě client-side.
import { useCallback, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, fmtSize } from "@/components/tools/tool-runtime";

type Mode = "enc" | "dec" | "file";

export default function Base64Tool({ locale }: ToolComponentProps) {
  const { copied, copy } = useCopy(locale);
  const [mode, setMode] = useState<Mode>("enc");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState("Vstup (text)");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UTF-8 safe base64
  const encodeB64 = useCallback((str: string) => {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }, []);
  const decodeB64 = useCallback((str: string) => {
    const bin = atob(str.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }, []);

  const compute = useCallback((val: string, m: Mode) => {
    setErr(null);
    if (m === "file") return;
    try {
      if (m === "enc") setOutput(val ? encodeB64(val) : "");
      else setOutput(val.trim() ? decodeB64(val) : "");
    } catch {
      setOutput("");
      setErr("Neplatný Base64 vstup.");
    }
  }, [encodeB64, decodeB64]);

  const onMode = (m: Mode) => {
    setMode(m);
    setErr(null);
    setOutput("");
    setFileLabel(m === "enc" ? "Vstup (text)" : m === "dec" ? "Vstup (Base64)" : "Vstup (text)");
  };

  const onFile = (f: File) => {
    setErr(null);
    if (f.size > 2 * 1024 * 1024) { setErr("Soubor je příliš velký (max 2 MB)."); return; }
    const r = new FileReader();
    r.onload = () => {
      const bytes = new Uint8Array(r.result as ArrayBuffer);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      setOutput(btoa(bin));
    };
    r.onerror = () => setErr("Čtení souboru selhalo.");
    r.readAsArrayBuffer(f);
  };

  void fmtSize;

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="seg" role="tablist" aria-label="Režim Base64">
        {(["enc", "dec", "file"] as Mode[]).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m}
            className={mode === m ? "active" : ""} onClick={() => onMode(m)}>
            {m === "enc" ? "Text → Base64" : m === "dec" ? "Base64 → text" : "Soubor → Base64"}
          </button>
        ))}
      </div>

      {mode !== "file" ? (
        <div id="b64-text">
          <div className="stack-sm">
            <label className="field-label" htmlFor="b64-in">{fileLabel}</label>
            <textarea className="textarea mono" id="b64-in" rows={4} placeholder="Zadejte text…"
              value={input} onChange={(e) => { setInput(e.target.value); compute(e.target.value, mode); }} />
          </div>
        </div>
      ) : (
        <div id="b64-file">
          <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
            <span className="dz-ico"><Icon name="Upload" size={28} /></span>
            <span className="dz-title">Přetáhněte soubor</span>
            <span className="dz-hint">nebo klikněte pro výběr</span>
            <span className="dz-accept">Max ~2 MB (velké soubory zpomalí prohlížeč)</span>
          </div>
          <input ref={fileInputRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </div>
      )}

      <div className="stack-sm">
        <label className="field-label" htmlFor="b64-out">Výstup</label>
        <textarea className="textarea mono" id="b64-out" rows={5} readOnly placeholder="Výstup se zobrazí zde…" value={output} />
        <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          <button className="btn btn-secondary" type="button" disabled={!output} onClick={() => void copy(output)}>
            {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => { setInput(""); setOutput(""); setErr(null); }}>Vyčistit</button>
        </div>
      </div>

      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Vše běží lokálně v prohlížeči. UTF-8 bezpečné (TextEncoder/Decoder).</p>
    </div>
  );
}