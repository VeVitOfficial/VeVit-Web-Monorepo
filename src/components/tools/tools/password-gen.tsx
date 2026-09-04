"use client";

// Generátor hesel — port legacy tools/assets/js/tools/password-gen.js
// crypto.getRandomValues + ukazatel síly (entropie). Režim náhodné znaky / heslová fráze.
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, useCopy, Icon, toastError, toastSuccess } from "@/components/tools/tool-runtime";

type Mode = "chars" | "words";

// Síla hesla — labely transkribované z legacy (cs-only zůstává cs, ostatní fallback cs).
const STRENGTH_CS = ["Velmi slabé", "Slabé", "Střední", "Silné", "Velmi silné"];
const STRENGTH_EN = ["Very weak", "Weak", "Medium", "Strong", "Very strong"];
const COLORS = ["#ef4444", "#f97316", "#eab308", "#10b981", "#34d399"];

const WORDS = ["amber", "apple", "atlas", "bamboo", "beacon", "birch", "breeze", "cedar", "cloud", "comet", "coral", "delta", "ember", "falcon", "fern", "forest", "harbor", "hazel", "island", "juniper", "lantern", "maple", "meadow", "meteor", "mint", "ocean", "olive", "orchid", "pebble", "pine", "planet", "river", "robin", "silver", "solar", "spruce", "stone", "sunset", "timber", "violet", "willow"];

const LBL: Record<Locale, { local: string; modeChars: string; modeWords: string; length: string; lower: string; upper: string; numbers: string; symbols: string; ambiguous: string; generate: string; placeholder: string; strength: string; chooseCharset: string; passwordCopied: string; entropyLabel: string }> = {
  cs: { local: "Lokální", modeChars: "Náhodné znaky", modeWords: "Heslová fráze", length: "Délka", lower: "Malá písmena (a-z)", upper: "Velká písmena (A-Z)", numbers: "Číslice (0-9)", symbols: "Speciální znaky", ambiguous: "Vynechat podobné znaky (0/O, 1/l/I)", generate: "Generovat", placeholder: "Stiskněte Generovat", strength: "Síla hesla", chooseCharset: "Vyberte alespoň jednu skupinu znaků.", passwordCopied: "Heslo bylo zkopírováno.", entropyLabel: "Odhad entropie: {bits} bitů" },
  en: { local: "Local", modeChars: "Random characters", modeWords: "Passphrase", length: "Length", lower: "Lowercase (a-z)", upper: "Uppercase (A-Z)", numbers: "Digits (0-9)", symbols: "Special characters", ambiguous: "Exclude ambiguous (0/O, 1/l/I)", generate: "Generate", placeholder: "Press Generate", strength: "Password strength", chooseCharset: "Select at least one character set.", passwordCopied: "Password copied.", entropyLabel: "Estimated entropy: {bits} bits" },
  de: { local: "Lokal", modeChars: "Zufällige Zeichen", modeWords: "Passphrase", length: "Länge", lower: "Kleinbuchstaben (a-z)", upper: "Großbuchstaben (A-Z)", numbers: "Ziffern (0-9)", symbols: "Sonderzeichen", ambiguous: "Ähnliche Zeichen ausschließen (0/O, 1/l/I)", generate: "Generieren", placeholder: "Generieren drücken", strength: "Passwortstärke", chooseCharset: "Wählen Sie mindestens einen Zeichensatz.", passwordCopied: "Passwort kopiert.", entropyLabel: "Geschätzte Entropie: {bits} Bits" },
  es: { local: "Local", modeChars: "Caracteres aleatorios", modeWords: "Frase de contraseña", length: "Longitud", lower: "Minúsculas (a-z)", upper: "Mayúsculas (A-Z)", numbers: "Dígitos (0-9)", symbols: "Caracteres especiales", ambiguous: "Excluir ambiguos (0/O, 1/l/I)", generate: "Generar", placeholder: "Pulse Generar", strength: "Fortaleza", chooseCharset: "Seleccione al menos un juego de caracteres.", passwordCopied: "Contraseña copiada.", entropyLabel: "Entropía estimada: {bits} bits" },
  uk: { local: "Локально", modeChars: "Випадкові символи", modeWords: "Парольна фраза", length: "Довжина", lower: "Нижній регістр (a-z)", upper: "Верхній регістр (A-Z)", numbers: "Цифри (0-9)", symbols: "Спецсимволи", ambiguous: "Виключити схожі (0/O, 1/l/I)", generate: "Згенерувати", placeholder: "Натисніть Згенерувати", strength: "Міцність", chooseCharset: "Оберіть хоча б один набір символів.", passwordCopied: "Пароль скопійовано.", entropyLabel: "Оцінка ентропії: {bits} біт" },
  fr: { local: "Local", modeChars: "Caractères aléatoires", modeWords: "Phrase-clé", length: "Longueur", lower: "Minuscules (a-z)", upper: "Majuscules (A-Z)", numbers: "Chiffres (0-9)", symbols: "Caractères spéciaux", ambiguous: "Exclure ambigus (0/O, 1/l/I)", generate: "Générer", placeholder: "Appuyez sur Générer", strength: "Robustesse", chooseCharset: "Sélectionnez au moins un jeu de caractères.", passwordCopied: "Mot de passe copié.", entropyLabel: "Entropie estimée : {bits} bits" },
  sk: { local: "Lokálne", modeChars: "Náhodné znaky", modeWords: "Heslová fráza", length: "Dĺžka", lower: "Malé písmená (a-z)", upper: "Veľké písmená (A-Z)", numbers: "Číslice (0-9)", symbols: "Špeciálne znaky", ambiguous: "Vynechať zamieňateľné (0/O, 1/l/I)", generate: "Vygenerovať", placeholder: "Stlačte Vygenerovať", strength: "Sila hesla", chooseCharset: "Vyberte aspoň jednu skupinu znakov.", passwordCopied: "Heslo bolo skopírované.", entropyLabel: "Odhad entropie: {bits} bitov" },
};

