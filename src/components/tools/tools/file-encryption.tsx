"use client";

// Šifrování souborů — port legacy tools/assets/js/tools/file-encryption.js
// AES-256-GCM (PBKDF2), čistě client-side (Web Crypto).
// Formát: magic[8] = "VEVITENC" + version[1] + salt[16] + iv[12] + ciphertext(+GCM tag)
import { useEffect, useRef, useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, Icon, fmtSize, ProgressBar, ResultCard, toastSuccess } from "@/components/tools/tool-runtime";

type Mode = "enc" | "dec";

const MAGIC = new Uint8Array([0x56, 0x45, 0x56, 0x49, 0x54, 0x45, 0x4e, 0x43]); // "VEVITENC"
const VER = 1;
const MAX = 200 * 1024 * 1024;

const LBL: Record<Locale, { local: string; enc: string; dec: string; dropEnc: string; dropDec: string; hint: string; pass: string; runEnc: string; runDec: string; errNoPass: string; errTooLarge: string; errBadMagic: string; errBadVer: string; errDecrypt: string; errEncrypt: string; note: string; remove: string; okEnc: string; okDec: string }> = {
  cs: { local: "Lokální", enc: "Zašifrovat", dec: "Dešifrovat", dropEnc: "Přetáhněte soubor k zašifrování", dropDec: "Přetáhněte .vevitenc k dešifrování", hint: "Šifrováno AES-256-GCM, klíč odvozen z hesla (PBKDF2)", pass: "Heslo", runEnc: "Zašifrovat a stáhnout", runDec: "Dešifrovat a stáhnout", errNoPass: "Zadejte heslo.", errTooLarge: "Soubor je příliš velký (max {limit}).", errBadMagic: "Soubor není platný .vevitenc (chybný formát).", errBadVer: "Nepodporovaná verze formátu ({ver}).", errDecrypt: "Dešifrování selhalo — špatné heslo nebo poškozený soubor.", errEncrypt: "Šifrování selhalo.", note: "Výstup: .vevitenc (magic + salt[16B] + IV[12B] + ciphertext+tag). Bez hesla soubor neobnovíte — uchovávejte ho bezpečně. Běží lokálně přes Web Crypto.", remove: "Odebrat", okEnc: "Soubor zašifrován", okDec: "Soubor dešifrován" },
  en: { local: "Local", enc: "Encrypt", dec: "Decrypt", dropEnc: "Drop a file to encrypt", dropDec: "Drop a .vevitenc to decrypt", hint: "AES-256-GCM, key derived from password (PBKDF2)", pass: "Password", runEnc: "Encrypt and download", runDec: "Decrypt and download", errNoPass: "Enter a password.", errTooLarge: "File is too large (max {limit}).", errBadMagic: "Not a valid .vevitenc file (bad format).", errBadVer: "Unsupported format version ({ver}).", errDecrypt: "Decryption failed — wrong password or corrupted file.", errEncrypt: "Encryption failed.", note: "Output: .vevitenc (magic + salt[16B] + IV[12B] + ciphertext+tag). Without the password the file cannot be recovered — keep it safe. Runs locally via Web Crypto.", remove: "Remove", okEnc: "File encrypted", okDec: "File decrypted" },
  de: { local: "Lokal", enc: "Verschlüsseln", dec: "Entschlüsseln", dropEnc: "Datei zum Verschlüsseln ablegen", dropDec: ".vevitenc zum Entschlüsseln ablegen", hint: "AES-256-GCM, Schlüssel aus Passwort (PBKDF2)", pass: "Passwort", runEnc: "Verschlüsseln und herunterladen", runDec: "Entschlüsseln und herunterladen", errNoPass: "Geben Sie ein Passwort ein.", errTooLarge: "Datei ist zu groß (max {limit}).", errBadMagic: "Keine gültige .vevitenc-Datei (falsches Format).", errBadVer: "Nicht unterstützte Formatversion ({ver}).", errDecrypt: "Entschlüsselung fehlgeschlagen — falsches Passwort oder beschädigte Datei.", errEncrypt: "Verschlüsselung fehlgeschlagen.", note: "Ausgabe: .vevitenc (Magic + Salt[16B] + IV[12B] + Chiffre+Tag). Ohne Passwort nicht wiederherstellbar — sicher aufbewahren. Läuft lokal über Web Crypto.", remove: "Entfernen", okEnc: "Datei verschlüsselt", okDec: "Datei entschlüsselt" },
  es: { local: "Local", enc: "Cifrar", dec: "Descifrar", dropEnc: "Suelta un archivo para cifrar", dropDec: "Suelta un .vevitenc para descifrar", hint: "AES-256-GCM, clave derivada de contraseña (PBKDF2)", pass: "Contraseña", runEnc: "Cifrar y descargar", runDec: "Descifrar y descargar", errNoPass: "Introduzca una contraseña.", errTooLarge: "El archivo es demasiado grande (máx {limit}).", errBadMagic: "No es un archivo .vevitenc válido (formato incorrecto).", errBadVer: "Versión de formato no soportada ({ver}).", errDecrypt: "Descifrado fallido — contraseña incorrecta o archivo corrupto.", errEncrypt: "Cifrado fallido.", note: "Salida: .vevitenc (magic + salt[16B] + IV[12B] + cifrado+tag). Sin contraseña no se puede recuperar — guárdalo seguro. Se ejecuta localmente vía Web Crypto.", remove: "Quitar", okEnc: "Archivo cifrado", okDec: "Archivo descifrado" },
  uk: { local: "Локально", enc: "Шифрувати", dec: "Розшифрувати", dropEnc: "Перетягніть файл для шифрування", dropDec: "Перетягніть .vevitenc для розшифрування", hint: "AES-256-GCM, ключ з пароля (PBKDF2)", pass: "Пароль", runEnc: "Зашифрувати і завантажити", runDec: "Розшифрувати і завантажити", errNoPass: "Введіть пароль.", errTooLarge: "Файл завеликий (макс {limit}).", errBadMagic: "Неприпустимий .vevitenc (неправильний формат).", errBadVer: "Непідтримувана версія формату ({ver}).", errDecrypt: "Розшифрування не вдалося — неправильний пароль або пошкоджений файл.", errEncrypt: "Шифрування не вдалося.", note: "Вивід: .vevitenc (magic + salt[16B] + IV[12B] + шифр+tag). Без пароля файл не відновити — зберігайте безпечно. Працює локально через Web Crypto.", remove: "Видалити", okEnc: "Файл зашифровано", okDec: "Файл розшифровано" },
  fr: { local: "Local", enc: "Chiffrer", dec: "Déchiffrer", dropEnc: "Déposez un fichier à chiffrer", dropDec: "Déposez un .vevitenc à déchiffrer", hint: "AES-256-GCM, clé dérivée du mot de passe (PBKDF2)", pass: "Mot de passe", runEnc: "Chiffrer et télécharger", runDec: "Déchiffrer et télécharger", errNoPass: "Saisissez un mot de passe.", errTooLarge: "Fichier trop volumineux (max {limit}).", errBadMagic: "Fichier .vevitenc invalide (mauvais format).", errBadVer: "Version de format non supportée ({ver}).", errDecrypt: "Échec du déchiffrement — mauvais mot de passe ou fichier corrompu.", errEncrypt: "Échec du chiffrement.", note: "Sortie : .vevitenc (magic + salt[16B] + IV[12B] + chiffré+tag). Sans mot de passe, irrécupérable — conservez-le en sécurité. S'exécute localement via Web Crypto.", remove: "Retirer", okEnc: "Fichier chiffré", okDec: "Fichier déchiffré" },
  sk: { local: "Lokálne", enc: "Šifrovať", dec: "Dešifrovať", dropEnc: "Pretiahnite súbor na zašifrovanie", dropDec: "Pretiahnite .vevitenc na dešifrovanie", hint: "AES-256-GCM, kľúč odvodený z hesla (PBKDF2)", pass: "Heslo", runEnc: "Zašifrovať a stiahnuť", runDec: "Dešifrovať a stiahnuť", errNoPass: "Zadajte heslo.", errTooLarge: "Súbor je príliš veľký (max {limit}).", errBadMagic: "Súbor nie je platný .vevitenc (chybný formát).", errBadVer: "Nepodporovaná verzia formátu ({ver}).", errDecrypt: "Dešifrovanie zlyhalo — zlé heslo alebo poškodený súbor.", errEncrypt: "Šifrovanie zlyhalo.", note: "Výstup: .vevitenc (magic + salt[16B] + IV[12B] + ciphertext+tag). Bez hesla súbor neobnovíte — uchovávajte ho bezpečne. Beží lokálne cez Web Crypto.", remove: "Odstrániť", okEnc: "Súbor zašifrovaný", okDec: "Súbor dešifrovaný" },
};

