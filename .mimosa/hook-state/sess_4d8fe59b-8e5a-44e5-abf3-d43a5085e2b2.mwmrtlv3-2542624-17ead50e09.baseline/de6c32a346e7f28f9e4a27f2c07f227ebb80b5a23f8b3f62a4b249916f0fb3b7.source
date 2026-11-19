"use client";

// CSS/JS/HTML formátovač a minifikátor — port legacy css-js-html-formatter.js.
// js-beautify lazy-load + regex minify. Čistě client-side.
import { useCallback, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { loadScript, useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

type Lang = "css" | "js" | "html";
type Act = "beautify" | "minify";

function minify(l: Lang, s: string): string {
  if (l === "css") {
    return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ")
      .replace(/\s*([{}:;,>~+])\s*/g, "$1").replace(/;}/g, "}").trim();
  }
  if (l === "html") {
    return s.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  }
  // JS — konzervativní: odstraň blokové komentáře, spoj řádky, kolaps mezer.
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  s = s.replace(/\r\n?/g, "\n");
  s = s.split("\n").map((line) => line.replace(/\s+$/, "")).join("\n");
  s = s.replace(/\n\s*\n/g, "\n").replace(/[ \t]{2,}/g, " ");
  return s.trim();
}

export default function CssJsHtmlFormatter({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [lang, setLang] = useState<Lang>("css");
  const [act, setAct] = useState<Act>("beautify");
  const [indent, setIndent] = useState(2);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const libRef = useRef<Record<string, boolean>>({});

  const ensureBeautify = useCallback(async (l: Lang): Promise<boolean> => {
    const load = async (src: string, key: string) => {
      if (libRef.current[key]) return;
      await loadScript(src);
      libRef.current[key] = true;
    };
    try {
      if (l === "js") await load("/tools/assets/js/lib/beautify.min.js", "js");
      else if (l === "css") await load("/tools/assets/js/lib/beautify-css.js", "css");
      else {
        await load("/tools/assets/js/lib/beautify.min.js", "js");
        await load("/tools/assets/js/lib/beautify-css.js", "css");
        await load("/tools/assets/js/lib/beautify-html.js", "html");
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const compute = useCallback(async () => {
    setErr(null);
    if (!input) { setOutput(""); return; }
    if (act === "minify") {
      try { setOutput(minify(lang, input)); }
      catch (e) { setOutput(""); setErr("Chyba: " + (e as Error).message); }
      return;
    }
    const ok = await ensureBeautify(lang);
    if (!ok) { setErr("Knihovnu se nepodařilo načíst."); return; }
    const w = window as unknown as { js_beautify?: (s: string, o: Record<string, unknown>) => string; css_beautify?: (s: string, o: Record<string, unknown>) => string; html_beautify?: (s: string, o: Record<string, unknown>) => string };
    try {
      const opts = { indent_size: indent || 2, end_with_newline: false };
      if (lang === "js") setOutput(w.js_beautify!(input, opts));
      else if (lang === "css") setOutput(w.css_beautify!(input, opts));
      else setOutput(w.html_beautify!(input, opts));
    } catch (e) {
      setOutput("");
      setErr("Chyba: " + (e as Error).message);
    }
  }, [input, act, lang, indent, ensureBeautify]);

  const onCopy = async () => { if (output) { const ok = await copy(output); if (ok) toastSuccess("Zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="seg" id="fj-lang" role="tablist" aria-label="Jazyk">
          {(["css", "js", "html"] as Lang[]).map((l) => (
            <button key={l} type="button" role="tab" data-lang={l} aria-selected={lang === l}
              className={lang === l ? "active" : ""} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="seg" id="fj-act" role="tablist" aria-label="Akce">
          {(["beautify", "minify"] as Act[]).map((a) => (
            <button key={a} type="button" role="tab" data-act={a} aria-selected={act === a}
              className={act === a ? "active" : ""} onClick={() => setAct(a)}>
              {a === "beautify" ? "Formátovat" : "Minifikovat"}
            </button>
          ))}
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="fj-indent">Odsazení</label>
          <input className="input" id="fj-indent" type="number" min={1} max={8} value={indent}
            style={{ width: "4rem" }} onChange={(e) => setIndent(parseInt(e.target.value, 10) || 2)} />
        </div>
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="fj-in">Vstup</label>
          <textarea className="textarea mono" id="fj-in" rows={12} value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="fj-out">Výstup</label>
          <textarea className="textarea mono" id="fj-out" rows={12} readOnly value={output} />
        </div>
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <div className="row">
        <button className="btn btn-primary" id="fj-run" type="button" onClick={compute}>
          {act === "beautify" ? "Formátovat" : "Minifikovat"}
        </button>
        <button className="btn btn-secondary" id="fj-copy" type="button" disabled={!output} onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      </div>
    </div>
  );
}