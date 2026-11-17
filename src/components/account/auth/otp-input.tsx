"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./otp-input.module.css";

export type OtpResult = { ok: true } | { ok: false };

type Phase = "input" | "spin" | "merge" | "ok" | "fail" | "reset";

type Props = {
  /** Ověří kód. Komponenta mezitím animuje; na odpověď počká. */
  onComplete: (code: string) => Promise<OtpResult>;
  /** Zavolá se po dokončení animace ✓ (typicky redirect). */
  onSuccess?: () => void;
  /** Zavolá se po animaci ✕, než se políčka vyprázdní. */
  onFail?: () => void;
  /** Popisek skupiny (čtečky obrazovky). */
  label: string;
  /** Popisek jednoho políčka, např. (2, 6) → „Číslice 2 z 6". */
  digitLabel: (index: number, total: number) => string;
  okText: string;
  failText: string;
  length?: number;
  autoFocus?: boolean;
};

// Časování musí sedět s otp-input.module.css
const GATHER_MS = 350;
const ORBIT_MS = 800;
const MERGE_MS = 350;
const OK_HOLD_MS = 750;
const FAIL_HOLD_MS = 1100;
const RESET_MS = 450;

/** Čas pro časování animace (jen v obsluze událostí, ne při renderu). */
function nowMs(): number {
  return performance.now();
}

/**
 * Zadání jednorázového kódu do samostatných políček (TOTP, kód z e-mailu).
 * Po poslední číslici se kód odešle sám; políčka obíhají kolem středu, dokud nepřijde
 * odpověď, pak splynou a ukáže se ✓ nebo ✕. Po ✕ se políčka vyprázdní a fokus jde na první.
 */
export function OtpInput({
  onComplete,
  onSuccess,
  onFail,
  label,
  digitLabel,
  okText,
  failText,
  length = 6,
  autoFocus = true,
}: Props) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const [phase, setPhase] = useState<Phase>("input");
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const timers = useRef<number[]>([]);
  const busy = phase !== "input" && phase !== "reset";

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, [autoFocus]);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function focusAt(index: number) {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    el?.focus();
    el?.select();
  }

  async function submit(code: string) {
    setPhase("spin");
    const orbitStart = nowMs() + GATHER_MS;
    let result: OtpResult;
    try {
      result = await onComplete(code);
    } catch {
      result = { ok: false };
    }
    // Aspoň jedna celá otáčka; splynutí začne přesně na konci otáčky, aby políčka neskočila.
    const elapsed = Math.max(0, nowMs() - orbitStart);
    const turns = Math.max(1, Math.ceil(elapsed / ORBIT_MS));
    later(() => {
      setPhase("merge");
      later(() => {
        if (result.ok) {
          setPhase("ok");
          later(() => onSuccess?.(), OK_HOLD_MS);
        } else {
          setPhase("fail");
          later(() => {
            onFail?.();
            setDigits(Array(length).fill(""));
            setPhase("reset");
            later(() => {
              setPhase("input");
              focusAt(0);
            }, RESET_MS);
          }, FAIL_HOLD_MS);
        }
      }, MERGE_MS);
    }, turns * ORBIT_MS - elapsed);
  }

  /** Vloží číslice od pozice `start` (psaní, vložení i autofill celého kódu). */
  function fill(start: number, raw: string) {
    const incoming = raw.replace(/\D/g, "").split("");
    if (incoming.length === 0) return;
    const next = [...digits];
    let i = start;
    for (const d of incoming) {
      if (i >= length) break;
      next[i++] = d;
    }
    setDigits(next);
    if (next.every(Boolean)) {
      refs.current[Math.min(i, length) - 1]?.blur();
      void submit(next.join(""));
    } else {
      focusAt(i);
    }
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (busy) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setDigits(next);
        focusAt(index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  const phaseClass =
    phase === "spin" ? styles.spin
    : phase === "merge" ? styles.merge
    : phase === "ok" || phase === "fail" ? styles.done
    : phase === "reset" ? styles.reset
    : "";

  return (
    <div className={`${styles.wrap} ${phaseClass}`} role="group" aria-label={label} aria-busy={busy}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          className={styles.box}
          style={{ "--i": index } as React.CSSProperties}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={digitLabel(index + 1, length)}
          value={digit}
          disabled={busy}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            // Jedna nová číslice, nebo celý kód z autofillu/vložení
            const value = event.target.value;
            fill(index, value.length > 1 && digit ? value.replace(digit, "") || value : value);
          }}
          onPaste={(event) => {
            event.preventDefault();
            fill(index, event.clipboardData.getData("text"));
          }}
          onKeyDown={(event) => onKeyDown(index, event)}
        />
      ))}

      {(phase === "ok" || phase === "fail") && (
        <div className={`${styles.badge} ${phase === "ok" ? styles.ok : styles.fail}`} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            {phase === "ok" ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />}
          </svg>
        </div>
      )}
      <span className={styles.sr} aria-live="assertive">
        {phase === "ok" ? okText : phase === "fail" ? failText : ""}
      </span>
    </div>
  );
}
