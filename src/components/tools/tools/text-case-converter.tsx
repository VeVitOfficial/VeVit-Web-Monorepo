"use client";

// Převodník velikosti písmen, čistě client-side. Port legacy text-case-converter.js.
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { copyText, Icon } from "@/components/tools/tool-runtime";

// Rozdělení na slova (pouze alfanumerické skupiny, vč. české diakritiky) — viz legacy words().
function words(s: string): string[] {
  return s.split(/([A-Za-zÀ-ž0-9]+)/).filter((x) => /[A-Za-zÀ-ž0-9]/.test(x));
}

type Fn = "upper" | "lower" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "const";

const F: Record<Fn, (s: string) => string> = {
  upper: (s) => s.toUpperCase(),
  lower: (s) => s.toLowerCase(),
  title: (s) => s.toLowerCase().replace(/(^|\s|[“”„"])([a-zà-ž])/g, (_m, p: string, c: string) => p + c.toUpperCase()),
  sentence: (s) => s.toLowerCase().replace(/(^\s*|[.!?…]\s+)([a-zà-ž])/g, (_m, p: string, c: string) => p + c.toUpperCase()),
  camel: (s) => {
    const w = words(s).map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase());
    if (!w.length) return "";
    w[0] = w[0].toLowerCase();
    return w.join("");
  },
  pascal: (s) => words(s).map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join(""),
  snake: (s) => words(s).map((x) => x.toLowerCase()).join("_"),
  kebab: (s) => words(s).map((x) => x.toLowerCase()).join("-"),
  const: (s) => words(s).map((x) => x.toUpperCase()).join("_"),
};

const BUTTONS: { fn: Fn; label: string }[] = [
  { fn: "upper", label: "VELKÁ PÍSMENA" },
  { fn: "lower", label: "malá písmena" },
  { fn: "title", label: "Title Case" },
  { fn: "sentence", label: "Sentence case" },
  { fn: "camel", label: "camelCase" },
  { fn: "pascal", label: "PascalCase" },
  { fn: "snake", label: "snake_case" },
  { fn: "kebab", label: "kebab-case" },
  { fn: "const", label: "CONSTANT_CASE" },
];

export default function TextCaseConverter({ locale }: ToolComponentProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const apply = useCallback((fn: Fn) => {
    setOutput(F[fn](input));
  }, [input]);

  const onCopy = useCallback(() => {
    if (output) void copyText(output, locale);
  }, [output, locale]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="tcc-in">Vstup</label>
        <textarea className="textarea mono" id="tcc-in" rows={5} placeholder="Zadejte text…" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>
      <div className="row" id="tcc-btns" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        {BUTTONS.map((b) => (
          <button key={b.fn} className="btn btn-ghost" type="button" data-fn={b.fn} onClick={() => apply(b.fn)}>{b.label}</button>
        ))}
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="tcc-out">Výstup</label>
        <textarea className="textarea mono" id="tcc-out" rows={5} readOnly value={output} />
        <button className="btn btn-secondary" id="tcc-copy" type="button" disabled={!output} style={{ marginTop: "0.5rem" }} onClick={onCopy}>
          <Icon name="Copy" size={16} /> Kopírovat
        </button>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Převod běží lokálně. Title Case respektuje českou diakritiku.</p>
    </div>
  );
}