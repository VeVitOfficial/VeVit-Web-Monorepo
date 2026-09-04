"use client";

// AI generátor regexu — port legacy ai-regex-generator.js.
// Jeden dotaz na /tools/api/ai/ollama, generuje PCRE/JavaScript regex.
import { useRef } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon } from "@/components/tools/tool-runtime";
import { useAiSingle } from "./_ai-shared";

export default function AiRegexGenerator({ locale }: ToolComponentProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { copied, copy } = useCopy(locale);
  const { running, showOut, errMsg, mdRef, go, copyResult } = useAiSingle(
    "ai-regex-generator", locale, "Generuji…", "Popište, co má regex matchovat.",
  );

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span><span className="muted" style={{ fontSize: "0.875rem" }}>Model: llama3.2</span></div>
      <textarea
        className="textarea" ref={inputRef} rows={5}
        placeholder="Popište, co má regulární výraz matchovat (např. „české telefonní číslo včetně předvolby&quot;)…"
      />
      <button className="btn btn-primary btn-touch" type="button" onClick={() => go(inputRef.current?.value || "")}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3v10" /><path d="m12.67 5.5 8.66 5" /><path d="m12.67 10.5 8.66-5" /><path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z" /></svg>
        <span className="rg-label" style={{ display: running ? "none" : undefined }}>Vygenerovat regex</span>
        <span className="rg-stop" style={{ display: running ? undefined : "none" }}>Zastavit</span>
      </button>
      {errMsg ? (
        <div className="ai-error"><span className="ai-error-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg></span><span>{errMsg}</span></div>
      ) : null}
      {showOut ? (
        <div className="result-card">
          <div className="markdown-body" ref={mdRef} />
          <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => { void copyResult(); void copy(mdRef.current?.innerText || ""); }}>
              {copied ? <Icon name="Check" size={14} /> : <Icon name="Copy" size={14} />} Kopírovat
            </button>
          </div>
        </div>
      ) : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Vygeneruje regex (PCRE/JavaScript). Běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
    </div>
  );
}