"use client";

// Kontrola úniku e-mailu — Have I Been Pwned styl (XposedOrNot API, bez klíče).
// Na rozdíl od password-breach-check (HIBP k-anonymity nad heslem) se tady
// dotazuje přímo e-mailová adresa proti databázi známých úniků.
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi } from "@/components/tools/tool-runtime";

interface Breach {
  breach: string;
  details?: string;
  date?: string;
  victims?: string | number;
}

const LBL: Record<Locale, {
  local: string; label: string; ph: string; run: string; running: string;
  found: string; foundOne: string; safe: string; safeDetail: string;
  errEmail: string; errApi: string; note: string; breachCount: string;
}> = {
  cs: {
    local: "Třetí strana", label: "E-mail ke kontrole", ph: "vas@email.cz", run: "Zkontrolovat úniky", running: "Kontroluji…",
    found: "⚠ Adresa se objevila v únicích!", foundOne: "⚠ Adresa se objevila v úniku!",
    safe: "✓ Žádné známé úniky", safeDetail: "K tomuto e-mailu nebyl v databázi XposedOrNot nalezen žádný zaznamenaný únik dat. To neznamená, že nikdy žádný nenastane — používejte jedinečná hesla a zapněte dvoufázové ověření.",
    errEmail: "Zadejte platnou e-mailovou adresu.", errApi: "Službu se nepodařilo zeptat (síť nebo API nedostupné). Zkuste to prosím znovu.",
    note: "Dotaz jde na api.xposedornot.com (databáze veřejných úniků dat, bez API klíče). Z adresy se posílá jen samotný e-mail, nic dalšího. Alternativou s detailnějšími daty je haveibeenpwned.com (vyžaduje klíč).",
    breachCount: "Úniky ({n})",
  },
  en: {
    local: "Third party", label: "Email to check", ph: "you@email.com", run: "Check breaches", running: "Checking…",
    found: "⚠ Address found in breaches!", foundOne: "⚠ Address found in a breach!",
    safe: "✓ No known breaches", safeDetail: "No recorded data breach was found for this email in the XposedOrNot database. That does not guarantee future safety — use unique passwords and enable two-factor authentication.",
    errEmail: "Enter a valid email address.", errApi: "Could not reach the service (network or API unavailable). Please try again.",
    note: "The query goes to api.xposedornot.com (public data-breach database, no API key). Only the email itself is sent. For more detailed data see haveibeenpwned.com (requires a key).",
    breachCount: "Breaches ({n})",
  },
  de: {
    local: "Drittanbieter", label: "Zu prüfende E-Mail", ph: "sie@email.com", run: "Lecks prüfen", running: "Prüfe…",
    found: "⚠ Adresse in Lecks gefunden!", foundOne: "⚠ Adresse in einem Leak gefunden!",
    safe: "✓ Keine bekannten Lecks", safeDetail: "Für diese E-Mail wurde kein Datenleck in der XposedOrNot-Datenbank gefunden. Das garantiert keine zukünftige Sicherheit — verwenden Sie eindeutige Passwörter und aktivieren Sie Zwei-Faktor-Authentifizierung.",
    errEmail: "Geben Sie eine gültige E-Mail-Adresse ein.", errApi: "Der Dienst ist nicht erreichbar. Bitte erneut versuchen.",
    note: "Die Abfrage geht an api.xposedornot.com (öffentliche Datenleck-Datenbank, ohne API-Schlüssel). Es wird nur die E-Mail selbst gesendet.",
    breachCount: "Lecks ({n})",
  },
  es: {
    local: "Terceros", label: "Correo a comprobar", ph: "usted@email.com", run: "Comprobar fugas", running: "Comprobando…",
    found: "⚠ ¡Correo encontrado en fugas!", foundOne: "⚠ ¡Correo encontrado en una fuga!",
    safe: "✓ Sin fugas conocidas", safeDetail: "No se encontró ninguna fuga de datos para este correo en la base XposedOrNot. Eso no garantiza seguridad futura: use contraseñas únicas y active la verificación en dos pasos.",
    errEmail: "Introduzca un correo válido.", errApi: "No se pudo contactar el servicio. Inténtelo de nuevo.",
    note: "La consulta va a api.xposedornot.com (base de fugas pública, sin clave API). Solo se envía el correo.",
    breachCount: "Fugas ({n})",
  },
  uk: {
    local: "Третя сторона", label: "Електронна пошта", ph: "vy@email.com", run: "Перевірити витоки", running: "Перевіряю…",
    found: "⚠ Адресу знайдено у витоках!", foundOne: "⚠ Адресу знайдено у витоку!",
    safe: "✓ Відомих витоків немає", safeDetail: "Для цієї адреси в базі XposedOrNot не знайдено жодного витоку даних. Це не гарантує безпеку в майбутньому — використовуйте унікальні паролі та двофакторну автентифікацію.",
    errEmail: "Введіть коректну адресу.", errApi: "Сервіс недоступний. Спробуйте ще раз.",
    note: "Запит іде на api.xposedornot.com (публічна база витоків, без ключа). Надсилається лише сама адреса.",
    breachCount: "Витоки ({n})",
  },
  fr: {
    local: "Tiers", label: "E-mail à vérifier", ph: "vous@email.com", run: "Vérifier les fuites", running: "Vérification…",
    found: "⚠ Adresse trouvée dans des fuites !", foundOne: "⚠ Adresse trouvée dans une fuite !",
    safe: "✓ Aucune fuite connue", safeDetail: "Aucune fuite de données enregistrée pour cet e-mail dans la base XposedOrNot. Cela ne garantit rien pour l'avenir — utilisez des mots de passe uniques et activez l'authentification à deux facteurs.",
    errEmail: "Saisissez une adresse e-mail valide.", errApi: "Service injoignable. Réessayez.",
    note: "La requête va vers api.xposedornot.com (base publique de fuites, sans clé API). Seul l'e-mail est envoyé.",
    breachCount: "Fuites ({n})",
  },
  sk: {
    local: "Tretia strana", label: "E-mail na kontrolu", ph: "vy@email.com", run: "Skontrolovať úniky", running: "Kontrolujem…",
    found: "⚠ Adresa sa objavila v únikoch!", foundOne: "⚠ Adresa sa objavila v úniku!",
    safe: "✓ Žiadne známe úniky", safeDetail: "K tomuto e-mailu nebol v databáze XposedOrNot nájdený žiadny zaznamenaný únik dát. To neznamená budúcu bezpečnosť — používajte jedinečné heslá a zapnite dvojFaktorové overenie.",
    errEmail: "Zadajte platnú e-mailovú adresu.", errApi: "Službu sa nepodarilo osloviť. Skúste to znova.",
    note: "Dopyt ide na api.xposedornot.com (verejná databáza únikov, bez API kľúča). Posiela sa len samotný e-mail.",
    breachCount: "Úniky ({n})",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EmailBreachCheck({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  void useToolUi(locale);
  const [email, setEmail] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [breaches, setBreaches] = useState<Breach[] | null>(null);
  const [checked, setChecked] = useState("");

  async function run() {
    setError("");
    setBreaches(null);
    const value = email.trim();
    if (!EMAIL_RE.test(value)) { setError(L.errEmail); return; }
    setRunning(true);
    try {
      const r = await fetch(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(value)}`);
      // 404 = adresa v databázi není (žádné úniky); jiná chyba = problém API
      if (r.status === 404) {
        setBreaches([]);
        setChecked(value);
      } else if (!r.ok) {
        throw new Error(`API ${r.status}`);
      } else {
        const data = (await r.json()) as { breaches?: unknown } | null;
        let list: Breach[] = [];
        const b = data?.breaches;
        if (Array.isArray(b)) list = b as Breach[];
        else if (b && typeof b === "object") {
          // tvar {"breaches": {"Breach1": {...}, ...}} u některých verzí API
          list = Object.values(b as Record<string, unknown>).filter(
            (x): x is Breach => Boolean(x) && typeof x === "object" && typeof (x as Breach).breach === "string",
          );
        }
        setBreaches(list);
        setChecked(value);
      }
    } catch {
      setError(L.errApi);
    } finally {
      setRunning(false);
    }
  }

  const foundCount = breaches?.length ?? 0;

  return (
    <div className="stack" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="eb-email">{L.label}</label>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input
            className="input" id="eb-email" type="email" inputMode="email" autoComplete="off"
            placeholder={L.ph} style={{ flex: 1 }} value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void run(); } }}
          />
        </div>
      </div>
      <button className="btn btn-primary btn-touch" id="eb-run" type="button" disabled={running} onClick={run}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" /></svg>{" "}
        {running ? L.running : L.run}
      </button>

      {error ? <p className="error-text" id="eb-error" role="alert">{error}</p> : null}

      {breaches !== null ? (
        <div className="glass" style={{ borderRadius: "0.75rem", padding: "1rem" }} id="eb-result">
          <p id="eb-status" style={{ fontSize: "1.1rem", margin: 0, color: foundCount ? "var(--vv-danger)" : "var(--vv-green)" }}>
            {foundCount ? (foundCount === 1 ? L.foundOne : L.found) : L.safe}
          </p>
          {foundCount ? (
            <>
              <p className="muted" style={{ fontSize: "0.85rem", margin: "0.5rem 0 0.75rem" }}>
                {checked} · {L.breachCount.replace("{n}", String(foundCount))}
              </p>
              <div className="pills" style={{ gap: "0.4rem" }}>
                {breaches.map((b, i) => (
                  <span key={`${b.breach}-${i}`} className="badge badge-loc-other" title={[b.date, b.victims != null ? String(b.victims) : ""].filter(Boolean).join(" · ")}>
                    {b.breach}
                  </span>
                ))}
              </div>
              <p className="muted" style={{ fontSize: "0.8rem", margin: "0.75rem 0 0" }}>
                {locale === "en"
                  ? "Change the password for this email's account and anywhere you reused it; enable two-factor authentication."
                  : "Změňte heslo k účtu s touto adresou a všude, kde jste ho použili znovu; zapněte dvoufázové ověření."}
              </p>
            </>
          ) : (
            <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{L.safeDetail}</p>
          )}
        </div>
      ) : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>{L.note}</p>
    </div>
  );
}
