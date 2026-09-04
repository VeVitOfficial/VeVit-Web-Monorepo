"use client";

// Regex tester — port legacy regex-tester.js.
// Live přepočet, zvýraznění shod pomocí ⦅⦆ (textContent — bezpečné vůči XSS).
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

export default function RegexTester({ locale }: ToolComponentProps) {
  void locale;
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");

  const result = useMemo(() => {
    if (!pattern || !text) return null;
    let regex: RegExp;
    try { regex = new RegExp(pattern, flags); }
    catch (e) { return { error: (e as Error).message }; }
    const matches: RegExpMatchArray[] = [];
    try {
      const m = text.matchAll(regex);
      for (const it of m) matches.push(it);
    } catch { /* matchAll vyžaduje flag g — fallback */ }
    const highlighted = text.replace(regex, (match) => "⦅" + match + "⦆");
    return { highlighted, count: matches.length };
  }, [pattern, flags, text]);

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="row" style={{ gap: "0.75rem", alignItems: "flex-end" }}>
        <div className="stack-sm" style={{ flex: 1 }}>
          <label className="field-label" htmlFor="rx-pattern">Regulární výraz</label>
          <input className="input input-mono" id="rx-pattern" placeholder="např. \d+" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        </div>
        <div className="stack-sm" style={{ width: "6rem" }}>
          <label className="field-label" htmlFor="rx-flags">Flags</label>
          <input className="input input-mono" id="rx-flags" placeholder="gi" value={flags} onChange={(e) => setFlags(e.target.value)} />
        </div>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="rx-text">Testovací text</label>
        <textarea className="textarea input-mono" id="rx-text" placeholder="Vložte text k testování..."
          style={{ minHeight: "120px", background: "rgba(19,19,22,0.5)" }}
          value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      {result && "error" in result ? <p className="error-text">{result.error}</p> : null}

      {result && !("error" in result) ? (
        <div className="stack-sm" id="rx-out-wrap">
          <div className="regex-out input-mono" id="rx-highlight">{result.highlighted}</div>
          <div style={{ fontSize: "0.875rem" }}>
            <span style={{ fontWeight: 500 }}>Nalezeno shod: </span><span id="rx-count">{result.count}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}