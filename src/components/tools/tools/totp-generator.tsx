"use client";

// TOTP generátor (RFC 6238) — port legacy tools/assets/js/tools/totp-generator.js
// Čistě client-side (Web Crypto HMAC-SHA1). QR přes UMD qrcode-generator.min.js.
import { useEffect, useRef, useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { loadScript } from "@/components/tools/tool-runtime";

declare global {
  interface Window {
    qrcode?: (typeNumber: number, errorCorrectionLevel: "L" | "M" | "Q" | "H") => {
      addData: (data: string) => void;
      make: () => void;
      createDataURL: (cellSize: number, margin: number) => string;
    };
  }
}

const STEP = 30, DIGITS = 6;
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const LBL: Record<Locale, { secret: string; issuer: string; account: string; expires: string; qrNote: string; qrNoteStrong: string; errLoad: string; errCalc: string }> = {
  cs: { secret: "Tajemství (Base32)", issuer: "Vydavatel", account: "Účet", expires: "Platnost vyprší za {n} s", qrNote: "Naskenujte QR do aplikace Authenticator (Google/Microsoft/Authy).", qrNoteStrong: "Pouze pro generování kódů k testování. Tajemství se zpracovává lokálně.", errLoad: "Knihovnu QR se nepodařilo načíst.", errCalc: "Výpočet TOTP selhal: {msg}" },
  en: { secret: "Secret (Base32)", issuer: "Issuer", account: "Account", expires: "Expires in {n} s", qrNote: "Scan the QR into an Authenticator app (Google/Microsoft/Authy).", qrNoteStrong: "For test code generation only. The secret is processed locally.", errLoad: "QR library failed to load.", errCalc: "TOTP computation failed: {msg}" },
  de: { secret: "Geheimnis (Base32)", issuer: "Aussteller", account: "Konto", expires: "Läuft ab in {n} s", qrNote: "QR in eine Authenticator-App scannen (Google/Microsoft/Authy).", qrNoteStrong: "Nur für Testcode-Generierung. Geheimnis wird lokal verarbeitet.", errLoad: "QR-Bibliothek konnte nicht geladen werden.", errCalc: "TOTP-Berechnung fehlgeschlagen: {msg}" },
  es: { secret: "Secreto (Base32)", issuer: "Emisor", account: "Cuenta", expires: "Caduca en {n} s", qrNote: "Escanea el QR en una app Authenticator (Google/Microsoft/Authy).", qrNoteStrong: "Solo para generar códigos de prueba. El secreto se procesa localmente.", errLoad: "No se pudo cargar la librería QR.", errCalc: "Cálculo TOTP fallido: {msg}" },
  uk: { secret: "Таємниця (Base32)", issuer: "Видавець", account: "Обліковий запис", expires: "Закінчується через {n} с", qrNote: "Скануйте QR у програму Authenticator (Google/Microsoft/Authy).", qrNoteStrong: "Лише для генерації тестових кодів. Таємниця обробляється локально.", errLoad: "Не вдалося завантажити бібліотеку QR.", errCalc: "Помилка обчислення TOTP: {msg}" },
  fr: { secret: "Secret (Base32)", issuer: "Émetteur", account: "Compte", expires: "Expire dans {n} s", qrNote: "Scannez le QR dans une app Authenticator (Google/Microsoft/Authy).", qrNoteStrong: "Uniquement pour générer des codes de test. Le secret est traité localement.", errLoad: "Échec du chargement de la librairie QR.", errCalc: "Échec du calcul TOTP : {msg}" },
  sk: { secret: "Tajomstvo (Base32)", issuer: "Vydavateľ", account: "Účet", expires: "Platnosť vyprší za {n} s", qrNote: "Naskenujte QR do aplikácie Authenticator (Google/Microsoft/Authy).", qrNoteStrong: "Len na generovanie testovacích kódov. Tajomstvo sa spracováva lokálne.", errLoad: "Knížnicu QR sa nepodarilo načítať.", errCalc: "Výpočet TOTP zlyhal: {msg}" },
};

function base32Decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (let i = 0; i < clean.length; i++) bits += ALPHA.indexOf(clean[i]).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let j = 0; j + 8 <= bits.length; j += 8) bytes.push(parseInt(bits.substr(j, 8), 2));
  return new Uint8Array(bytes);
}

