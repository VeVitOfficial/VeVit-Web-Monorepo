"use client";

// Síla hesla — port legacy tools/assets/js/tools/password-strength.js
// Entropie + odhad doby prolomení, čistě client-side (živý přepočet na input).
import { useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, Icon } from "@/components/tools/tool-runtime";

interface Set { re: RegExp; name: string; size: number; }
const SETS: Set[] = [
  { re: /[a-z]/, name: "malá", size: 26 },
  { re: /[A-Z]/, name: "velká", size: 26 },
  { re: /[0-9]/, name: "číslice", size: 10 },
  { re: /[^a-zA-Z0-9]/, name: "speciální", size: 33 },
];

const LBL: Record<Locale, { local: string; label: string; ph: string; show: string; entropy: string; length: string; sets: string; crack: string; none: string; note: string }> = {
  cs: { local: "Lokální", label: "Heslo k analýze", ph: "Zadejte heslo…", show: "Zobrazit/skrýt", entropy: "Entropie", length: "Délka", sets: "Sady znaků", crack: "Odhad doby prolomení", none: "žádné rozpoznané sady", note: "Odhad je orientační (předpoklad 10^10 pokusů/s pro offline útok na hash). Skutečná odolnost závisí na typu úložiště. Heslo se nikam neodesílá — výpočet běží lokálně." },
  en: { local: "Local", label: "Password to analyze", ph: "Enter password…", show: "Show/hide", entropy: "Entropy", length: "Length", sets: "Character sets", crack: "Estimated crack time", none: "no recognized sets", note: "The estimate is indicative (assumes 10^10 guesses/s for an offline hash attack). Real resistance depends on storage type. The password is never sent — calculation runs locally." },
  de: { local: "Lokal", label: "Zu analysierendes Passwort", ph: "Passwort eingeben…", show: "Anzeigen/Verbergen", entropy: "Entropie", length: "Länge", sets: "Zeichensätze", crack: "Geschätzte Knackzeit", none: "keine erkannten Sätze", note: "Schätzung ist Richtwert (10^10 Versuche/s für Offline-Hash-Angriff). Tatsächlicher Widerstand hängt vom Speichertyp ab. Passwort wird nie gesendet — Berechnung läuft lokal." },
  es: { local: "Local", label: "Contraseña a analizar", ph: "Introduzca contraseña…", show: "Mostrar/ocultar", entropy: "Entropía", length: "Longitud", sets: "Juegos de caracteres", crack: "Tiempo estimado de ruptura", none: "sin conjuntos reconocidos", note: "Estimación orientativa (10^10 intentos/s para ataque offline a hash). La resistencia real depende del tipo de almacenamiento. La contraseña no se envía — cálculo local." },
  uk: { local: "Локально", label: "Пароль для аналізу", ph: "Введіть пароль…", show: "Показати/приховати", entropy: "Ентропія", length: "Довжина", sets: "Набори символів", crack: "Оцінка часу зламу", none: "немає розпізнаних наборів", note: "Оцінка орієнтовна (10^10 спроб/с для офлайн-атаки на хеш). Реальна стійкість залежить від типу сховища. Пароль нікуди не надсилається — розрахунок локально." },
  fr: { local: "Local", label: "Mot de passe à analyser", ph: "Saisissez le mot de passe…", show: "Afficher/masquer", entropy: "Entropie", length: "Longueur", sets: "Jeux de caractères", crack: "Temps de cassage estimé", none: "aucun ensemble reconnu", note: "Estimation indicative (10^10 essais/s pour attaque offline sur hash). La résistance réelle dépend du type de stockage. Le mot de passe n'est jamais envoyé — calcul local." },
  sk: { local: "Lokálne", label: "Heslo na analýzu", ph: "Zadajte heslo…", show: "Zobraziť/skryť", entropy: "Entropia", length: "Dĺžka", sets: "Sady znakov", crack: "Odhad doby prelomenia", none: "žiadne rozpoznané sady", note: "Odhad je orientačný (10^10 pokusov/s pre offline útok na hash). Skutočná odolnosť závisí od typu úložiska. Heslo sa nikam neodosiela — výpočet beží lokálne." },
};

