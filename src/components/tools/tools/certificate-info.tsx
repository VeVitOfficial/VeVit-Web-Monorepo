"use client";

// SSL certifikát info — port legacy tools/assets/js/tools/certificate-info.js
// Volá serverový endpoint /tools/api/ssl-check.php (zpracování na serveru — viz tool-trust).
// Endpoint zůstává 1:1 jako v legacy; na Vercelu může být nedostupný (mimo rozsah portu).
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, ProgressBar, toastSuccess } from "@/components/tools/tool-runtime";

interface SslBody {
  status: "valid" | "expires_soon" | string;
  issuer: { O?: string; CN?: string };
  subject: { O?: string; CN?: string };
  validFrom: string;
  validTo: string;
  daysLeft?: number | null;
  serialNumber: string;
  signatureType: string;
  san?: string[];
}

const LBL: Record<Locale, { domain: string; run: string; help: string; ok: string; okSoon: string; issuer: string; subject: string; from: string; to: string; days: string; serial: string; sig: string; san: string; errDomain: string; errFail: string; errNet: string; progConnect: string; progDone: string }> = {
  cs: { domain: "Doména", run: "Zkontrolovat", help: "Zpracování probíhá na serveru přes ověřené TLS spojení přímo s veřejnou IP adresou. Doména se použije jen pro jednorázovou kontrolu a nic se neukládá.", ok: "✓ Certifikát je ověřený důvěryhodným řetězcem", okSoon: "⚠ Certifikát je ověřený, ale platnost brzy vyprší", issuer: "Vystavil", subject: "Pro", from: "Platný od", to: "Platný do", days: "Zbývá", serial: "Sériové číslo", sig: "Podpis", san: "SAN (alternativní názvy)", errDomain: "Zadejte doménu.", errFail: "Kontrolu se nepodařilo dokončit.", errNet: "Síťová chyba při kontrole certifikátu. Zkuste to prosím znovu.", progConnect: "Připojuji se k {d}:443…", progDone: "Hotovo" },
  en: { domain: "Domain", run: "Check", help: "Processing runs on the server via a verified TLS connection directly to the public IP. The domain is used only for a one-off check and nothing is stored.", ok: "✓ Certificate verified by a trusted chain", okSoon: "⚠ Certificate is verified but expires soon", issuer: "Issuer", subject: "For", from: "Valid from", to: "Valid to", days: "Left", serial: "Serial", sig: "Signature", san: "SAN (alternative names)", errDomain: "Enter a domain.", errFail: "Check could not be completed.", errNet: "Network error during certificate check. Please try again.", progConnect: "Connecting to {d}:443…", progDone: "Done" },
  de: { domain: "Domäne", run: "Prüfen", help: "Die Verarbeitung erfolgt auf dem Server über eine verifizierte TLS-Verbindung direkt zur öffentlichen IP. Die Domäne wird nur für eine einmalige Prüfung verwendet und nichts gespeichert.", ok: "✓ Zertifikat durch vertrauenswürdige Kette verifiziert", okSoon: "⚠ Zertifikat verifiziert, läuft aber bald ab", issuer: "Aussteller", subject: "Für", from: "Gültig ab", to: "Gültig bis", days: "Verbleibend", serial: "Seriennummer", sig: "Signatur", san: "SAN (alternative Namen)", errDomain: "Geben Sie eine Domäne ein.", errFail: "Prüfung konnte nicht abgeschlossen werden.", errNet: "Netzwerkfehler bei der Zertifikatsprüfung. Bitte erneut versuchen.", progConnect: "Verbinde mit {d}:443…", progDone: "Fertig" },
  es: { domain: "Dominio", run: "Comprobar", help: "El procesamiento se realiza en el servidor vía conexión TLS verificada directamente a la IP pública. El dominio se usa solo para una comprobación única y no se almacena nada.", ok: "✓ Certificado verificado por cadena de confianza", okSoon: "⚠ Certificado verificado pero caduca pronto", issuer: "Emisor", subject: "Para", from: "Válido desde", to: "Válido hasta", days: "Restante", serial: "Número de serie", sig: "Firma", san: "SAN (nombres alternativos)", errDomain: "Introduzca un dominio.", errFail: "No se pudo completar la comprobación.", errNet: "Error de red al comprobar el certificado. Inténtelo de nuevo.", progConnect: "Conectando a {d}:443…", progDone: "Hecho" },
  uk: { domain: "Домен", run: "Перевірити", help: "Обробка відбувається на сервері через перевірене TLS-з'єднання безпосередньо до публічної IP. Домен використовується лише для одноразової перевірки, нічого не зберігається.", ok: "✓ Сертифікат перевірено надійним ланцюжком", okSoon: "⚠ Сертифікат перевірено, але скоро закінчується", issuer: "Видав", subject: "Для", from: "Дійсний з", to: "Дійсний до", days: "Залишилось", serial: "Серійний номер", sig: "Підпис", san: "SAN (альтернативні назви)", errDomain: "Введіть домен.", errFail: "Перевірку не вдалося завершити.", errNet: "Мережева помилка під час перевірки сертифіката. Спробуйте ще раз.", progConnect: "Підключення до {d}:443…", progDone: "Готово" },
  fr: { domain: "Domaine", run: "Vérifier", help: "Le traitement s'effectue sur le serveur via une connexion TLS vérifiée directement à l'IP publique. Le domaine est utilisé pour une seule vérification et rien n'est stocké.", ok: "✓ Certificat vérifié par une chaîne de confiance", okSoon: "⚠ Certificat vérifié mais expire bientôt", issuer: "Émetteur", subject: "Pour", from: "Valide depuis", to: "Valide jusqu'au", days: "Restant", serial: "Numéro de série", sig: "Signature", san: "SAN (noms alternatifs)", errDomain: "Saisissez un domaine.", errFail: "La vérification n'a pas pu aboutir.", errNet: "Erreur réseau lors de la vérification du certificat. Réessayez.", progConnect: "Connexion à {d}:443…", progDone: "Terminé" },
  sk: { domain: "Doména", run: "Skontrolovať", help: "Spracovanie prebieha na serveri cez overené TLS spojenie priamo s verejnou IP. Doména sa použije len na jednorázovú kontrolu a nič sa neukladá.", ok: "✓ Certifikát je overený dôveryhodným reťazcom", okSoon: "⚠ Certifikát je overený, ale platnosť čoskoro vyprší", issuer: "Vydal", subject: "Pre", from: "Platný od", to: "Platný do", days: "Zostáva", serial: "Sériové číslo", sig: "Podpis", san: "SAN (alternatívne názvy)", errDomain: "Zadajte doménu.", errFail: "Kontrolu sa nepodarilo dokončiť.", errNet: "Sieťová chyba pri kontrole certifikátu. Skúste to znova.", progConnect: "Pripájam sa k {d}:443…", progDone: "Hotovo" },
};

