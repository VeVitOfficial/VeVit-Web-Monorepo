"use client";

// URL kodér/dekodér (percent encoding) — port legacy url-encoder.js.
// Používá encodeURIComponent / decodeURIComponent. Čistě client-side.
import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon } from "@/components/tools/tool-runtime";

type Mode = "enc" | "dec";

export default function UrlEncoder({ locale }: ToolComponentProps) {
  const { copied, copy } = useCopy(locale);
  const [mode, setMode] = useState<Mode>("enc");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const compute = useCallback((val: string, m: Mode) => {
    setErr(null);
    if (!val) { setOutput(""); return; }
    try {
      setOutput(m === "enc" ? encodeURIComponent(val) : decodeURIComponent(val));
    } catch {
      setOutput("");
      setErr("Neplatný vstup pro dekódování (špatná sekvence %).");
    }
  }, []);

  const onSwap = () => {
    setInput(output);
    const other: Mode = mode === "enc" ? "dec" : "enc";
    setMode(other);
    compute(output, other);
  };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="seg" role="tablist" aria-label="Režim URL kódování">
        {(["enc", "dec"] as Mode[]).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m}
            className={mode === m ? "active" : ""} onClick={() => { setMode(m); compute(input, m); }}>
            {m === "enc" ? "Kódovat (encode)" : "Dekódovat (decode)"}
          </button>
        ))}
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="ue-in">Vstup</label>
        <textarea className="textarea mono" id="ue-in" rows={4} placeholder="Zadejte text nebo URL…"
          value={input} onChange={(e) => { setInput(e.target.value); compute(e.target.value, mode); }} />
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ue-out">Výstup</label>
        <textarea className="textarea mono" id="ue-out" rows={4} readOnly placeholder="Výstup se zobrazí zde…" value={output} />
        <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          <button className="btn btn-secondary" type="button" disabled={!output} onClick={() => void copy(output)}>
            {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
          </button>
          <button className="btn btn-ghost" type="button" title="Použít výstup jako vstup" onClick={onSwap}>⇅ Prohodit</button>
        </div>
      </div>

      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Používá encodeURIComponent / decodeURIComponent. Běží lokálně v prohlížeči.</p>
    </div>
  );
}