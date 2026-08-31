"use client";

import { useEffect, useRef } from "react";

/**
 * Honeypot pole (Company / hp_ts) — port z legacy auth formulářů. Boti, kteří
 * vyplní viditelně skryté "hp_confirm", server zamítne; hp_ts kontroluje
 * časový rozdíl mezi načtením stránky a odesláním (anti-bot timing).
 * Hodnoty čte formulář pomocí readHoneypot() při submitu.
 */

export function readHoneypot(): { hp_confirm: string; hp_ts: number } {
  if (typeof document === "undefined") return { hp_confirm: "", hp_ts: 0 };
  const confirm = document.getElementById("hpConfirm") as HTMLInputElement | null;
  const ts = document.getElementById("hpTs") as HTMLInputElement | null;
  return { hp_confirm: confirm?.value ?? "", hp_ts: Number(ts?.value || 0) };
}

export function HpFields() {
  const tsRef = useRef<HTMLInputElement>(null);
  // hp_ts se plní při prvním renderu klienta (SSR nemá smysluplný čas načtení).
  useEffect(() => {
    if (tsRef.current) tsRef.current.value = String(Date.now());
  }, []);

  return (
    <div className="hp-field" aria-hidden="true">
      <label htmlFor="hpConfirm">Company</label>
      <input type="text" id="hpConfirm" name="hp_confirm" tabIndex={-1} autoComplete="off" />
      <input ref={tsRef} type="hidden" id="hpTs" name="hp_ts" />
    </div>
  );
}

export function AuthError({ message, id, role }: { message: string; id?: string; role?: string }) {
  return (
    <div className="auth-error" id={id} hidden={!message} role={role} aria-live={role === "alert" ? "assertive" : undefined}>
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </div>
  );
}