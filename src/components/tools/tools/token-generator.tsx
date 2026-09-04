"use client";

// Token generátor — port legacy tools/assets/js/tools/token-generator.js
// Kryptograficky náhodné tokeny přes crypto.getRandomValues, čistě client-side.
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, Icon, useCopy, toastSuccess } from "@/components/tools/tool-runtime";

const LBL: Record<Locale, { len: string; count: string; charset: string; alnum: string; hex: string; b64: string; all: string; excAmb: string; gen: string; copy: string; ph: string; note: string; errEmpty: string; toast: string }> = {
  cs: { len: "Délka", count: "Počet tokenů", charset: "Znaková sada", alnum: "Alfanumerické", hex: "Hex", b64: "Base64", all: "Vše + speciální", excAmb: "Vyloučit zaměnitelné (0/O/1/l/I)", gen: "Vygenerovat", copy: "Kopírovat", ph: "Tokeny se zobrazí zde…", note: "Kryptograficky náhodné přes crypto.getRandomValues. Běží lokálně.", errEmpty: "Znaková sada je po vyloučení prázdná.", toast: " token(ů) vygenerováno" },
  en: { len: "Length", count: "Token count", charset: "Character set", alnum: "Alphanumeric", hex: "Hex", b64: "Base64", all: "All + special", excAmb: "Exclude ambiguous (0/O/1/l/I)", gen: "Generate", copy: "Copy", ph: "Tokens will appear here…", note: "Cryptographically random via crypto.getRandomValues. Runs locally.", errEmpty: "Character set is empty after exclusion.", toast: " token(s) generated" },
  de: { len: "Länge", count: "Token-Anzahl", charset: "Zeichensatz", alnum: "Alphanumerisch", hex: "Hex", b64: "Base64", all: "Alle + Sonderzeichen", excAmb: "Ähnliche ausschließen (0/O/1/l/I)", gen: "Generieren", copy: "Kopieren", ph: "Token erscheinen hier…", note: "Kryptografisch zufällig via crypto.getRandomValues. Läuft lokal.", errEmpty: "Zeichensatz nach Ausschluss leer.", toast: " Token(s) generiert" },
  es: { len: "Longitud", count: "Número de tokens", charset: "Conjunto de caracteres", alnum: "Alfanuméricos", hex: "Hex", b64: "Base64", all: "Todos + especiales", excAmb: "Excluir ambiguos (0/O/1/l/I)", gen: "Generar", copy: "Copiar", ph: "Los tokens aparecerán aquí…", note: "Criptográficamente aleatorio vía crypto.getRandomValues. Se ejecuta localmente.", errEmpty: "Conjunto de caracteres vacío tras la exclusión.", toast: " token(s) generados" },
  uk: { len: "Довжина", count: "Кількість токенів", charset: "Набір символів", alnum: "Алфавітно-цифрові", hex: "Hex", b64: "Base64", all: "Усі + спеціальні", excAmb: "Виключити схожі (0/O/1/l/I)", gen: "Згенерувати", copy: "Копіювати", ph: "Токени з'являться тут…", note: "Криптографічно випадкові через crypto.getRandomValues. Працює локально.", errEmpty: "Набір символів порожній після виключення.", toast: " токен(ів) згенеровано" },
  fr: { len: "Longueur", count: "Nombre de jetons", charset: "Jeu de caractères", alnum: "Alphanumérique", hex: "Hex", b64: "Base64", all: "Tous + spéciaux", excAmb: "Exclure ambigus (0/O/1/l/I)", gen: "Générer", copy: "Copier", ph: "Les jetons apparaîtront ici…", note: "Aléatoire cryptographique via crypto.getRandomValues. S'exécute localement.", errEmpty: "Jeu de caractères vide après exclusion.", toast: " jeton(s) généré(s)" },
  sk: { len: "Dĺžka", count: "Počet tokenov", charset: "Znaková sada", alnum: "Alfanumerické", hex: "Hex", b64: "Base64", all: "Všetko + špeciálne", excAmb: "Vylúčiť zameniteľné (0/O/1/l/I)", gen: "Vygenerovať", copy: "Kopírovať", ph: "Tokeny sa zobrazia tu…", note: "Kryptograficky náhodné cez crypto.getRandomValues. Beží lokálne.", errEmpty: "Znaková sada je po vylúčení prázdna.", toast: " token(ov) vygenerovaných" },
};

