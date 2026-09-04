"use client";

// Kontrola úniku hesla — port legacy tools/assets/js/tools/password-breach-check.js
// HIBP k-anonymity: SHA-1 → ven se pošle jen prvních 5 znaků, porovnání lokálně.
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, Icon, ProgressBar } from "@/components/tools/tool-runtime";

const LBL: Record<Locale, { local: string; label: string; ph: string; show: string; run: string; progSha: string; progQuery: string; progDone: string; found: string; safe: string; foundDetail: string; safeDetail: string; errNoPass: string; note: string }> = {
  cs: { local: "Lokální", label: "Heslo ke kontrole", ph: "Zadejte heslo…", show: "Zobrazit/skrýt", run: "Zkontrolovat únik", progSha: "Počítám SHA-1…", progQuery: "Dotazuji HIBP (prefix {p})…", progDone: "Hotovo", found: "⚠ Heslo uniklo!", safe: "✓ Heslo nebylo nalezeno v únicích", foundDetail: "Toto heslo se objevilo ve {n} únicích. Doporučujeme ho změnit a nepoužívat znovu.", safeDetail: "V databázi HIBP (Have I Been Pwned) nebyla nalezena shoda. To neznamená absolutní bezpečnost — heslo stejně nikdy nesdílejte.", errNoPass: "Zadejte heslo.", note: "Metoda k-anonymity (HIBP): z hesla se spočítá SHA-1 a ven se pošle jen prvních 5 znaků hashe, nikoliv heslo samotné. Odpověď se porovnává lokálně. Běží přes HTTPS na api.pwnedpasswords.com." },
  en: { local: "Local", label: "Password to check", ph: "Enter password…", show: "Show/hide", run: "Check breach", progSha: "Computing SHA-1…", progQuery: "Querying HIBP (prefix {p})…", progDone: "Done", found: "⚠ Password leaked!", safe: "✓ Password not found in breaches", foundDetail: "This password appeared in {n} breaches. We recommend changing it and not reusing it.", safeDetail: "No match in the HIBP (Have I Been Pwned) database. This does not mean absolute safety — never share your password.", errNoPass: "Enter a password.", note: "k-anonymity method (HIBP): a SHA-1 is computed from the password and only the first 5 characters of the hash are sent, never the password itself. The response is compared locally. Runs over HTTPS to api.pwnedpasswords.com." },
  de: { local: "Lokal", label: "Zu prüfendes Passwort", ph: "Passwort eingeben…", show: "Anzeigen/Verbergen", run: "Leck prüfen", progSha: "Berechne SHA-1…", progQuery: "Frage HIBP ab (Präfix {p})…", progDone: "Fertig", found: "⚠ Passwort geleakt!", safe: "✓ Passwort in keinem Leak gefunden", foundDetail: "Dieses Passwort erschien in {n} Lecks. Wir empfehlen, es zu ändern und nicht wiederzuverwenden.", safeDetail: "Kein Treffer in der HIBP-Datenbank. Das bedeutet keine absolute Sicherheit — teilen Sie Ihr Passwort nie.", errNoPass: "Geben Sie ein Passwort ein.", note: "k-Anonymitätsmethode (HIBP): Aus dem Passwort wird SHA-1 berechnet und nur die ersten 5 Zeichen des Hashs gesendet, niemals das Passwort selbst. Die Antwort wird lokal verglichen. Läuft über HTTPS zu api.pwnedpasswords.com." },
  es: { local: "Local", label: "Contraseña a comprobar", ph: "Introduzca contraseña…", show: "Mostrar/ocultar", run: "Comprobar fuga", progSha: "Calculando SHA-1…", progQuery: "Consultando HIBP (prefijo {p})…", progDone: "Hecho", found: "⚠ ¡Contraseña filtrada!", safe: "✓ Contraseña no encontrada en fugas", foundDetail: "Esta contraseña apareció en {n} fugas. Recomendamos cambiarla y no reutilizarla.", safeDetail: "Sin coincidencias en la base de datos HIBP. No significa seguridad absoluta — nunca comparta su contraseña.", errNoPass: "Introduzca una contraseña.", note: "Método k-anonimidad (HIBP): se calcula SHA-1 y solo se envían los primeros 5 caracteres del hash, nunca la contraseña. La respuesta se compara localmente. vía HTTPS a api.pwnedpasswords.com." },
  uk: { local: "Локально", label: "Пароль для перевірки", ph: "Введіть пароль…", show: "Показати/приховати", run: "Перевірити витік", progSha: "Обчислюю SHA-1…", progQuery: "Запит до HIBP (префікс {p})…", progDone: "Готово", found: "⚠ Пароль витік!", safe: "✓ Пароль не знайдено у витоках", foundDetail: "Цей пароль з'явився у {n} витоках. Рекомендуємо змінити його та не використовувати повторно.", safeDetail: "У базі HIBP збігу не знайдено. Це не означає абсолютної безпеки — ніколи не діліться паролем.", errNoPass: "Введіть пароль.", note: "Метод k-анонімності (HIBP): обчислюється SHA-1 і надсилаються лише перші 5 символів хешу, а не сам пароль. Відповідь порівнюється локально. Через HTTPS до api.pwnedpasswords.com." },
  fr: { local: "Local", label: "Mot de passe à vérifier", ph: "Saisissez le mot de passe…", show: "Afficher/masquer", run: "Vérifier la fuite", progSha: "Calcul du SHA-1…", progQuery: "Interrogation HIBP (préfixe {p})…", progDone: "Terminé", found: "⚠ Mot de passe fuité !", safe: "✓ Mot de passe absent des fuites", foundDetail: "Ce mot de passe est apparu dans {n} fuites. Nous recommandons de le changer et de ne pas le réutiliser.", safeDetail: "Aucune correspondance dans la base HIBP. Cela ne signifie pas une sécurité absolue — ne partagez jamais votre mot de passe.", errNoPass: "Saisissez un mot de passe.", note: "Méthode k-anonymité (HIBP) : un SHA-1 est calculé et seuls les 5 premiers caractères du hash sont envoyés, jamais le mot de passe. La réponse est comparée localement. Via HTTPS vers api.pwnedpasswords.com." },
  sk: { local: "Lokálne", label: "Heslo na kontrolu", ph: "Zadajte heslo…", show: "Zobraziť/skryť", run: "Skontrolovať únik", progSha: "Počítam SHA-1…", progQuery: "Dotazujem HIBP (prefix {p})…", progDone: "Hotovo", found: "⚠ Heslo uniklo!", safe: "✓ Heslo nebolo nájdené v únikoch", foundDetail: "Toto heslo sa objavilo v {n} únikoch. Odporúčame ho zmeniť a nepoužívať znovu.", safeDetail: "V databáze HIBP sa nenašla zhoda. To neznamená absolútnu bezpečnosť — heslo nikdy nezdieľajte.", errNoPass: "Zadajte heslo.", note: "Metóda k-anonymity (HIBP): z hesla sa spočíta SHA-1 a von sa pošle len prvých 5 znakov hashe, nie heslo samotné. Odpoveď sa porovnáva lokálne. Beží cez HTTPS na api.pwnedpasswords.com." },
};

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export default function PasswordBreachCheck({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  void useToolUi(locale);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState<{ value: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ found: number } | null>(null);

  async function run() {
    setError("");
    if (!pw) { setError(L.errNoPass); return; }
    setResult(null);
    setProgress({ value: 20, label: L.progSha });
    try {
      const h = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pw));
      const full = hex(h);
      const prefix = full.substr(0, 5);
      const suffix = full.substr(5);
      setProgress({ value: 45, label: L.progQuery.replace("{p}", prefix) });
      const r = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!r.ok) throw new Error(`HIBP ${r.status}`);
      const text = await r.text();
      let found = 0;
      text.split(/\r?\n/).forEach((line) => {
        const parts = line.split(":");
        if (parts[0] === suffix) found = parseInt(parts[1], 10) || 0;
      });
      setProgress({ value: 100, label: L.progDone });
      setProgress(null);
      setResult({ found });
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : L.errNoPass);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="bp-pass">{L.label}</label>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input className="input" id="bp-pass" type={show ? "text" : "password"} placeholder={L.ph} autoComplete="off" style={{ flex: 1 }} value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn btn-ghost" id="bp-toggle" type="button" aria-label={L.show} onClick={() => setShow((s) => !s)}>
            <Icon name={show ? "EyeOff" : "Eye"} size={16} />
          </button>
        </div>
      </div>
      <button className="btn btn-primary btn-touch" id="bp-run" type="button" onClick={run}>{L.run}</button>
      {progress ? <ProgressBar value={progress.value} label={progress.label} /> : null}
      <div className="glass" style={{ borderRadius: "0.75rem", padding: "1rem" }} id="bp-result" hidden={!result}>
        {result ? (
          <>
            <p id="bp-status" style={{ fontSize: "1.1rem", color: result.found ? "#ef4444" : "#22c55e" }}>
              {result.found ? L.found : L.safe}
            </p>
            <p className="muted" id="bp-detail" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
              {result.found ? L.foundDetail.replace("{n}", result.found.toLocaleString(locale === "en" ? "en-US" : "cs-CZ")) : L.safeDetail}
            </p>
          </>
        ) : null}
      </div>
      <p className={`error-text${error ? "" : " hidden"}`} id="bp-error" role="alert">{error}</p>
      <p className="muted" style={{ fontSize: "0.8rem" }}>{L.note}</p>
    </div>
  );
}