async function deriveKey(pw: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as BufferSource, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export default function FileEncryption({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  const { t } = useToolUi(locale);
  const [mode, setMode] = useState<Mode>("enc");
  const [file, setFile] = useState<File | null>(null);
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ value: number; label: string } | null>(null);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  function fail(m: string) { setError(m); }
  function clearErr() { setError(""); }

  function onFiles(list: FileList | null) {
    if (!list || !list.length) return;
    clearErr();
    const f = list[0];
    if (f.size > MAX) { fail(L.errTooLarge.replace("{limit}", fmtSize(MAX))); return; }
    setFile(f);
  }

  function onMode(m: Mode) {
    setMode(m);
    setFile(null);
    clearErr();
  }

  function removeFile() { setFile(null); }

  async function run() {
    if (!file) return;
    if (!pass) { fail(L.errNoPass); return; }
    clearErr();
    setProgress({ value: 10, label: mode === "enc" ? "Načítám soubor…" : "Načítám šifrovaný soubor…" });
    try {
      const buf = await file.arrayBuffer();
      const r = mode === "enc" ? await encrypt(buf) : await decrypt(buf);
      setProgress(null);
      if (result) URL.revokeObjectURL(result.url);
      const url = URL.createObjectURL(r.blob);
      setResult({ url, name: r.name, size: r.blob.size });
      toastSuccess(mode === "enc" ? L.okEnc : L.okDec);
    } catch (e) {
      setProgress(null);
      const msg = e instanceof Error ? e.message : (mode === "dec" ? L.errDecrypt : L.errEncrypt);
      fail(msg);
    }
  }

  async function encrypt(buf: ArrayBuffer): Promise<{ blob: Blob; name: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    setProgress({ value: 25, label: "Odvozuji klíč (PBKDF2)…" });
    const key = await deriveKey(pass, salt);
    setProgress({ value: 50, label: "Šifruji (AES-256-GCM)…" });
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, buf));
    const out = new Uint8Array(MAGIC.length + 1 + salt.length + iv.length + cipher.length);
    out.set(MAGIC, 0); out[8] = VER; out.set(salt, 9); out.set(iv, 25); out.set(cipher, 37);
    return { blob: new Blob([out], { type: "application/octet-stream" }), name: (file?.name || "soubor") + ".vevitenc" };
  }

  async function decrypt(buf: ArrayBuffer): Promise<{ blob: Blob; name: string }> {
    const data = new Uint8Array(buf);
    for (let i = 0; i < MAGIC.length; i++) if (data[i] !== MAGIC[i]) throw new Error(L.errBadMagic);
    const ver = data[8];
    if (ver !== VER) throw new Error(L.errBadVer.replace("{ver}", String(ver)));
    const salt = data.slice(9, 25), iv = data.slice(25, 37), cipher = data.slice(37);
    setProgress({ value: 25, label: "Odvozuji klíč (PBKDF2)…" });
    const key = await deriveKey(pass, salt);
    setProgress({ value: 55, label: "Dešifruji…" });
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, cipher as BufferSource);
    const name = (file?.name.replace(/\.vevitenc$/i, "") || "soubor");
    return { blob: new Blob([plain], { type: "application/octet-stream" }), name };
  }

  const dropTitle = mode === "enc" ? L.dropEnc : L.dropDec;
  const runLabel = mode === "enc" ? L.runEnc : L.runDec;

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="seg" id="fe-mode" role="tablist">
        <button type="button" className={mode === "enc" ? "active" : ""} data-mode="enc" role="tab" aria-selected={mode === "enc"} onClick={() => onMode("enc")}>{L.enc}</button>
        <button type="button" className={mode === "dec" ? "active" : ""} data-mode="dec" role="tab" aria-selected={mode === "dec"} onClick={() => onMode("dec")}>{L.dec}</button>
      </div>

      <div
        className={`dropzone${dragOver ? " dragover" : ""}`}
        id="fe-drop"
        role="button"
        tabIndex={0}
        aria-label={dropTitle}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
        onDragEnd={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      >
        <span className="dz-ico"><Icon name="Upload" size={28} /></span>
        <span className="dz-title" id="fe-drop-title">{dropTitle}</span>
        <span className="dz-hint">{L.hint}</span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          aria-hidden="true"
          accept={mode === "dec" ? ".vevitenc,application/octet-stream" : "*"}
          onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      <div className={`file-list${file ? "" : " hidden"}`} id="fe-list">
        {file ? (
          <div className="file-item">
            <span className="fi-ico"><Icon name="File" size={18} /></span>
            <span className="fi-meta">
              <span className="fi-name">{file.name}</span>
              <span className="fi-size">{fmtSize(file.size)}</span>
            </span>
            <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: file.name })} onClick={removeFile}>
              <Icon name="X" size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="fe-pass">{L.pass}</label>
        <input className="input" id="fe-pass" type="password" placeholder={`${L.pass}…`} autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} />
      </div>

      <button className="btn btn-primary btn-touch" id="fe-run" type="button" disabled={!file || !pass} onClick={run}>
        <Icon name="Check" size={18} /> <span id="fe-run-label">{runLabel}</span>
      </button>

      {progress ? <ProgressBar value={progress.value} label={progress.label} /> : null}

      {result ? (
        <ResultCard
          title={result.name}
          sub={`${fmtSize(result.size)}`}
          downloadHref={result.url}
          downloadName={result.name}
          onReset={() => { URL.revokeObjectURL(result.url); setResult(null); }}
          locale={locale}
        />
      ) : null}

      <p className={`error-text${error ? "" : " hidden"}`} id="fe-error" role="alert">{error}</p>
      <p className="muted" style={{ fontSize: "0.8rem" }}>{L.note}</p>
    </div>
  );
}