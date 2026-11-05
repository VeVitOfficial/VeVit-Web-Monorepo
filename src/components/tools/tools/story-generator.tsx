"use client";

// AI generátor příběhů — jeden dotaz na /tools/api/ai/story-generator (NDJSON stream).
// Markdown se renderuje přes UMD safe-markdown (DOMPurify).
import { useRef } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon } from "@/components/tools/tool-runtime";
import { useAiSingle } from "./_ai-shared";

const GENRES = ["pohádka", "dobrodružný", "sci-fi", "detektivní", "komedie"] as const;

export default function StoryGenerator({ locale }: ToolComponentProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const genreRef = useRef<HTMLSelectElement | null>(null);
  const { copied, copy } = useCopy(locale);
  const { running, showOut, errMsg, mdRef, go, copyResult } = useAiSingle(
    "story-generator", locale, "Generuji…", "Zadejte zadání příběhu.",
  );

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span></div>
      <textarea
        className="textarea" ref={inputRef} rows={8}
        placeholder="Zadejte zadání příběhu (postavy, prostředí, děj)…"
      />
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm"><label className="field-label" htmlFor="sg-genre">Žánr</label>
          <select className="select" id="sg-genre" ref={genreRef} defaultValue="pohádka">
            {GENRES.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
          </select></div>
      </div>
      <button
        className="btn btn-primary btn-touch" type="button"
        onClick={() => {
          const text = inputRef.current?.value || "";
          const genre = genreRef.current?.value || "pohádka";
          go(text.trim() ? `Žánr: ${genre}\n\n${text}` : "");
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><line x1="5" x2="5" y1="12" y2="12" /><line x1="3" x2="5" y1="12" y2="12" /><line x1="19" x2="21" y1="12" y2="12" /><line x1="19" x2="19" y1="12" y2="12" /></svg>
        <span className="sg-label" style={{ display: running ? "none" : undefined }}>Vygenerovat příběh</span>
        <span className="sg-stop" style={{ display: running ? undefined : "none" }}>Zastavit</span>
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
      <p className="muted" style={{ fontSize: "0.8rem" }}>Vygeneruje příběh podle zadání ve zvoleném žánru. Běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
    </div>
  );
}
