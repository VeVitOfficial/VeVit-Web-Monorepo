"use client";

// XML → JSON převodník, čistě client-side, bez externích knihoven
// (parsování přes nativní DOMParser). Vlastní rekurzivní serializace:
//   element → { tag, attrs: { "@attr": hodnota }, children: [...] | text: "..." }
//   textový element bez atributů → obyčejný string.
// Vstup lze vložit do textarea nebo nahrát soubor .xml (naplní textarea).
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

/** Element → JS hodnota podle pravidel výše. */
function elToJson(el: Element): unknown {
  const attrs: Record<string, string> = {};
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    attrs["@" + a.name] = a.value;
  }
  const elemChildren = Array.from(el.children);
  const text = (el.textContent ?? "").trim();
  // Listový element bez atributů → jen text jako string.
  if (!elemChildren.length && !Object.keys(attrs).length) return text;
  const out: Record<string, unknown> = { tag: el.tagName };
  if (Object.keys(attrs).length) out.attrs = attrs;
  if (elemChildren.length) out.children = elemChildren.map(elToJson);
  else if (text) out.text = text;
  return out;
}

export default function XmlToJson({ locale }: ToolComponentProps) {
  const { copied, copy } = useCopy(locale);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const convert = () => {
    setErr(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      const doc = new DOMParser().parseFromString(input, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) {
        throw new Error("XML není well-formed — zkontrolujte uzavřené tagy a entity.");
      }
      if (!doc.documentElement) throw new Error("XML nemá kořenový element.");
      setOutput(JSON.stringify(elToJson(doc.documentElement), null, 2));
    } catch (e) {
      setOutput("");
      setErr("Neplatné XML: " + (e as Error).message);
    }
  };

  /** Nahrání .xml souboru → naplní vstupní textarea. */
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    try { setInput(await f.text()); setOutput(""); } catch { setErr("Soubor se nepodařilo načíst."); }
  };

  const onCopy = async () => { if (output) { await copy(output); } };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prevedeno.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toastSuccess("JSON stažen");
  };

  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <button className="btn btn-secondary" id="xj-load" type="button" onClick={() => inputFileRef.current?.click()}>
          <Icon name="Upload" size={16} /> Načíst .xml soubor
        </button>
        <input
          ref={inputFileRef} type="file" className="hidden" accept=".xml,application/xml,text/xml"
          aria-hidden="true" onChange={(e) => { onFile(Array.from(e.target.files ?? [])[0]); e.target.value = ""; }}
        />
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="xj-in">XML vstup</label>
          <textarea className="textarea mono" id="xj-in" rows={14} value={input} onChange={(e) => setInput(e.target.value)} placeholder={'<data>\n  <item id="1">hodnota</item>\n</data>'} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="xj-out">JSON výstup</label>
          <textarea className="textarea mono" id="xj-out" rows={14} readOnly value={output} />
        </div>
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary" id="xj-run" type="button" onClick={convert}>Převést</button>
        <button className="btn btn-secondary" id="xj-dl" type="button" disabled={!output} onClick={download}>
          <Icon name="Download" size={16} /> Stáhnout prevedeno.json
        </button>
        <button className="btn btn-ghost" id="xj-copy" type="button" disabled={!output} onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Atributy se serializují jako „@název“, čistě textové elementy jako string. Bez externích knihoven, vše běží lokálně.
      </p>
    </div>
  );
}
