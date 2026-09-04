"use client";

// YAML ↔ JSON konvertor — port legacy yaml-json-converter.js.
// js-yaml lazy-load. Režim y2j | j2y. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { loadScript, useCopy, Icon, toastSuccess, toastError } from "@/components/tools/tool-runtime";

type Mode = "y2j" | "j2y";

export default function YamlJsonConverter({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [mode, setMode] = useState<Mode>("y2j");
  const [inp, setInp] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const libReadyRef = useRef(false);

  const ensureLib = useCallback(async () => {
    if (libReadyRef.current) return true;
    try {
      await loadScript("/tools/assets/js/lib/js-yaml.min.js");
      libReadyRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const convert = useCallback(async () => {
    if (!inp.trim()) { setOut(""); setErr(null); return; }
    const ok = await ensureLib();
    if (!ok) { setErr("Knihovnu js-yaml se nepodařilo načíst."); return; }
    const jsyaml = (window as unknown as { jsyaml?: { load: (s: string) => unknown; dump: (v: unknown, opts?: object) => string } }).jsyaml;
    if (!jsyaml) { setErr("Knihovnu js-yaml se nepodařilo načíst."); return; }
    try {
      if (mode === "y2j") {
        const v = jsyaml.load(inp);
        setOut(JSON.stringify(v, null, 2));
        setErr(null);
      } else {
        const v = JSON.parse(inp);
        setOut(jsyaml.dump(v, { indent: 2, lineWidth: 100 }));
        setErr(null);
      }
    } catch (e) {
      setErr((e as Error).message);
      setOut("");
    }
  }, [inp, mode, ensureLib]);

  useEffect(() => { Promise.resolve().then(() => { void convert(); }); }, [inp, mode, convert]);

  const onSwap = () => {
    if (!out) { toastError("Není co prohodit"); return; }
    setInp(out);
    setMode(mode === "y2j" ? "j2y" : "y2j");
  };

  const onCopy = async () => { if (out) { const ok = await copy(out); if (ok) toastSuccess("Zkopírováno"); } };
  const onClear = () => { setInp(""); setOut(""); setErr(null); };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="seg" role="tablist" aria-label="Režim konverze">
        <button type="button" role="tab" aria-selected={mode === "y2j"} className={mode === "y2j" ? "active" : ""} onClick={() => setMode("y2j")}>YAML → JSON</button>
        <button type="button" role="tab" aria-selected={mode === "j2y"} className={mode === "j2y" ? "active" : ""} onClick={() => setMode("j2y")}>JSON → YAML</button>
      </div>

      <div className="two-col" style={{ gap: "0.75rem" }}>
        <div className="stack-sm">
          <label className="field-label" htmlFor="yj-in">{mode === "y2j" ? "YAML vstup" : "JSON vstup"}</label>
          <textarea className="textarea mono" id="yj-in" rows={14} value={inp} onChange={(e) => setInp(e.target.value)} spellCheck={false} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="yj-out">{mode === "y2j" ? "JSON výstup" : "YAML výstup"}</label>
          <textarea className="textarea mono" id="yj-out" rows={14} value={out} readOnly spellCheck={false} />
        </div>
      </div>

      {err ? <p className="error-text" role="alert">{err}</p> : null}

      <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" id="yj-swap" type="button" onClick={onSwap}>Prohodit</button>
        <button className="btn btn-secondary" id="yj-copy" type="button" onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
        <button className="btn btn-ghost" id="yj-clear" type="button" onClick={onClear}>Vyčistit</button>
      </div>
    </div>
  );
}