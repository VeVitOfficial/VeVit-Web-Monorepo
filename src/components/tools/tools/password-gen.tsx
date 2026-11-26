"use client";

// Generátor hesel — port legacy tools/assets/js/tools/password-gen.js
// crypto.getRandomValues + ukazatel síly (entropie). Režim náhodné znaky / heslová fráze.
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, useCopy, Icon, toastError, toastSuccess } from "@/components/tools/tool-runtime";

type Mode = "chars" | "words" | "memorable";

// Síla hesla — labely transkribované z legacy (cs-only zůstává cs, ostatní fallback cs).
const STRENGTH_CS = ["Velmi slabé", "Slabé", "Střední", "Silné", "Velmi silné"];
const STRENGTH_EN = ["Very weak", "Weak", "Medium", "Strong", "Very strong"];
const COLORS = ["var(--vv-danger)", "var(--vv-warning)", "var(--vv-warning)", "var(--vv-green)", "var(--vv-green-hi)"];

const WORDS = ["amber", "apple", "atlas", "bamboo", "beacon", "birch", "breeze", "cedar", "cloud", "comet", "coral", "delta", "ember", "falcon", "fern", "forest", "harbor", "hazel", "island", "juniper", "lantern", "maple", "meadow", "meteor", "mint", "ocean", "olive", "orchid", "pebble", "pine", "planet", "river", "robin", "silver", "solar", "spruce", "stone", "sunset", "timber", "violet", "willow"];

// Zapamatovatelná hesla — reálná česká slova (ASCII základ; s diakritikou
// varianta se přidává nahrazením přes CS_DIACRITICS).
const CS_WORDS = ["pes", "kocka", "strom", "hrad", "les", "rika", "more", "slunce", "mesic", "hvezda", "kamen", "kvetina", "ptak", "ryba", "jelen", "medved", "kral", "rytir", "zamek", "klic", "dum", "okno", "brana", "cesta", "most", "lod", "ohen", "voda", "zeme", "vitr", "dest", "snih", "jaro", "leto", "podzim", "zima", "noc", "rano", "vecer", "kniha", "pero", "mapa", "kompas", "lampa", "kolo", "vlak", "auto", "balon", "raketa", "planeta", "galaxie", "odvaha", "moudrost", "sila"];
const CS_DIACRITICS: Record<string, string> = { kocka: "kočka", rika: "řeka", more: "moře", mesic: "měsíc", hvezda: "hvězda", kamen: "kámen", kvetina: "květina", ptak: "pták", medved: "medvěď", kral: "král", rytir: "rytíř", zamek: "zámek", klic: "klíč", dum: "dům", brana: "brána", lod: "loď", ohen: "oheň", zeme: "země", vitr: "vítr", dest: "déšť", snih: "sníh", rano: "ráno", vecer: "večer", raketa: "raketa", sila: "síla" };

const DIACRITICS_LOWER = "áčďéěíňóřšťúůýž";
const DIACRITICS_UPPER = "ÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ";

