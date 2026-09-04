"use client";

// Šifrování textu — port legacy tools/assets/js/tools/encrypt-decrypt.js
// AES-256-GCM + PBKDF2 (Web Crypto SubtleCrypto). Čistě client-side.
// Formát výstupu: base64( salt[16] || iv[12] || ciphertext||tag )
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, useCopy, Icon } from "@/components/tools/tool-runtime";

type Mode = "enc" | "dec";

const LBL: Record<Locale, { local: string; enc: string; dec: string; text: string; pass: string; runEnc: string; runDec: string; clear: string; output: string; copy: string; phEnc: string; phDec: string; showPass: string; privacy: string; errNoTextEnc: string; errNoTextDec: string; errNoPass: string; errBadB64: string; errShort: string; errDecrypt: string; errUnexpected: string; errNoCrypto: string }> = {
  cs: { local: "Lokální", enc: "Šifrovat", dec: "Dešifrovat", text: "Text", pass: "Heslo / klíč", runEnc: "Zašifrovat", runDec: "Dešifrovat", clear: "Vyčistit", output: "Výstup", copy: "Kopírovat", phEnc: "Text k zašifrování…", phDec: "Base64 šifrový text k dešifrování…", showPass: "Zobrazit heslo", privacy: "Šifrování probíhá lokálně přes Web Crypto (AES-256-GCM + PBKDF2). Heslo ani text neopustí váš prohlížeč.", errNoTextEnc: "Vložte text k zašifrování.", errNoTextDec: "Vložte šifrový text.", errNoPass: "Zadejte heslo.", errBadB64: "Vstup není platný Base64.", errShort: "Šifrový text je příliš krátký nebo poškozen.", errDecrypt: "Dešifrování selhalo — pravděpodobně nesprávné heslo nebo poškozený text.", errUnexpected: "Neočekávaná chyba: {msg}", errNoCrypto: "Váš prohlížeč nepodporuje Web Crypto. Nástroj vyžaduje HTTPS (nebo localhost)." },
  en: { local: "Local", enc: "Encrypt", dec: "Decrypt", text: "Text", pass: "Password / key", runEnc: "Encrypt", runDec: "Decrypt", clear: "Clear", output: "Output", copy: "Copy", phEnc: "Text to encrypt…", phDec: "Base64 ciphertext to decrypt…", showPass: "Show password", privacy: "Encryption runs locally via Web Crypto (AES-256-GCM + PBKDF2). Neither the password nor the text leave your browser.", errNoTextEnc: "Enter text to encrypt.", errNoTextDec: "Enter the ciphertext.", errNoPass: "Enter a password.", errBadB64: "Input is not valid Base64.", errShort: "Ciphertext is too short or corrupted.", errDecrypt: "Decryption failed — likely wrong password or corrupted text.", errUnexpected: "Unexpected error: {msg}", errNoCrypto: "Your browser does not support Web Crypto. This tool requires HTTPS (or localhost)." },
  de: { local: "Lokal", enc: "Verschlüsseln", dec: "Entschlüsseln", text: "Text", pass: "Passwort / Schlüssel", runEnc: "Verschlüsseln", runDec: "Entschlüsseln", clear: "Löschen", output: "Ausgabe", copy: "Kopieren", phEnc: "Zu verschlüsselnder Text…", phDec: "Base64-Chiffretext zum Entschlüsseln…", showPass: "Passwort anzeigen", privacy: "Verschlüsselung läuft lokal über Web Crypto (AES-256-GCM + PBKDF2). Passwort und Text verlassen den Browser nicht.", errNoTextEnc: "Geben Sie Text zum Verschlüsseln ein.", errNoTextDec: "Geben Sie den Chiffretext ein.", errNoPass: "Geben Sie ein Passwort ein.", errBadB64: "Eingabe ist kein gültiges Base64.", errShort: "Chiffretext zu kurz oder beschädigt.", errDecrypt: "Entschlüsselung fehlgeschlagen — wahrscheinlich falsches Passwort oder beschädigter Text.", errUnexpected: "Unerwarteter Fehler: {msg}", errNoCrypto: "Ihr Browser unterstützt Web Crypto nicht. HTTPS (oder localhost) erforderlich." },
  es: { local: "Local", enc: "Cifrar", dec: "Descifrar", text: "Texto", pass: "Contraseña / clave", runEnc: "Cifrar", runDec: "Descifrar", clear: "Limpiar", output: "Salida", copy: "Copiar", phEnc: "Texto a cifrar…", phDec: "Texto cifrado Base64 a descifrar…", showPass: "Mostrar contraseña", privacy: "El cifrado se ejecuta localmente vía Web Crypto (AES-256-GCM + PBKDF2). La contraseña ni el texto salen del navegador.", errNoTextEnc: "Introduzca texto a cifrar.", errNoTextDec: "Introduzca el texto cifrado.", errNoPass: "Introduzca una contraseña.", errBadB64: "La entrada no es Base64 válido.", errShort: "Texto cifrado demasiado corto o corrupto.", errDecrypt: "Descifrado fallido — probablemente contraseña incorrecta o texto corrupto.", errUnexpected: "Error inesperado: {msg}", errNoCrypto: "Su navegador no soporta Web Crypto. Requiere HTTPS (o localhost)." },
  uk: { local: "Локально", enc: "Шифрувати", dec: "Розшифрувати", text: "Текст", pass: "Пароль / ключ", runEnc: "Зашифрувати", runDec: "Розшифрувати", clear: "Очистити", output: "Вивід", copy: "Копіювати", phEnc: "Текст для шифрування…", phDec: "Base64 шифртекст для розшифрування…", showPass: "Показати пароль", privacy: "Шифрування відбувається локально через Web Crypto (AES-256-GCM + PBKDF2). Пароль і текст не залишають браузер.", errNoTextEnc: "Введіть текст для шифрування.", errNoTextDec: "Введіть шифртекст.", errNoPass: "Введіть пароль.", errBadB64: "Вхідні дані не є дійсним Base64.", errShort: "Шифртекст занадто короткий або пошкоджений.", errDecrypt: "Розшифрування не вдалося — ймовірно, невірний пароль або пошкоджений текст.", errUnexpected: "Неочікувана помилка: {msg}", errNoCrypto: "Ваш браузер не підтримує Web Crypto. Потрібен HTTPS (або localhost)." },
  fr: { local: "Local", enc: "Chiffrer", dec: "Déchiffrer", text: "Texte", pass: "Mot de passe / clé", runEnc: "Chiffrer", runDec: "Déchiffrer", clear: "Effacer", output: "Sortie", copy: "Copier", phEnc: "Texte à chiffrer…", phDec: "Texte chiffré Base64 à déchiffrer…", showPass: "Afficher le mot de passe", privacy: "Le chiffrement s'exécute localement via Web Crypto (AES-256-GCM + PBKDF2). Le mot de passe et le texte ne quittent pas le navigateur.", errNoTextEnc: "Saisissez le texte à chiffrer.", errNoTextDec: "Saisissez le texte chiffré.", errNoPass: "Saisissez un mot de passe.", errBadB64: "L'entrée n'est pas du Base64 valide.", errShort: "Texte chiffré trop court ou corrompu.", errDecrypt: "Échec du déchiffrement — mauvais mot de passe ou texte corrompu.", errUnexpected: "Erreur inattendue : {msg}", errNoCrypto: "Votre navigateur ne supporte pas Web Crypto. HTTPS (ou localhost) requis." },
  sk: { local: "Lokálne", enc: "Šifrovať", dec: "Dešifrovať", text: "Text", pass: "Heslo / kľúč", runEnc: "Zašifrovať", runDec: "Dešifrovať", clear: "Vyčistiť", output: "Výstup", copy: "Kopírovať", phEnc: "Text na zašifrovanie…", phDec: "Base64 šifrový text na dešifrovanie…", showPass: "Zobraziť heslo", privacy: "Šifrovanie prebieha lokálne cez Web Crypto (AES-256-GCM + PBKDF2). Heslo ani text neopustí váš prehliadač.", errNoTextEnc: "Vložte text na zašifrovanie.", errNoTextDec: "Vložte šifrový text.", errNoPass: "Zadajte heslo.", errBadB64: "Vstup nie je platný Base64.", errShort: "Šifrový text je príliš krátky alebo poškodený.", errDecrypt: "Dešifrovanie zlyhalo — pravdepodobne nesprávne heslo alebo poškodený text.", errUnexpected: "Neočakávaná chyba: {msg}", errNoCrypto: "Váš prehliadač nepodporuje Web Crypto. Nástroj vyžaduje HTTPS (alebo localhost)." },
};

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 250000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export default function EncryptDecrypt({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  void useToolUi(locale);
  const { copied, copy } = useCopy(locale);
  const [mode, setMode] = useState<Mode>("enc");
  const [input, setInput] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [out, setOut] = useState("");
  const [error, setError] = useState("");
  const [noCrypto, setNoCrypto] = useState(false);

  function showError(m: string) { setError(m); }
  function clearError() { setError(""); }

  async function run() {
    clearError();
    setOut("");
    try {
      if (mode === "enc") {
        if (!input) { showError(L.errNoTextEnc); return; }
        if (!pass) { showError(L.errNoPass); return; }
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(pass, salt);
        const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, new TextEncoder().encode(input)));
        const out8 = new Uint8Array(salt.length + iv.length + cipher.length);
        out8.set(salt, 0);
        out8.set(iv, salt.length);
        out8.set(cipher, salt.length + iv.length);
        setOut(bytesToB64(out8));
      } else {
        const raw = input.trim();
        if (!raw) { showError(L.errNoTextDec); return; }
        if (!pass) { showError(L.errNoPass); return; }
        let blob: Uint8Array;
        try { blob = b64ToBytes(raw); } catch { showError(L.errBadB64); return; }
        if (blob.length < 29) { showError(L.errShort); return; }
        const salt = blob.slice(0, 16);
        const iv = blob.slice(16, 28);
        const cipher = blob.slice(28);
        try {
          const key = await deriveKey(pass, salt);
          const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, cipher as BufferSource);
          setOut(new TextDecoder().decode(plain));
        } catch {
          showError(L.errDecrypt);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showError(L.errUnexpected.replace("{msg}", msg));
    }
  }

  function setModeFn(m: Mode) {
    setMode(m);
    clearError();
  }

  if (typeof window !== "undefined" && (!window.crypto || !crypto.subtle) && !noCrypto) {
    Promise.resolve().then(() => { setNoCrypto(true); showError(L.errNoCrypto); });
  }

  const ph = mode === "enc" ? L.phEnc : L.phDec;
  const runLabel = mode === "enc" ? L.runEnc : L.runDec;

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="seg" id="ed-mode" role="tablist" aria-label="Režim">
        <button type="button" className={mode === "enc" ? "active" : ""} data-mode="enc" role="tab" aria-selected={mode === "enc"} onClick={() => setModeFn("enc")}>{L.enc}</button>
        <button type="button" className={mode === "dec" ? "active" : ""} data-mode="dec" role="tab" aria-selected={mode === "dec"} onClick={() => setModeFn("dec")}>{L.dec}</button>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="ed-input">{L.text}</label>
        <textarea className="textarea input-mono" id="ed-input" placeholder={ph} style={{ minHeight: "9rem" }} value={input} onChange={(e) => { setInput(e.target.value); clearError(); }} />
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="ed-pass">{L.pass}</label>
        <div className="row">
          <input className="input" type={showPass ? "text" : "password"} id="ed-pass" placeholder={L.pass} autoComplete="off" style={{ flex: 1 }} value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); run(); } }} />
          <button className="btn btn-ghost btn-icon" type="button" id="ed-toggle" aria-label={L.showPass} onClick={() => setShowPass((s) => !s)}>
            <Icon name={showPass ? "EyeOff" : "Eye"} size={18} />
          </button>
        </div>
      </div>

      <div className="row">
        <button className="btn btn-primary btn-touch" id="ed-run" type="button" onClick={run} disabled={noCrypto}>
          <Icon name="Check" size={18} /> <span id="ed-run-label">{runLabel}</span>
        </button>
        <button className="btn btn-ghost" id="ed-clear" type="button" onClick={() => { setInput(""); setPass(""); setOut(""); clearError(); }}>
          <Icon name="X" size={16} /> {L.clear}
        </button>
      </div>

      <p className={`error-text${error ? "" : " hidden"}`} id="ed-error" role="alert">{error}</p>

      <div className="stack-sm">
        <div className="row-between">
          <span className="muted" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{L.output}</span>
          <button className="btn btn-ghost btn-sm" id="ed-copy" type="button" disabled={!out} onClick={() => copy(out)}>
            <Icon name={copied ? "Check" : "Copy"} size={16} /> <span className="label">{L.copy}</span>
          </button>
        </div>
        <textarea className="textarea input-mono" id="ed-output" readOnly placeholder="Výsledek se zobrazí zde…" style={{ minHeight: "9rem", background: "rgba(19,19,22,0.3)" }} value={out} onChange={() => {}} />
      </div>

      <div className="privacy-note">
        <Icon name="Check" size={16} /> {L.privacy}
      </div>
    </div>
  );
}