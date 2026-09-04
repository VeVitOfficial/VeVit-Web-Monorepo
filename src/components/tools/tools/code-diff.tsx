"use client";

// Code diff — port legacy code-diff.js.
// Porovnání dvou textů po řádcích (jsdiff, lazy-load). Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { loadScript } from "@/components/tools/tool-runtime";

interface DiffPart { value: string; added?: boolean; removed?: boolean; }

export default function CodeDiff({ locale }: ToolComponentProps) {
  void locale;
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [parts, setParts] = useState<DiffPart[] | null>(null);
  const [stat, setStat] = useState("");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const libReadyRef = useRef(false);

  const ensureLib = useCallback(async () => {
    if (libReadyRef.current) return true;
    try {
      await loadScript("/tools/assets/js/lib/diff.min.js");
      libReadyRef.current = true;
      return true;
    } catch {
      setLoadErr("Knihovnu diff se nepodařilo načíst.");
      return false;
    }
  }, []);

  const compute = useCallback(async () => {
    if (!left && !right) { setParts(null); setStat(""); return; }
    const ok = await ensureLib();
    if (!ok) return;
    const Diff = (window as unknown as { Diff?: { diffLines: (a: string, b: string) => DiffPart[] } }).Diff;
    if (!Diff) { setLoadErr("Knihovnu diff se nepodařilo načíst."); return; }
    try {
      const res = Diff.diffLines(left, right);
      setParts(res);
      let added = 0, removed = 0;
      for (const p of res) {
        if (p.added) added += p.value.split("\n").filter(Boolean).length;
        else if (p.removed) removed += p.value.split("\n").filter(Boolean).length;
      }
      setStat(`+ ${added} řádků přidáno · - ${removed} odebráno`);
    } catch (e) {
      setLoadErr("Chyba: " + (e as Error).message);
    }
  }, [left, right, ensureLib]);

  useEffect(() => () => { setParts(null); }, []);


  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="cd-left">Původní text</label>
          <textarea className="textarea mono" id="cd-left" rows={10} value={left} onChange={(e) => setLeft(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cd-right">Upravený text</label>
          <textarea className="textarea mono" id="cd-right" rows={10} value={right} onChange={(e) => setRight(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" id="cd-run" type="button" onClick={compute}>Porovnat</button>
      {loadErr ? <p className="error-text">{loadErr}</p> : null}
      {parts ? (
        <>
          <div id="cd-out">
            {parts.map((p, pi) => {
              let text = p.value;
              if (text.charAt(text.length - 1) === "\n") text = text.slice(0, -1);
              const lines = text.split("\n");
              return lines.map((line, li) => {
                const kind = p.added ? "add" : p.removed ? "rem" : "same";
                return (
                  <div key={`${pi}-${li}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {kind === "rem" ? <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#fca5a5", background: "rgba(239,68,68,0.15)" }}>{line}</div> : <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--muted,#9ca3af)", background: "transparent" }}>{kind === "same" ? line : ""}</div>}
                    {kind === "add" ? <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#86efac", background: "rgba(34,197,94,0.15)" }}>{line}</div> : <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--muted,#9ca3af)", background: "transparent" }}>{kind === "same" ? line : ""}</div>}
                  </div>
                );
              });
            })}
          </div>
          <p id="cd-stat" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{stat}</p>
        </>
      ) : null}
    </div>
  );
}