function dash(v: unknown): string { return v == null ? "—" : String(v); }

export default function CertificateInfo({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  void useToolUi(locale);
  const [domain, setDomain] = useState("example.com");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ value: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ body: SslBody } | null>(null);

  async function run() {
    if (running) return;
    setError("");
    const d = domain.trim();
    if (!d) { setError(L.errDomain); return; }
    setResult(null);
    setRunning(true);
    setProgress({ value: 30, label: L.progConnect.replace("{d}", d) });
    try {
      const r = await fetch(`/tools/api/ssl-check.php?domain=${encodeURIComponent(d)}`, { headers: { Accept: "application/json" } });
      const body = (await r.json()) as SslBody;
      if (!r.ok) { setError((body as unknown as { message?: string }).message ?? L.errFail); setProgress(null); setRunning(false); return; }
      setProgress({ value: 100, label: L.progDone });
      setResult({ body });
      setProgress(null);
      toastSuccess(L.progDone);
    } catch {
      setProgress(null);
      setError(L.errNet);
    } finally {
      setRunning(false);
    }
  }

  const b = result?.body;
  const statusText = b ? (b.status === "expires_soon" ? L.okSoon : L.ok) : "";

  return (
    <div className="stack" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ci-domain">{L.domain}</label>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input className="input" id="ci-domain" type="text" placeholder="example.com" value={domain} autoComplete="url" aria-describedby="ci-help ci-error" style={{ flex: 1 }} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} />
          <button className="btn btn-primary btn-touch" id="ci-run" type="button" disabled={running} onClick={run}>{L.run}</button>
        </div>
      </div>

      {progress ? <ProgressBar value={progress.value} label={progress.label} /> : null}

      <div className={result ? "" : " hidden"} id="ci-result">
        <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }}>
          <p id="ci-status" className={`certificate-status certificate-status-${b?.status ?? ""}`} style={{ fontSize: "1.05rem", margin: "0.25rem 0" }} aria-live="polite">{statusText}</p>
          <div className="kv"><span className="k">{L.issuer}</span><span className="v" id="ci-issuer">{b ? dash((b.issuer.O && b.issuer.O !== "—" ? b.issuer.O : b.issuer.CN) + (b.issuer.CN && b.issuer.O && b.issuer.CN !== b.issuer.O ? ` (${b.issuer.CN})` : "")) : "—"}</span></div>
          <div className="kv"><span className="k">{L.subject}</span><span className="v" id="ci-subject">{b ? dash((b.subject.O && b.subject.O !== "—" ? `${b.subject.O} — ` : "") + b.subject.CN) : "—"}</span></div>
          <div className="kv"><span className="k">{L.from}</span><span className="v mono" id="ci-from">{b ? dash(b.validFrom) : "—"}</span></div>
          <div className="kv"><span className="k">{L.to}</span><span className="v mono" id="ci-to">{b ? dash(b.validTo) : "—"}</span></div>
          <div className="kv"><span className="k">{L.days}</span><span className="v mono" id="ci-days">{b ? (b.daysLeft == null ? "—" : `${b.daysLeft} ${locale === "en" ? "days" : "dní"}`) : "—"}</span></div>
          <div className="kv"><span className="k">{L.serial}</span><span className="v mono" id="ci-serial">{b ? dash(b.serialNumber) : "—"}</span></div>
          <div className="kv"><span className="k">{L.sig}</span><span className="v" id="ci-sig">{b ? dash(b.signatureType) : "—"}</span></div>
          <div className="kv"><span className="k">{L.san}</span><span className="v" id="ci-san">{b ? (b.san && b.san.length ? b.san.join(", ") : "—") : "—"}</span></div>
        </div>
      </div>

      <p className={`error-text${error ? "" : " hidden"}`} id="ci-error" role="alert">{error}</p>
      <p className="muted" id="ci-help" style={{ fontSize: "0.8rem" }}>{L.help}</p>
    </div>
  );
}