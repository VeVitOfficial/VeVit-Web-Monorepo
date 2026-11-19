"use client";

// JSON → XML převodník, čistě client-side, bez externích knihoven.
// Rekurzivní serializace: objekt → každý klíč jako tag (sanitizovaný název),
// pole → opakuje rodičovský tag pro každou položku, string/číslo/bool → text,
// null → prázdný tag. Kořen je <root>, pretty-print s 2-mezerovým odsazením,
// hodnoty XML-escapované. Vstup lze vložit nebo nahrát .json (naplní textarea).
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

/** XML escape povinných znaků (& < > " '). */
function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** Sanitizace názvu tagu: jen [A-Za-z0-9_.-], nesmí začínat číslicí. */
function sanitizeTag(raw: string): string {
  let s = String(raw ?? "").replace(/[^A-Za-z0-9_.-]/g, "_");
  if (!s || /^[0-9]/.test(s)) s = "_" + s;
  return s;
}

/** Jedna hodnota (včetně polí/objektů) → XML blok(y) odsazené o `indent` úrovní. */
function valueToXml(v: unknown, tag: string, indent: number): string {
  const pad = "  ".repeat(indent);
  const t = sanitizeTag(tag);
  if (v == null) return `${pad}<${t}/>`; // null/undefined → prázdný tag
  if (Array.isArray(v)) {
    // pole → opakovat rodičovský tag pro každou položku
    return v.map((item) => valueToXml(item, tag, indent)).join("\n");
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (!entries.length) return `${pad}<${t}/>`;
    const inner = entries.map(([k, val]) => valueToXml(val, k, indent + 1)).join("\n");
    return `${pad}<${t}>\n${inner}\n${pad}</${t}>`;
  }
  return `${pad}<${t}>${escXml(String(v))}</${t}>`;
}

/** Celý dokument: deklarace + kořen <root> s obsahem podle typu vrcholu. */
function jsonToXml(data: unknown): string {
  const head = '<?xml version="1.0" encoding="UTF-8"?>';
  let body: string;
  if (Array.isArray(data)) {
    // pole na vrcholu → každá položka jako <item> uvnitř <root>
    body = data.map((item) => valueToXml(item, "item", 1)).join("\n");
  } else {
    body = valueToXml(data, "root", 0);
    return `${head}\n${body}`;
  }
  return `${head}\n<root>\n${body}\n</root>`;
}

export default function JsonToXml({ locale }: ToolComponentProps) {
  const { copied, copy } = useCopy(locale);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const convert = () => {
    setErr(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      const data: unknown = JSON.parse(input);
      setOutput(jsonToXml(data));
    } catch (e) {
      setOutput("");
      setErr("Neplatný JSON: " + (e as Error).message);
    }
  };

  /** Nahrání .json souboru → naplní vstupní textarea. */
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    try { setInput(await f.text()); setOutput(""); } catch { setErr("Soubor se nepodařilo načíst."); }
  };

  const onCopy = async () => { if (output) { await copy(output); } };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prevedeno.xml";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toastSuccess("XML staženo");
  };

  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <button className="btn btn-secondary" id="jx-load" type="button" onClick={() => inputFileRef.current?.click()}>
          <Icon name="Upload" size={16} /> Načíst .json soubor
        </button>
        <input
          ref={inputFileRef} type="file" className="hidden" accept=".json,application/json"
          aria-hidden="true" onChange={(e) => { onFile(Array.from(e.target.files ?? [])[0]); e.target.value = ""; }}
        />
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="jx-in">JSON vstup</label>
          <textarea className="textarea mono" id="jx-in" rows={14} value={input} onChange={(e) => setInput(e.target.value)} placeholder={'{\n  "polozka": "hodnota",\n  "seznam": [1, 2, 3]\n}'} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="jx-out">XML výstup</label>
          <textarea className="textarea mono" id="jx-out" rows={14} readOnly value={output} />
        </div>
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary" id="jx-run" type="button" onClick={convert}>Převést</button>
        <button className="btn btn-secondary" id="jx-dl" type="button" disabled={!output} onClick={download}>
          <Icon name="Download" size={16} /> Stáhnout prevedeno.xml
        </button>
        <button className="btn btn-ghost" id="jx-copy" type="button" disabled={!output} onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Pole se serializují opakováním rodičovského tagu, klíče se sanitizují na povolené znaky názvů XML tagů. Bez externích knihoven, vše běží lokálně.
      </p>
    </div>
  );
}
