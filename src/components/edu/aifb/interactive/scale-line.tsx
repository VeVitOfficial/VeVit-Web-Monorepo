"use client";

// ScaleLine: přímka mezi dvěma póly (např. „pomáhá mi“ ↔ „dělá to za mě“). Žák umístí situaci na
// přímku; pozice mimo správné rozmezí dostane nápovědu, kterým směrem se posunout.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { scaleHit } from "@/lib/edu/aifb/interactive-logic";
import type { ScaleLineConfig } from "@/lib/edu/aifb/pupil";
import { Dots, Emoji, Result } from "./game-ui";

export function ScaleLine({ config }: { config: ScaleLineConfig }) {
  const { t } = useEduLang();
  const steps = config.steps ?? 5;
  const [index, setIndex] = useState(0);
  const [first, setFirst] = useState<Record<string, number>>({});
  const [position, setPosition] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const total = config.items.length;
  const restart = () => { setIndex(0); setFirst({}); setPosition(null); setTries(0); };

  if (index >= total) {
    const correct = config.items.filter((item) => first[item.id] !== undefined && scaleHit(item, first[item.id]) === 0).length;
    return <div className="aifb-game aifb-scale"><Result t={t} correct={correct} total={total} onRestart={restart} /></div>;
  }

  const item = config.items[index];
  const hit = position === null ? null : scaleHit(item, position);
  const choose = (n: number) => {
    if (first[item.id] === undefined) setFirst({ ...first, [item.id]: n });
    setPosition(n);
    setTries(tries + 1);
  };

  return (
    <div className="aifb-game aifb-scale">
      <Dots total={total} current={index} done={(i) => i < index} />
      <div key={item.id} className="aifb-game__card">
        <p className="aifb-game__step">{t("aifb.game.situation", { n: index + 1, total })}</p>
        <p className="aifb-game__prompt"><Emoji value={item.emoji} className="aifb-game__emoji--big" />{item.text}</p>
        <div className="aifb-scale__line" role="group" aria-label={`${config.left} – ${config.right}`}>
          <span className="aifb-scale__pole">{config.left}</span>
          <span className="aifb-scale__track">
            {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className="aifb-scale__dot"
                data-state={position === n ? (hit === 0 ? "right" : "wrong") : "idle"}
                aria-pressed={position === n}
                aria-label={t("aifb.scale.pick", { n, total: steps })}
                disabled={hit === 0}
                onClick={() => choose(n)}
              />
            ))}
          </span>
          <span className="aifb-scale__pole aifb-scale__pole--right">{config.right}</span>
        </div>
        {hit !== null ? (
          <p key={tries} className="aifb-game__feedback" role="status" data-right={hit === 0}>
            {hit === 0 ? <><strong>{t("aifb.quiz.correct")}</strong> {item.feedback}</> : <strong>{t(hit < 0 ? "aifb.scale.left" : "aifb.scale.right")}</strong>}
          </p>
        ) : null}
        {hit === 0 ? (
          <button type="button" className="btn btn-primary aifb-game__next" onClick={() => { setIndex(index + 1); setPosition(null); }}>
            {index + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