const SETS: Record<string, string> = {
  alnum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  hex: "0123456789abcdef",
  b64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  all: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?",
};
const AMBIGUOUS = "0O1lI|`";
const TABS: Array<{ cs: "alnum" | "hex" | "b64" | "all"; key: "alnum" | "hex" | "b64" | "all" }> = [
  { cs: "alnum", key: "alnum" },
  { cs: "hex", key: "hex" },
  { cs: "b64", key: "b64" },
  { cs: "all", key: "all" },
];

function rand(n: number): Uint32Array {
  const a = new Uint32Array(n);
  crypto.getRandomValues(a);
  return a;
}

export default function TokenGenerator({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  void useToolUi(locale);
  const [len, setLen] = useState(32);
  const [count, setCount] = useState(1);
  const [cs, setCs] = useState<"alnum" | "hex" | "b64" | "all">("alnum");
  const [excAmb, setExcAmb] = useState(true);
  const [out, setOut] = useState("");
  const [error, setError] = useState("");
  const { copied, copy } = useCopy(locale);

  function build() {
    let set = SETS[cs] ?? SETS.alnum;
    if (excAmb) set = set.split("").filter((c) => AMBIGUOUS.indexOf(c) < 0).join("");
    if (!set) { setError(L.errEmpty); return; }
    setError("");
    const n = Math.max(1, Math.min(256, len || 32));
    const c = Math.max(1, Math.min(100, count || 1));
    const lines: string[] = [];
    for (let k = 0; k < c; k++) {
      const r = rand(n);
      let s = "";
      for (let i = 0; i < n; i++) s += set[r[i] % set.length];
      lines.push(s);
    }
    setOut(lines.join("\n"));
    toastSuccess(c + L.toast);
  }

  return (
    <div className="stack" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm">
          <label className="field-label" htmlFor="tk-len">{L.len}</label>
          <input className="input" id="tk-len" type="number" value={len} min={4} max={256} style={{ width: "6rem" }} onChange={(e) => setLen(parseInt(e.target.value, 10) || 32)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="tk-count">{L.count}</label>
          <input className="input" id="tk-count" type="number" value={count} min={1} max={100} style={{ width: "6rem" }} onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)} />
        </div>
      </div>
      <div className="stack-sm">
        <span className="field-label">{L.charset}</span>
        <div className="seg" id="tk-charset" role="tablist">
          {TABS.map((t) => (
            <button key={t.cs} type="button" className={cs === t.cs ? "active" : ""} data-cs={t.cs} role="tab" aria-selected={cs === t.cs} onClick={() => setCs(t.cs)}>
              {L[t.key]}
            </button>
          ))}
        </div>
      </div>
      <label className="row" style={{ gap: "0.4rem", alignItems: "center", fontSize: "0.85rem" }}>
        <input type="checkbox" id="tk-excamb" checked={excAmb} onChange={(e) => setExcAmb(e.target.checked)} /> {L.excAmb}
      </label>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <button className="btn btn-primary btn-touch" id="tk-gen" type="button" onClick={build}>{L.gen}</button>
        <button className="btn btn-secondary" id="tk-copy" type="button" disabled={!out} onClick={() => copy(out)}>
          <Icon name="Copy" size={16} /> {copied ? "✓" : L.copy}
        </button>
      </div>
      <textarea className="textarea" id="tk-out" rows={6} readOnly placeholder={L.ph} value={out} onChange={() => {}} />
      <p className={`error-text${error ? "" : " hidden"}`} id="tk-error" role="alert">{error}</p>
      <p className="muted" style={{ fontSize: "0.8rem" }}>{L.note}</p>
    </div>
  );
}