"use client";

// Hash generátor — port legacy tools/assets/js/tools/hash-gen.js
// MD5 (UMD md5.js přes loadScript) + SHA-256/512 (SubtleCrypto, async).
// Komponenta renderuje POUZE vnitřní tělo .tool-tool — shell dodává stránka.
import { useEffect, useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, loadScript, useCopy, Icon, toastError } from "@/components/tools/tool-runtime";

declare global {
  interface Window { md5?: (s: string) => string; }
}

type HashType = "md5" | "sha256" | "sha512";

const LABELS: Record<Locale, { local: string; placeholder: string; result: string; compute: string; err: string }> = {
  cs: { local: "Lokální", placeholder: "Vložte text k hashování...", result: "Výsledek", compute: "Spočítat", err: "Hash se nepodařilo spočítat" },
  en: { local: "Local", placeholder: "Paste text to hash...", result: "Result", compute: "Compute", err: "Failed to compute hash" },
  de: { local: "Lokal", placeholder: "Text zum Hashen einfügen...", result: "Ergebnis", compute: "Berechnen", err: "Hash konnte nicht berechnet werden" },
  es: { local: "Local", placeholder: "Pega texto para hash...", result: "Resultado", compute: "Calcular", err: "No se pudo calcular el hash" },
  uk: { local: "Локально", placeholder: "Вставте текст для хешування...", result: "Результат", compute: "Обчислити", err: "Не вдалося обчислити хеш" },
  fr: { local: "Local", placeholder: "Collez le texte à hacher...", result: "Résultat", compute: "Calculer", err: "Échec du calcul du hash" },
  sk: { local: "Lokálne", placeholder: "Vložte text na hashovanie...", result: "Výsledok", compute: "Spočítať", err: "Hash sa nepodarilo spočítať" },
};

export default function HashGen({ locale }: ToolComponentProps) {
  const L = LABELS[locale] ?? LABELS.cs;
  void useToolUi(locale);
  const { copied, copy } = useCopy(locale);
  const [text, setText] = useState("");
  const [type, setType] = useState<HashType>("sha256");
  const [hash, setHash] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    let alive = true;
    loadScript("/tools/assets/js/lib/md5.js")
      .then(() => { if (alive) Promise.resolve().then(() => {}); })
      .catch(() => { if (alive) toastError(L.err); });
    return () => { alive = false; };
  }, [L.err]);

  async function compute() {
    if (!text) { setShow(false); setHash(""); return; }
    try {
      let h: string;
      if (type === "md5") {
        if (typeof window === "undefined" || !window.md5) { toastError(L.err); return; }
        h = window.md5(text);
      } else {
        const data = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest(type === "sha256" ? "SHA-256" : "SHA-512", data);
        h = Array.from(new Uint8Array(buf)).map((b) => ("0" + b.toString(16)).slice(-2)).join("");
      }
      setHash(h);
      setShow(true);
    } catch {
      toastError(L.err);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="row" style={{ gap: "0.5rem", marginBottom: "0.25rem" }}>
        <span className="badge badge-loc-local">{L.local}</span>
      </div>

      <textarea
        className="textarea input-mono"
        id="hash-input"
        placeholder={L.placeholder}
        style={{ minHeight: "160px", background: "rgba(19,19,22,0.5)" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="row" style={{ gap: "0.75rem" }}>
        <select
          className="select"
          id="hash-type"
          style={{ width: "12rem" }}
          value={type}
          onChange={(e) => setType(e.target.value as HashType)}
        >
          <option value="md5">MD5</option>
          <option value="sha256">SHA-256</option>
          <option value="sha512">SHA-512</option>
        </select>
        <button className="btn btn-primary" id="hash-compute" type="button" onClick={compute}>
          {L.compute}
        </button>
      </div>

      <div className={`stack-sm${show ? "" : " hidden"}`} id="hash-result-wrap">
        <span className="muted" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{L.result}</span>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input
            className="input input-mono"
            id="hash-result"
            readOnly
            value={hash}
            style={{ fontSize: "0.875rem", background: "rgba(19,19,22,0.3)" }}
          />
          <button
            className="btn btn-ghost btn-icon"
            id="hash-copy"
            type="button"
            disabled={!hash}
            onClick={() => copy(hash)}
          >
            <Icon name={copied ? "Check" : "Copy"} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}