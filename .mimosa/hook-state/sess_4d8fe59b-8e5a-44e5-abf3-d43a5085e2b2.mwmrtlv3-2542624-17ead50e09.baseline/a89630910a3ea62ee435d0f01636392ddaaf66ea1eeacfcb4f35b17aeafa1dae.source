"use client";

// JSON formátovač — port legacy json-formatter.js.
// Formátuje/minifikuje JSON, copy + download, editor meta (velikost, kurzor).
import { useCallback, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, fmtSize, toastSuccess } from "@/components/tools/tool-runtime";

function blobSize(s: string): number {
  if (typeof Blob !== "undefined") return new Blob([s]).size;
  return new TextEncoder().encode(s).length;
}

export default function JsonFormatter({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [inputMeta, setInputMeta] = useState("0 B · 1:1");
  const [outputMeta, setOutputMeta] = useState("0 B · 1:1");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const dlUrlRef = useRef<string | null>(null);

  const updateMeta = useCallback(() => {
    const el = inputRef.current;
    if (el) {
      const before = el.value.slice(0, el.selectionStart || 0).split("\n");
      setInputMeta(fmtSize(blobSize(el.value)) + " · " + before.length + ":" + (before[before.length - 1].length + 1));
    } else {
      setInputMeta(fmtSize(blobSize(input)) + " · 1:1");
    }
    setOutputMeta(fmtSize(blobSize(output)) + " · " + (output ? output.split("\n").length : 1) + ":1");
  }, [input, output]);

  const format = (minify: boolean) => {
    const raw = input.trim();
    setErr(null);
    if (!raw) { setOutput(""); return; }
    try {
      const parsed = JSON.parse(raw);
      setOutput(minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
      Promise.resolve().then(updateMeta);
    } catch (e) {
      setOutput("");
      setErr("Neplatný JSON: " + (e as Error).message);
    }
  };

  const onDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    if (dlUrlRef.current) URL.revokeObjectURL(dlUrlRef.current);
    const url = URL.createObjectURL(blob);
    dlUrlRef.current = url;
    const a = document.createElement("a");
    a.href = url; a.download = "formatted.json"; a.click();
  };

  const onCopy = async () => { if (output) { const ok = await copy(output); if (ok) toastSuccess("Zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <div className="row-between">
            <span className="muted" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Vstup (JSON)</span>
            <button className="btn btn-ghost btn-sm" onClick={() => { setInput(""); setOutput(""); setErr(null); Promise.resolve().then(updateMeta); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Vyčistit
            </button>
          </div>
          <textarea className="textarea input-mono" id="jf-input" ref={inputRef} placeholder='{"hello": "world"}' spellCheck={false}
            style={{ minHeight: "320px", background: "rgba(19,19,22,0.5)" }}
            value={input}
            onChange={(e) => { setInput(e.target.value); Promise.resolve().then(updateMeta); }}
            onKeyUp={updateMeta} onClick={updateMeta} />
          <span className="editor-meta" id="jf-input-meta">{inputMeta}</span>
        </div>
        <div className="stack-sm">
          <div className="row-between">
            <span className="muted" style={{ fontSize: "0.875rem", fontWeight: 500 }}>Výstup</span>
            <div className="row">
              <button className="btn btn-ghost btn-sm" type="button" disabled={!output} onClick={onDownload}>
                <Icon name="Download" size={16} /> Stáhnout
              </button>
              <button className="btn btn-ghost btn-sm" type="button" disabled={!output} onClick={onCopy}>
                {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} <span className="label">Kopírovat</span>
              </button>
            </div>
          </div>
          <textarea className="textarea input-mono" id="jf-output" readOnly style={{ minHeight: "320px", background: "rgba(19,19,22,0.3)" }} value={output} />
          <span className="editor-meta" id="jf-output-meta">{outputMeta}</span>
        </div>
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <div className="row">
        <button className="btn btn-primary" onClick={() => format(false)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 5H3" /><path d="M15 12H3" /><path d="M17 19H3" /></svg> Formátovat
        </button>
        <button className="btn btn-secondary" onClick={() => format(true)}>Minifikovat</button>
      </div>
    </div>
  );
}