"use client";

// Odstranění diakritiky (Unicode NFD fold), čistě client-side. Port legacy remove-diacritics.js.
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { copyText, Icon } from "@/components/tools/tool-runtime";

// Odstraní kombinační diakritické značky přes NFD normalizaci (jako legacy strip()).
function strip(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function RemoveDiacritics({ locale }: ToolComponentProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const compute = useCallback(() => {
    setOutput(strip(input));
  }, [input]);

  const onCopy = useCallback(() => {
    if (output) void copyText(output, locale);
  }, [output, locale]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="rd-in">Vstup</label>
        <textarea
          className="textarea"
          id="rd-in"
          rows={5}
          placeholder="Píšete text s diakritikou…"
          value={input}
          onChange={(e) => { setInput(e.target.value); Promise.resolve().then(() => setOutput(strip(e.target.value))); }}
        />
      </div>
      <button className="btn btn-primary" id="rd-run" type="button" onClick={compute}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 16 6-12 6 12" /><path d="M8 12h8" /><path d="m16 20 2 2 4-4" /></svg>
        Odstranit diakritiku
      </button>
      <div className="stack-sm">
        <label className="field-label" htmlFor="rd-out">Výstup</label>
        <textarea className="textarea" id="rd-out" rows={5} readOnly value={output} />
        <button className="btn btn-secondary" id="rd-copy" type="button" disabled={!output} style={{ marginTop: "0.5rem" }} onClick={onCopy}>
          <Icon name="Copy" size={16} /> Kopírovat
        </button>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Používá Unicode NFD normalizaci (odstraní kombinační značky). Běží lokálně.</p>
    </div>
  );
}