"use client";

// Společné prvky herní podoby cvičení: obrázek (emoji), ukazatel postupu, výsledek s hvězdičkami.
// Emoji jsou jen ozdoba (aria-hidden); stav se vždy říká i textem, nikdy jen barvou nebo obrázkem.

import type { ReactNode } from "react";
import { starsFor } from "@/lib/edu/aifb/interactive-logic";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function Emoji({ value, className }: { value?: string; className?: string }) {
  if (!value) return null;
  return <span className={`aifb-game__emoji${className ? ` ${className}` : ""}`} aria-hidden="true">{value}</span>;
}

/** Tečky postupu: hotové, aktuální a zbývající kroky. Čtečce stačí text kroku v legendě. */
export function Dots({ total, current, done }: { total: number; current: number; done: (index: number) => boolean }) {
  return (
    <ol className="aifb-game__dots" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <li key={index} data-state={done(index) ? "done" : index === current ? "current" : "todo"} />
      ))}
    </ol>
  );
}

const CONFETTI = ["⭐", "🎉", "✨", "🌟", "🎊", "⭐", "✨", "🎉"];

/** Závěrečná karta: hvězdičky podle počtu odpovědí napoprvé (bez hodnocení jen pochvala a zpráva). */
export function Result({
  t, correct, total, message, onRestart, children,
}: { t: T; correct?: number; total?: number; message?: string; onRestart: () => void; children?: ReactNode }) {
  const graded = correct !== undefined && total !== undefined && total > 0;
  const stars = graded ? starsFor(correct, total) : 3;
  return (
    <div className="aifb-game__result" role="status">
      <div className="aifb-game__confetti" aria-hidden="true">
        {CONFETTI.map((piece, index) => <span key={index} style={{ left: `${6 + index * 12.5}%`, animationDelay: `${index * 0.12}s` }}>{piece}</span>)}
      </div>
      {graded ? (
        <p className="aifb-game__stars">
          <span aria-hidden="true">
            {[1, 2, 3].map((n) => <span key={n} className="aifb-game__star" data-on={n <= stars} style={{ animationDelay: `${n * 0.18}s` }}>★</span>)}
          </span>
          <span className="aifb-sr">{t("aifb.game.stars", { n: stars })}</span>
        </p>
      ) : null}
      <p className="aifb-game__result-title">{message ?? t(`aifb.game.result.${stars}`)}</p>
      {graded ? <p className="aifb-game__result-score">{t("aifb.game.firstTry", { correct, total })}</p> : null}
      {children}
      <button type="button" className="btn btn-primary" onClick={onRestart}>{t("aifb.game.again")}</button>
    </div>
  );
}