const LBL: Record<Locale, { local: string; modeChars: string; modeWords: string; modeMemorable: string; length: string; lower: string; upper: string; numbers: string; symbols: string; ambiguous: string; diacritics: string; generate: string; placeholder: string; strength: string; chooseCharset: string; passwordCopied: string; entropyLabel: string }> = {
  cs: { local: "Lokální", modeChars: "Náhodné znaky", modeWords: "Heslová fráze", modeMemorable: "Zapamatovatelné (česky)", length: "Délka", lower: "Malá písmena (a-z)", upper: "Velká písmena (A-Z)", numbers: "Číslice (0-9)", symbols: "Speciální znaky", ambiguous: "Vynechat podobné znaky (0/O, 1/l/I)", diacritics: "Háčky a čárky (á, č, ř…)", generate: "Generovat", placeholder: "Stiskněte Generovat", strength: "Síla hesla", chooseCharset: "Vyberte alespoň jednu skupinu znaků.", passwordCopied: "Heslo bylo zkopírováno.", entropyLabel: "Odhad entropie: {bits} bitů" },
  en: { local: "Local", modeChars: "Random characters", modeWords: "Passphrase", modeMemorable: "Memorable (Czech words)", length: "Length", lower: "Lowercase (a-z)", upper: "Uppercase (A-Z)", numbers: "Digits (0-9)", symbols: "Special characters", ambiguous: "Exclude ambiguous (0/O, 1/l/I)", diacritics: "Czech diacritics (á, č, ř…)", generate: "Generate", placeholder: "Press Generate", strength: "Password strength", chooseCharset: "Select at least one character set.", passwordCopied: "Password copied.", entropyLabel: "Estimated entropy: {bits} bits" },
  de: { local: "Lokal", modeChars: "Zufällige Zeichen", modeWords: "Passphrase", modeMemorable: "Merken (tschechisch)", length: "Länge", lower: "Kleinbuchstaben (a-z)", upper: "Großbuchstaben (A-Z)", numbers: "Ziffern (0-9)", symbols: "Sonderzeichen", ambiguous: "Ähnliche Zeichen ausschließen (0/O, 1/l/I)", diacritics: "Tschechische Diakritik (á, č, ř…)", generate: "Generieren", placeholder: "Generieren drücken", strength: "Passwortstärke", chooseCharset: "Wählen Sie mindestens einen Zeichensatz.", passwordCopied: "Passwort kopiert.", entropyLabel: "Geschätzte Entropie: {bits} Bits" },
  es: { local: "Local", modeChars: "Caracteres aleatorios", modeWords: "Frase de contraseña", modeMemorable: "Memorable (checo)", length: "Longitud", lower: "Minúsculas (a-z)", upper: "Mayúsculas (A-Z)", numbers: "Dígitos (0-9)", symbols: "Caracteres especiales", ambiguous: "Excluir ambiguos (0/O, 1/l/I)", diacritics: "Diacríticos checos (á, č, ř…)", generate: "Generar", placeholder: "Pulse Generar", strength: "Fortaleza", chooseCharset: "Seleccione al menos un juego de caracteres.", passwordCopied: "Contraseña copiada.", entropyLabel: "Entropía estimada: {bits} bits" },
  uk: { local: "Локально", modeChars: "Випадкові символи", modeWords: "Парольна фраза", modeMemorable: "Запам'ятовуване (чеська)", length: "Довжина", lower: "Нижній регістр (a-z)", upper: "Верхній регістр (A-Z)", numbers: "Цифри (0-9)", symbols: "Спецсимволи", ambiguous: "Виключити схожі (0/O, 1/l/I)", diacritics: "Чеські діакритики (á, č, ř…)", generate: "Згенерувати", placeholder: "Натисніть Згенерувати", strength: "Міцність", chooseCharset: "Оберіть хоча б один набір символів.", passwordCopied: "Пароль скопійовано.", entropyLabel: "Оцінка ентропії: {bits} біт" },
  fr: { local: "Local", modeChars: "Caractères aléatoires", modeWords: "Phrase-clé", modeMemorable: "Mémorisable (tchèque)", length: "Longueur", lower: "Minuscules (a-z)", upper: "Majuscules (A-Z)", numbers: "Chiffres (0-9)", symbols: "Caractères spéciaux", ambiguous: "Exclure ambigus (0/O, 1/l/I)", diacritics: "Diacritiques tchèques (á, č, ř…)", generate: "Générer", placeholder: "Appuyez sur Générer", strength: "Robustesse", chooseCharset: "Sélectionnez au moins un jeu de caractères.", passwordCopied: "Mot de passe copié.", entropyLabel: "Entropie estimée : {bits} bits" },
  sk: { local: "Lokálne", modeChars: "Náhodné znaky", modeWords: "Heslová fráza", modeMemorable: "Zapamätateľné (česky)", length: "Dĺžka", lower: "Malé písmená (a-z)", upper: "Veľké písmená (A-Z)", numbers: "Číslice (0-9)", symbols: "Špeciálne znaky", ambiguous: "Vynechať zamieňateľné (0/O, 1/l/I)", diacritics: "Mäkčene a dĺžne (á, č, ř…)", generate: "Vygenerovať", placeholder: "Stlačte Vygenerovať", strength: "Sila hesla", chooseCharset: "Vyberte aspoň jednu skupinu znakov.", passwordCopied: "Heslo bolo skopírované.", entropyLabel: "Odhad entropie: {bits} bitov" },
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
  const [diacritics, setDiacritics] = useState(false);
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

  /** Zapamatovatelné heslo: dvě reálná česká slova + číslo, které dává smysl
      (rok, věk, nebo krátké číslo) — např. „Zeleny42Kaktus“ / „Řeka1990Hrad“. */
  function memorable(): { value: string; bits: number } {
    const w = (withDia: boolean) => {
      const base = CS_WORDS[randomIndex(CS_WORDS.length)];
      const word = withDia ? (CS_DIACRITICS[base] ?? base) : base;
      return word.charAt(0).toUpperCase() + word.slice(1);
    };
    // číslo, které dává smysl: rok (1950–2029), věk (18–99) nebo 2–3 číslice
    const kind = randomIndex(3);
    let num: string;
    if (kind === 0) num = String(1950 + randomIndex(80)); // rok
    else if (kind === 1) num = String(18 + randomIndex(82)); // věk
    else num = String(10 + randomIndex(990)); // 10–999
    const value = `${w(diacritics)}${num}${w(diacritics)}`;
    // entropie: 2 slova + číslo (rok/rok-rozsah/3 číslice ≈ ~10 bitů)
    const bits = Math.round(2 * Math.log2(CS_WORDS.length) + 10);
    return { value, bits };
  }

  function generate() {
    if (mode === "memorable") {
      const { value, bits } = memorable();
      setOut(value);
      showStrength(bits, 3);
      return;
    }
    if (mode === "words") {
      const words: string[] = [];
      for (let w = 0; w < 5; w++) words.push(WORDS[randomIndex(WORDS.length)]);
      const val = words.join("-");
      setOut(val);
      showStrength(Math.round(5 * Math.log2(WORDS.length)), 4);
      return;
    }
    let chars = "";
    if (lower) chars += "abcdefghijklmnopqrstuvwxyz" + (diacritics ? DIACRITICS_LOWER : "");
    if (upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + (diacritics ? DIACRITICS_UPPER : "");
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
          <span className="field-label">Režim</span>
          <select className="select" id="pw-mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="chars">{L.modeChars}</option>
            <option value="memorable">{L.modeMemorable}</option>
            <option value="words">{L.modeWords}</option>
          </select>
        </label>
        {mode === "chars" ? (
          <>
            <div className="row-between">
              <span style={{ fontSize: "0.875rem" }}>{L.length}: <span id="pw-len-label">{length}</span></span>
              <input type="range" min={4} max={64} value={length} id="pw-length" onChange={(e) => setLength(parseInt(e.target.value, 10))} />
            </div>
            <label className="pw-opt row-between"><span>{L.lower}</span><input type="checkbox" id="pw-lower" checked={lower} onChange={(e) => setLower(e.target.checked)} /></label>
            <label className="pw-opt row-between"><span>{L.upper}</span><input type="checkbox" id="pw-upper" checked={upper} onChange={(e) => setUpper(e.target.checked)} /></label>
            <label className="pw-opt row-between"><span>{L.numbers}</span><input type="checkbox" id="pw-numbers" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} /></label>
            <label className="pw-opt row-between"><span>{L.symbols}</span><input type="checkbox" id="pw-symbols" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /></label>
            <label className="pw-opt row-between"><span>{L.ambiguous}</span><input type="checkbox" id="pw-ambiguous" checked={ambiguous} onChange={(e) => setAmbiguous(e.target.checked)} /></label>
            <label className="pw-opt row-between"><span>{L.diacritics}</span><input type="checkbox" id="pw-diacritics" checked={diacritics} onChange={(e) => setDiacritics(e.target.checked)} /></label>
          </>
        ) : mode === "memorable" ? (
          // Zapamatovatelné heslo: volí se jen diakritika (česká slova s háčky
          // a čárkami); délka a znakové sady dávají v tomto režimu smysl jen
          // nepřímo.
          <label className="pw-opt row-between"><span>{L.diacritics}</span><input type="checkbox" id="pw-diacritics" checked={diacritics} onChange={(e) => setDiacritics(e.target.checked)} /></label>
        ) : null}
      </div>

      <button className="btn btn-primary btn-block" id="pw-generate" type="button" onClick={generate}>{L.generate}</button>
    </div>
  );
}