function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  let value: number;
  do { const data = new Uint32Array(1); crypto.getRandomValues(data); value = data[0]; } while (value >= limit);
  return value % max;
}

export default function PasswordGen({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  void useToolUi(locale);
  const { copied, copy } = useCopy(locale);
  const [out, setOut] = useState("");
  const [mode, setMode] = useState<Mode>("chars");
  const [length, setLength] = useState(16);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [ambiguous, setAmbiguous] = useState(true);
  const [strength, setStrength] = useState<{ bits: number; s: number } | null>(null);

  const strengthLabels = locale === "en" ? STRENGTH_EN : STRENGTH_CS;

  function getStrength(len: number): number {
    let score = 0;
    if (len >= 8) score++;
    if (len >= 12) score++;
    if (lower && upper) score++;
    if (numbers) score++;
    if (symbols) score++;
    return score;
  }

  function showStrength(bits: number, s: number) { setStrength({ bits, s: Math.min(4, s) }); }

  function generate() {
    if (mode === "words") {
      const words: string[] = [];
      for (let w = 0; w < 5; w++) words.push(WORDS[randomIndex(WORDS.length)]);
      const val = words.join("-");
      setOut(val);
      showStrength(Math.round(5 * Math.log2(WORDS.length)), 4);
      return;
    }
    let chars = "";
    if (lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    if (ambiguous) chars = chars.replace(/[0O1lI]/g, "");
    if (!chars) { toastError(L.chooseCharset); return; }
    const len = length;
    let result = "";
    for (let i = 0; i < len; i++) result += chars[randomIndex(chars.length)];
    setOut(result);
    const s = Math.min(4, getStrength(len));
    showStrength(Math.round(len * Math.log2(chars.length)), s);
  }

  async function onCopy() {
    if (!out) return;
    const ok = await copy(out);
    if (ok) toastSuccess(L.passwordCopied);
  }

  return (
    <div className="stack" id="pw-root" data-entropy-label={L.entropyLabel} style={{ maxWidth: "36rem", margin: "0 auto" }}>
      <div className="row" style={{ gap: "0.5rem", marginBottom: "0.25rem" }}>
        <span className="badge badge-loc-local">{L.local}</span>
      </div>

      <div className="row" style={{ gap: "0.5rem" }}>
        <input className="input input-mono" id="pw-out" readOnly placeholder={L.placeholder} value={out} style={{ fontSize: "1.125rem", letterSpacing: "0.05em", background: "rgba(19,19,22,0.5)" }} />
        <button className="btn btn-ghost btn-icon" id="pw-copy" type="button" disabled={!out} onClick={onCopy} style={{ ["--ico" as string]: 18 }}>
          <Icon name={copied ? "Check" : "Copy"} size={20} />
        </button>
      </div>

      <div className={`stack-sm${strength ? "" : " hidden"}`} id="pw-strength-wrap">
        <div className="row-between" style={{ fontSize: "0.875rem" }}>
          <span className="muted">{L.strength}</span>
          <span id="pw-strength-label">{strength ? strengthLabels[strength.s] : ""}</span>
        </div>
        <div className="strength-track">
          <div
            className="strength-fill"
            id="pw-strength-bar"
            style={{ width: strength ? `${(strength.s + 1) * 20}%` : "0%", background: strength ? COLORS[strength.s] : "#6b7280" }}
          />
        </div>
        <span className="editor-meta" id="pw-entropy">{strength ? L.entropyLabel.replace("{bits}", String(strength.bits)) : ""}</span>
      </div>

      <div className={`pw-options${mode === "words" ? " is-passphrase" : ""}`}>
        <label className="stack-sm">
          <span className="field-label">{L.modeChars.length > 0 ? "Režim" : "Režim"}</span>
          <select className="select" id="pw-mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="chars">{L.modeChars}</option>
            <option value="words">{L.modeWords}</option>
          </select>
        </label>
        <div className="row-between">
          <span style={{ fontSize: "0.875rem" }}>{L.length}: <span id="pw-len-label">{length}</span></span>
          <input type="range" min={4} max={64} value={length} id="pw-length" onChange={(e) => setLength(parseInt(e.target.value, 10))} />
        </div>
        <label className="pw-opt row-between"><span>{L.lower}</span><input type="checkbox" id="pw-lower" checked={lower} onChange={(e) => setLower(e.target.checked)} /></label>
        <label className="pw-opt row-between"><span>{L.upper}</span><input type="checkbox" id="pw-upper" checked={upper} onChange={(e) => setUpper(e.target.checked)} /></label>
        <label className="pw-opt row-between"><span>{L.numbers}</span><input type="checkbox" id="pw-numbers" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} /></label>
        <label className="pw-opt row-between"><span>{L.symbols}</span><input type="checkbox" id="pw-symbols" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /></label>
        <label className="pw-opt row-between"><span>{L.ambiguous}</span><input type="checkbox" id="pw-ambiguous" checked={ambiguous} onChange={(e) => setAmbiguous(e.target.checked)} /></label>
      </div>

      <button className="btn btn-primary btn-block" id="pw-generate" type="button" onClick={generate}>{L.generate}</button>
    </div>
  );
}