async function hotp(keyBytes: Uint8Array, counter: number): Promise<string> {
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  dv.setUint32(0, Math.floor(counter / 0x100000000));
  dv.setUint32(4, counter >>> 0);
  const k = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, buf));
  const off = sig[sig.length - 1] & 0x0f;
  const bin = ((sig[off] & 0x7f) << 24) | ((sig[off + 1] & 0xff) << 16) | ((sig[off + 2] & 0xff) << 8) | (sig[off + 3] & 0xff);
  const otp = bin % Math.pow(10, DIGITS);
  return String(otp).padStart(DIGITS, "0");
}

export default function TotpGenerator({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [issuer, setIssuer] = useState("VeVit");
  const [account, setAccount] = useState("account");
  const [code, setCode] = useState("------");
  const [fill, setFill] = useState(0);
  const [timer, setTimer] = useState("—");
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function otpauthUri(): string {
    const i = encodeURIComponent(issuer || "VeVit"), a = encodeURIComponent(account || "account");
    const s = encodeURIComponent(secret);
    return `otpauth://totp/${i}:${a}?secret=${s}&issuer=${i}&algorithm=SHA1&digits=${DIGITS}&period=${STEP}`;
  }

  async function tick() {
    const key = base32Decode(secret);
    if (!key.length) { setCode("------"); setFill(0); setTimer("—"); return; }
    const now = Math.floor(Date.now() / 1000);
    const counter = Math.floor(now / STEP);
    const remain = STEP - (now % STEP);
    try {
      const otp = await hotp(key, counter);
      setCode(otp);
      setFill((remain / STEP) * 100);
      setTimer(L.expires.replace("{n}", String(remain)));
    } catch (e) {
      setError(L.errCalc.replace("{msg}", e instanceof Error ? e.message : String(e)));
    }
  }

  function loop() {
    tick();
    timerRef.current = setTimeout(loop, 1000);
  }

  async function renderQr() {
    try {
      await loadScript("/tools/assets/js/lib/qrcode-generator.min.js");
      if (typeof window === "undefined" || !window.qrcode) { setQrUrl(null); return; }
      const qr = window.qrcode(0, "M");
      qr.addData(otpauthUri());
      qr.make();
      setQrUrl(qr.createDataURL(4, 2));
    } catch {
      setQrUrl(null);
    }
  }

  useEffect(() => {
    loop();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, issuer, account, L.expires, L.errCalc]);

  useEffect(() => {
    Promise.resolve().then(() => renderQr());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, issuer, account]);

  return (
    <div className="stack" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="tp-secret">{L.secret}</label>
        <input className="input" id="tp-secret" type="text" placeholder="např. JBSWY3DPEHPK3PXP" value={secret} autoComplete="off" onChange={(e) => { setSecret(e.target.value); setError(""); }} />
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm"><label className="field-label" htmlFor="tp-issuer">{L.issuer}</label><input className="input" id="tp-issuer" type="text" placeholder="VeVit" value={issuer} onChange={(e) => setIssuer(e.target.value)} /></div>
        <div className="stack-sm"><label className="field-label" htmlFor="tp-account">{L.account}</label><input className="input" id="tp-account" type="text" placeholder="uzivatel@example.com" value={account} onChange={(e) => setAccount(e.target.value)} /></div>
      </div>
      <div className="glass" style={{ borderRadius: "0.75rem", padding: "1rem", textAlign: "center" }}>
        <div className="mono" id="tp-code" style={{ fontSize: "2.5rem", letterSpacing: "0.3em" }}>{code}</div>
        <div className="progress-track" style={{ margin: "0.75rem auto", maxWidth: "16rem" }} id="tp-bar"><div className="progress-fill" id="tp-fill" style={{ width: `${fill}%` }} /></div>
        <p className="muted" id="tp-timer" style={{ fontSize: "0.85rem" }}>{timer}</p>
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <div id="tp-qr" style={{ background: "#fff", padding: "0.5rem", borderRadius: "0.5rem" }}>
          {qrUrl ? (
            // QR je client-side data URL generované qrcode-generator — next/image zde nedává smysl.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="OTP QR" style={{ width: "8rem", height: "8rem" }} />
          ) : null}
        </div>
        <p className="muted" style={{ fontSize: "0.8rem", maxWidth: "18rem" }}>
          {L.qrNote}
          <br /><br />
          <strong>{L.qrNoteStrong}</strong>
        </p>
      </div>
      <p className={`error-text${error ? "" : " hidden"}`} id="tp-error" role="alert">{error}</p>
    </div>
  );
}