"use client";

// Převodník IBAN — český účet ↔ IBAN, mod 97 kontrolní součet. Čistě client-side.
// Portuje legacy-public/tools/iban-converter.html + public/tools/assets/js/tools/iban-converter.js.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Icon, copyText } from "@/components/tools/tool-runtime";

const S = {
  segTo: "Účet → IBAN",
  segFrom: "IBAN → účet",
  accLabel: "České číslo účtu (např. 123456789/0800)",
  accPh: "předčíslí-číslo/kód",
  ibanLabel: "IBAN (český)",
  ibanPh: "CZ...",
  run: "Převést",
  copy: "Kopírovat",
  outIban: "IBAN",
  outAcc: "Číslo účtu",
  detBank: "Banka / kód",
  note: "Převod běží lokálně v prohlížeči. Kód banky je povinný (např. /0800). Formát se neodesílá nikam.",
};

function pad(s: string, n: number) {
  while (s.length < n) s = "0" + s;
  return s;
}

// mod 97 pro velká čísla (řetězcově) — 1:1 s legacy.
function mod97(s: string) {
  let rem = 0;
  for (let i = 0; i < s.length; i++) rem = (rem * 10 + parseInt(s[i], 10)) % 97;
  return rem;
}

interface Acc { bank: string; prefix: string; account: string }

function parseAcc(raw: string): Acc | { error: string } | null {
  if (!raw) return null;
  const s = raw.replace(/\s+/g, "").toUpperCase();
  let bank = "", prefix = "000000", account = "";
  const m = s.split("/");
  const main = m[0];
  if (m.length === 2) bank = m[1];
  const parts = main.split("-");
  if (parts.length === 2) { prefix = parts[0]; account = parts[1]; }
  else account = parts[0];
  if (!/^\d+$/.test(bank) || bank.length !== 4) return { error: "Kód banky musí mít 4 číslice (např. /0800)." };
  if (!/^\d{1,6}$/.test(prefix)) return { error: "Předčíslí může mít max. 6 číslic." };
  if (!/^\d{1,10}$/.test(account)) return { error: "Číslo účtu může mít max. 10 číslic." };
  return { bank, prefix: pad(prefix, 6), account: pad(account, 10) };
}

function accToIban(a: Acc): string {
  const bban = a.bank + a.prefix + a.account;
  const n = bban + "1235" + "00";
  const check = 98 - mod97(n);
  const checkStr = (check < 10 ? "0" : "") + check;
  return "CZ" + checkStr + bban;
}

function ibanToAcc(raw: string): Acc | { error: string } {
  if (!raw) return { error: "Zadejte IBAN." };
  const s = raw.replace(/\s+/g, "").toUpperCase();
  if (s.length !== 24) return { error: `Český IBAN musí mít 24 znaků (zadáno ${s.length}).` };
  if (s.slice(0, 2) !== "CZ") return { error: "IBAN musí začínat na CZ." };
  const checkStr = s.slice(2, 4);
  const bban = s.slice(4);
  const n = bban + "1235" + checkStr;
  if (mod97(n) !== 1) return { error: "Neplatný kontrolní součet IBAN." };
  return { bank: bban.slice(0, 4), prefix: bban.slice(4, 10), account: bban.slice(10, 24) };
}

function fmtAcc(a: Acc): string {
  const p = a.prefix.replace(/^0+/, "") || "0";
  return (a.prefix.replace(/^0+/, "") ? p + "-" : "") + (a.account.replace(/^0+/, "") || "0") + "/" + a.bank;
}

export default function IbanConverter({ locale }: ToolComponentProps) {
  const [mode, setMode] = useState<"to" | "from">("to");
  const [out, setOut] = useState("—");
  const [outK, setOutK] = useState(S.outIban);
  const [det, setDet] = useState("—");
  const [showDet, setShowDet] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [acc, setAcc] = useState("");
  const [iban, setIban] = useState("");

  const run = () => {
    setErr(null);
    setShowDet(false);
    if (mode === "to") {
      const a = parseAcc(acc);
      if (!a) { setErr("Zadejte číslo účtu."); return; }
      if ("error" in a) { setErr(a.error); return; }
      setOutK(S.outIban);
      setOut(accToIban(a));
      setDet(a.bank + " · " + fmtAcc(a));
      setShowDet(true);
    } else {
      const r = ibanToAcc(iban);
      if ("error" in r) { setErr(r.error); return; }
      setOutK(S.outAcc);
      setOut(fmtAcc(r));
      setDet("CZ " + r.bank + " · banka");
      setShowDet(true);
    }
  };

  const switchMode = (m: "to" | "from") => {
    setMode(m);
    setErr(null);
    setOut("—");
    setShowDet(false);
  };

  const doCopy = () => {
    if (out && out !== "—") copyText(out, locale);
  };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="seg" id="iban_mode" role="tablist" aria-label="Směr převodu IBAN">
        <button type="button" className={mode === "to" ? "active" : ""} data-mode="to" role="tab" aria-selected={mode === "to"} onClick={() => switchMode("to")}>{S.segTo}</button>
        <button type="button" className={mode === "from" ? "active" : ""} data-mode="from" role="tab" aria-selected={mode === "from"} onClick={() => switchMode("from")}>{S.segFrom}</button>
      </div>

      <div className={`stack-sm${mode === "to" ? "" : " hidden"}`} id="iban-to">
        <label className="field-label" htmlFor="iban-acc">{S.accLabel}</label>
        <input className="input mono" type="text" id="iban-acc" placeholder={S.accPh} autoComplete="off" value={acc} onChange={(e) => setAcc(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} />
      </div>
      <div className={`stack-sm${mode === "from" ? "" : " hidden"}`} id="iban-from">
        <label className="field-label" htmlFor="iban-iban">{S.ibanLabel}</label>
        <input className="input mono" type="text" id="iban-iban" placeholder={S.ibanPh} autoComplete="off" value={iban} onChange={(e) => setIban(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} />
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="iban-run" type="button" onClick={run}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
          </svg>{" "}{S.run}
        </button>
        <button className="btn btn-ghost" id="iban-copy" type="button" disabled={!showDet} onClick={doCopy}>
          <Icon name="Copy" size={16} /> {S.copy}
        </button>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k" id="iban-out-k">{outK}</span><span className="v accent mono" id="iban-out">{out}</span></div>
        <div className={`kv${showDet ? "" : " hidden"}`} id="iban-det-row"><span className="k">{S.detBank}</span><span className="v mono" id="iban-det">{det}</span></div>
      </div>

      {err ? <p className="error-text" id="iban-error" role="alert">{err}</p> : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}