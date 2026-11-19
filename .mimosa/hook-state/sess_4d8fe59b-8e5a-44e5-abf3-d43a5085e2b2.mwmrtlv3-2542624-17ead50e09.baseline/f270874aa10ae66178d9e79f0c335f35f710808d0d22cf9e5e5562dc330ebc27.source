"use client";

// AI scénář pro YouTube — jeden dotaz na /tools/api/ai/youtube-script (NDJSON stream).
// Markdown se renderuje přes UMD safe-markdown (DOMPurify).
import { useRef } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon } from "@/components/tools/tool-runtime";
import { useAiSingle } from "./_ai-shared";

export default function YoutubeScript({ locale }: ToolComponentProps) {
  const topicRef = useRef<HTMLInputElement | null>(null);
  const lenRef = useRef<HTMLInputElement | null>(null);
  const { copied, copy } = useCopy(locale);
  const { running, showOut, errMsg, mdRef, go, copyResult } = useAiSingle(
    "youtube-script", locale, "Generuji…", "Zadejte téma videa.",
  );

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span></div>
      <input className="input" id="yt-topic" type="text" ref={topicRef} placeholder="Téma videa…" />
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm"><label className="field-label" htmlFor="yt-len">Délka (minuty, volitelné)</label>
          <input className="input" id="yt-len" type="number" min={1} step={1} inputMode="numeric" ref={lenRef} placeholder="např. 10" style={{ maxWidth: "10rem" }} /></div>
      </div>
      <button
        className="btn btn-primary btn-touch" type="button"
        onClick={() => {
          const text = topicRef.current?.value || "";
          const len = lenRef.current?.value.trim() || "";
          const prompt = len ? `Délka videa: ${len} minut\n\n${text}` : text;
          go(text.trim() ? prompt : "");
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><line x1="5" x2="5" y1="12" y2="12" /><line x1="3" x2="5" y1="12" y2="12" /><line x1="19" x2="21" y1="12" y2="12" /><line x1="19" x2="19" y1="12" y2="12" /></svg>
        <span className="yt-label" style={{ display: running ? "none" : undefined }}>Napsat scénář</span>
        <span className="yt-stop" style={{ display: running ? undefined : "none" }}>Zastavit</span>
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
      <p className="muted" style={{ fontSize: "0.8rem" }}>Napíše scénář videa včetně intro, hlavní části a outro. Běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
    </div>
  );
}