// české tvary (cs-only zůstává cs — ostatní fallback cs)
const TONE_CS = ["Velmi slabé", "Slabé", "Průměrné", "Silné", "Velmi silné"];
const TONE_EN = ["Very weak", "Weak", "Average", "Strong", "Very strong"];

function fmtTimeSafe(secs: number, locale: Locale): string {
  if (!isFinite(secs)) return locale === "en" ? "forever" : "nezlomně dlouho";
  if (secs < 1) return locale === "en" ? "instantly" : "okamžitě";
  const Y = 31536000, D = 86400, H = 3600, M = 60;
  if (locale === "en") {
    if (secs >= Y) return `${(secs / Y).toFixed(1)} years`;
    if (secs >= D) return `${Math.round(secs / D)} days`;
    if (secs >= H) return `${Math.round(secs / H)} h`;
    if (secs >= M) return `${Math.round(secs / M)} min`;
    return `${Math.round(secs)} s`;
  }
  if (secs >= Y) return `${(secs / Y).toFixed(1).replace(".", ",")} roku`;
  if (secs >= D) return `${Math.round(secs / D)} dní`;
  if (secs >= H) return `${Math.round(secs / H)} hod`;
  if (secs >= M) return `${Math.round(secs / M)} min`;
  return `${Math.round(secs)} s`;
}

interface Analysis { entropy: string; len: string; setsText: string; crack: string; pct: number; tone: string; color: string; }

function analyze(pw: string, L: typeof LBL.cs, locale: Locale): Analysis | null {
  if (!pw) return null;
  let pool = 0; const used: string[] = [];
  for (const s of SETS) if (s.re.test(pw)) { pool += s.size; used.push(s.name); }
  if (pool === 0) pool = 1;
  const entropy = pw.length * Math.log2(pool);
  const guesses = Math.pow(2, entropy);
  const secs = guesses / 1e10 / 2;
  const pct = Math.min(100, Math.round(entropy / 1.28));
  const toneIdx = entropy < 28 ? 0 : entropy < 36 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;
  const toneList = locale === "en" ? TONE_EN : TONE_CS;
  const color = entropy < 28 ? "#ef4444" : entropy < 36 ? "#f59e0b" : entropy < 60 ? "#eab308" : entropy < 80 ? "#22c55e" : "#16a34a";
  return {
    entropy: `${entropy.toFixed(1).replace(".", ",")} bitů`,
    len: String(pw.length),
    setsText: used.join(", ") || L.none,
    crack: fmtTimeSafe(secs, locale),
    pct,
    tone: `${toneList[toneIdx]} · ${entropy.toFixed(0)} bitů`,
    color,
  };
}

export default function PasswordStrength({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  void useToolUi(locale);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  const a = analyze(pw, L, locale);

  return (
    <div className="stack" style={{ maxWidth: "40rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ps-pass">{L.label}</label>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input className="input" id="ps-pass" type={show ? "text" : "password"} placeholder={L.ph} autoComplete="off" style={{ flex: 1 }} value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn btn-ghost" id="ps-toggle" type="button" aria-label={L.show} onClick={() => setShow((s) => !s)}>
            <Icon name={show ? "EyeOff" : "Eye"} size={16} />
          </button>
        </div>
      </div>
      <div className="progress-track" id="ps-bar"><div className="progress-fill" id="ps-fill" style={{ width: `${a?.pct ?? 0}%`, background: a?.color ?? "transparent" }} /></div>
      <p className="muted" id="ps-label" style={{ fontSize: "0.85rem" }}>{a?.tone ?? "—"}</p>
      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.75rem 1rem" }} id="ps-detail">
        <div className="kv"><span className="k">{L.entropy}</span><span className="v mono" id="ps-entropy">{a?.entropy ?? "—"}</span></div>
        <div className="kv"><span className="k">{L.length}</span><span className="v mono" id="ps-len">{a?.len ?? "—"}</span></div>
        <div className="kv"><span className="k">{L.sets}</span><span className="v" id="ps-sets">{a?.setsText ?? "—"}</span></div>
        <div className="kv"><span className="k">{L.crack}</span><span className="v mono" id="ps-crack">{a?.crack ?? "—"}</span></div>
      </div>
      <p className="muted" style={{ fontSize: "0.78rem" }}>{L.note}</p>
    </div>
  );
}