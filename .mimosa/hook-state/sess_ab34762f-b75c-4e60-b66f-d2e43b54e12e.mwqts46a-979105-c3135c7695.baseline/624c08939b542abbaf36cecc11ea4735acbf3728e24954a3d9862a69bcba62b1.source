"use client";

// Počítadlo textu — živé statistiky, čistě client-side. Port legacy text-counter.js.
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useMemo, useState } from "react";
import type { Locale, ToolComponentProps } from "@/components/tools/registry/data";

const LOCALE_TAG: Record<Locale, string> = {
  cs: "cs-CZ", en: "en-US", de: "de-DE", es: "es-ES", uk: "uk-UA", fr: "fr-FR", sk: "sk-SK",
};

const MINUTE_UNIT: Record<Locale, string> = {
  cs: "min", en: "min", de: "Min.", es: "min", uk: "хв", fr: "min", sk: "min",
};

export default function TextCounter({ locale }: ToolComponentProps) {
  const [text, setText] = useState("");
  const locTag = LOCALE_TAG[locale] ?? "cs-CZ";
  const minuteUnit = MINUTE_UNIT[locale] ?? "min";

  const stats = useMemo(() => {
    const t = text;
    const chars = t.length.toLocaleString(locTag);
    const nospace = t.replace(/\s/g, "").length.toLocaleString(locTag);
    const w = t.trim() ? t.trim().split(/\s+/).length : 0;
    const words = w.toLocaleString(locTag);
    const s = t.trim() ? (t.match(/[^.!?…]+[.!?…]+/g) || []).length || (t.trim() ? 1 : 0) : 0;
    const sent = s.toLocaleString(locTag);
    const p = t.trim() ? t.split(/\n\s*\n/).filter((b) => b.trim()).length : 0;
    const par = p.toLocaleString(locTag);
    const min = w / 200;
    const read = w === 0 ? `0 ${minuteUnit}` : min < 1 ? `< 1 ${minuteUnit}` : `${Math.ceil(min)} ${minuteUnit}`;
    return { chars, nospace, words, sent, par, read };
  }, [text, locTag, minuteUnit]);

  return (
    <div className="stack" id="tc-root" data-minute-unit={minuteUnit} style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="tc-in">Text</label>
        <textarea
          className="textarea"
          id="tc-in"
          rows={10}
          placeholder="Zadejte text…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }}>
        <div className="kv"><span className="k">Znaky (včetně mezer)</span><span className="v mono" id="tc-chars">{stats.chars}</span></div>
        <div className="kv"><span className="k">Znaky (bez mezer)</span><span className="v mono" id="tc-nospace">{stats.nospace}</span></div>
        <div className="kv"><span className="k">Slova</span><span className="v mono" id="tc-words">{stats.words}</span></div>
        <div className="kv"><span className="k">Věty</span><span className="v mono" id="tc-sent">{stats.sent}</span></div>
        <div className="kv"><span className="k">Odstavce</span><span className="v mono" id="tc-par">{stats.par}</span></div>
        <div className="kv"><span className="k">Odhad doby čtení</span><span className="v" id="tc-read">{stats.read}</span></div>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Počítání běží lokálně. Rychlost čtení ~200 slov/min.</p>
    </div>
  );
}