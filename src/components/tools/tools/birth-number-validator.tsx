"use client";

// Validátor rodného čísla — formát + kontrolní součet (mod 11), čistě client-side.
// Portuje legacy-public/tools/birth-number-validator.html + public/tools/assets/js/tools/birth-number-validator.js.
// Komponenta renderuje POUZE vnitřní tělo .tool-tool — shell dodává stránka.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

// cs-only řetězce transkribované z legacy (neinventarizujeme překlady).
const S = {
  label: "Rodné číslo",
  placeholder: "RRMMDD/XXXX",
  run: "Ověřit",
  status: "Stav",
  dob: "Datum narození",
  sex: "Pohlaví",
  age: "Věk",
  valid: "Platné",
  invalid: "Neplatné",
  note: "Ověřuje se formát a kontrolní součet (mod 11). Zpracování probíhá výhradně ve vašem prohlížeči — rodné číslo se nikam neukládá ani neodesílá.",
};

interface Result {
  valid: boolean;
  dob?: string;
  sex?: string;
  age?: string;
  error?: string;
}

function pad(n: number) {
  return (n < 10 ? "0" : "") + n;
}

// Výpočet 1:1 s legacy birth-number-validator.js.
function validate(raw: string): Result {
  const s = raw.replace(/\s+/g, "").replace("/", "").toUpperCase();
  if (!/^\d{9,10}$/.test(s))
    return { valid: false, error: "Rodné číslo musí mít 9 nebo 10 číslic (RRMMDDXXXX případně s lomítkem)." };

  const yy = parseInt(s.slice(0, 2), 10);
  const mm = parseInt(s.slice(2, 4), 10);
  const dd = parseInt(s.slice(4, 6), 10);

  // kontrolní součet (pouze 10místné)
  if (s.length === 10) {
    const n = parseInt(s.slice(0, 9), 10);
    let check = n % 11;
    if (check === 10) check = 0;
    if (check !== parseInt(s.slice(9, 10), 10))
      return { valid: false, error: "Selhal kontrolní součet (mod 11). Číslo není platné." };
  }

  // rok
  const year = s.length === 9 ? 1900 + yy : yy >= 54 ? 1900 + yy : 2000 + yy;

  // měsíc / pohlaví
  let realMonth = mm;
  let isFemale = false;
  if (mm > 70) { realMonth = mm - 70; isFemale = true; }
  else if (mm > 50) { realMonth = mm - 50; isFemale = true; }

  // existence data
  const d = new Date(year, realMonth - 1, dd);
  if (d.getFullYear() !== year || d.getMonth() !== realMonth - 1 || d.getDate() !== dd)
    return { valid: false, error: `Datum vyplývající z čísla neexistuje (${pad(yy)}.${pad(realMonth)}.${pad(dd)}).` };

  const today = new Date();
  let ageY = today.getFullYear() - year;
  const tmp = new Date(today.getFullYear(), realMonth - 1, dd);
  if (today < tmp) ageY--;

  return {
    valid: true,
    dob: d.toLocaleDateString("cs-CZ"),
    sex: isFemale ? "Žena" : "Muž",
    age: ageY < 0 ? "—" : ageY + " let",
  };
}

export default function BirthNumberValidator({ locale }: ToolComponentProps) {
  void locale;
  const [r, setR] = useState<Result | null>(null);

  const run = () => {
    const el = document.getElementById("bn-input") as HTMLInputElement | null;
    setR(validate(el?.value ?? ""));
  };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="bn-input">{S.label}</label>
        <input
          className="input mono"
          type="text"
          id="bn-input"
          placeholder={S.placeholder}
          autoComplete="off"
          style={{ maxWidth: "14rem" }}
          onKeyDown={(e) => { if (e.key === "Enter") run(); }}
        />
      </div>

      <button className="btn btn-primary btn-touch" id="bn-run" type="button" onClick={run}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>{" "}{S.run}
      </button>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv">
          <span className="k">{S.status}</span>
          <span
            className="v accent"
            id="bn-status"
            style={{ color: r == null ? undefined : r.valid ? "var(--color-emerald)" : "var(--color-red)" }}
          >
            {r == null ? "—" : r.valid ? S.valid : S.invalid}
          </span>
        </div>
        {r && r.valid ? (
          <>
            <div className="kv"><span className="k">{S.dob}</span><span className="v" id="bn-dob">{r.dob}</span></div>
            <div className="kv"><span className="k">{S.sex}</span><span className="v" id="bn-sex">{r.sex}</span></div>
            <div className="kv"><span className="k">{S.age}</span><span className="v" id="bn-age">{r.age}</span></div>
          </>
        ) : null}
      </div>

      {r && !r.valid && r.error ? (
        <p className="error-text" id="bn-error" role="alert">{r.error}</p>
      ) : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}