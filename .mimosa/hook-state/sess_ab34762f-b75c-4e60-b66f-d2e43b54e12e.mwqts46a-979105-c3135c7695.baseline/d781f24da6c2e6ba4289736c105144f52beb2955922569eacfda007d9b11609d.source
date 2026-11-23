"use client";

// Lorem ipsum generátor, čistě client-side. Port legacy lorem-ipsum.js.
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { copyText, Icon } from "@/components/tools/tool-runtime";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
const START = "lorem ipsum dolor sit amet consectetur adipiscing elit".split(" ");

function rint(n: number): number { return Math.floor(Math.random() * n); }
function word(): string { return WORDS[rint(WORDS.length)]; }
function sentence(): string {
  const n = 6 + rint(10);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(word());
  const s = parts.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
function paragraph(): string {
  const n = 3 + rint(4);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(sentence());
  return parts.join(" ");
}

type Unit = "paragraphs" | "sentences" | "words";

function generate(n: number, unit: Unit, classic: boolean): string {
  n = Math.min(100, Math.max(1, n || 3));
  if (unit === "words") {
    const w: string[] = [];
    if (classic) w.push(...START);
    while (w.length < n) w.push(word());
    return w.slice(0, n).join(" ");
  }
  if (unit === "sentences") {
    const arr: string[] = [];
    if (classic) {
      const s0 = START.join(" ");
      arr.push(s0.charAt(0).toUpperCase() + s0.slice(1) + ".");
    }
    while (arr.length < n) arr.push(sentence());
    return arr.slice(0, n).join(" ");
  }
  const paras: string[] = [];
  if (classic) paras.push(START.join(" ") + " " + sentence());
  while (paras.length < n) paras.push(paragraph());
  return paras.slice(0, n).join("\n\n");
}

export default function LoremIpsum({ locale }: ToolComponentProps) {
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [classic, setClassic] = useState(true);
  const [out, setOut] = useState(() => generate(3, "paragraphs", true));

  const onGen = useCallback(() => {
    setOut(generate(count, unit, classic));
  }, [count, unit, classic]);

  const onCopy = useCallback(() => {
    if (out) void copyText(out, locale);
  }, [out, locale]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm">
          <label className="field-label" htmlFor="li-count">Počet</label>
          <input className="input" id="li-count" type="number" value={count} min={1} max={100} onChange={(e) => setCount(+e.target.value || 3)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="li-unit">Jednotka</label>
          <select className="select" id="li-unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            <option value="paragraphs">Odstavce</option>
            <option value="sentences">Věty</option>
            <option value="words">Slova</option>
          </select>
        </div>
        <button className="btn btn-primary" id="li-gen" type="button" onClick={onGen}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4v16" /><path d="M17 4v16" /><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" /></svg>
          Generovat
        </button>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>
          <input type="checkbox" id="li-classic" checked={classic} onChange={(e) => setClassic(e.target.checked)} /> Začít „Lorem ipsum…“
        </label>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="li-out">Text</label>
        <textarea className="textarea" id="li-out" rows={10} readOnly value={out} />
        <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button className="btn btn-secondary" id="li-copy" type="button" disabled={!out} onClick={onCopy}>
            <Icon name="Copy" size={16} /> Kopírovat
          </button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Generuje zástupný text lokálně (klasické lorem ipsum slovo po slově).</p>
    </div>
  );
}