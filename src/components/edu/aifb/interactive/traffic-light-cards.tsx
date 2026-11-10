"use client";

// TrafficLightCards: zelená / červená (výchozí „můžu říct“ / „tajemství“, nebo vlastní popisky) po jedné
// situaci. Vedle textu svítí semafor; odpověď je vždy i text, ne jen barva. Správná odpověď ukáže
// vysvětlení a tlačítko „Další“, chybnou lze zkusit znovu. Hvězdičky se počítají z odpovědí napoprvé.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { trafficCorrect, type Light } from "@/lib/edu/aifb/interactive-logic";
import type { TrafficLightConfig } from "@/lib/edu/aifb/pupil";
import { Dots, Emoji, Result } from "./game-ui";

export function TrafficLightCards({ config }: { config: TrafficLightConfig }) {
  const { t } = useEduLang();
  const [index, setIndex] = useState(0);
  const [first, setFirst] = useState<Record<string, Light>>({});
  const [answers, setAnswers] = useState<Record<string, Light>>({});
  const [tries, setTries] = useState(0);
  const total = config.situations.length;
  const labelOf = (light: Light) => config.labels?.[light] ?? t(light === "green" ? "aifb.traffic.green" : "aifb.traffic.red");
  const restart = () => { setIndex(0); setFirst({}); setAnswers({}); setTries(0); };

  if (index >= total) {
    const result = trafficCorrect(config, first);
    return (
      <div className="aifb-game aifb-traffic">
        {result.graded > 0
          ? <Result t={t} correct={result.correct} total={result.graded} onRestart={restart} />
          : <Result t={t} message={t("aifb.game.result.3")} onRestart={restart} />}
      </div>
    );
  }

  const situation = config.situations[index];
  const answer = answers[situation.id];
  const right = answer !== undefined && (situation.answer === undefined || answer === situation.answer);
  const choose = (light: Light) => {
    if (first[situation.id] === undefined) setFirst({ ...first, [situation.id]: light });
    setAnswers({ ...answers, [situation.id]: light });
    setTries(tries + 1);
  };

  return (
    <div className="aifb-game aifb-traffic">
      <Dots total={total} current={index} done={(i) => i < index} />
      <div key={situation.id} className="aifb-traffic__item aifb-game__card">
        <p className="aifb-game__step">{t("aifb.game.situation", { n: index + 1, total })}</p>
        <div className="aifb-traffic__scene">
          <span className="aifb-traffic__lamp" data-lit={answer ?? "none"} aria-hidden="true"><i /><i /></span>
          <p className="aifb-traffic__text aifb-game__prompt"><Emoji value={situation.emoji} className="aifb-game__emoji--big" />{situation.text}</p>
        </div>
        <div className="aifb-traffic__buttons aifb-game__options" role="group" aria-label={situation.text}>
          {(["green", "red"] as const).map((light) => (
            <button
              key={light}
              type="button"
              className={`aifb-tile aifb-light aifb-light--${light}`}
              data-state={answer === light ? (right ? "right" : "wrong") : "idle"}
              aria-pressed={answer === light}
              disabled={right}
              onClick={() => choose(light)}
            >
              <span className="aifb-light__dot" aria-hidden="true" />
              <span>{labelOf(light)}</span>
            </button>
          ))}
        </div>
        {answer !== undefined ? (
          <p key={tries} className="aifb-traffic__feedback aifb-game__feedback" role="status" data-right={right}>
            {right
              ? <>{situation.answer !== undefined ? <><strong>{t("aifb.quiz.correct")}</strong>{" "}</> : null}{situation.feedback ?? t("aifb.traffic.answer", { answer: labelOf(answer) })}</>
              : <strong>{t("aifb.traffic.answer", { answer: labelOf(answer) })} {t("aifb.traffic.retry")}</strong>}
          </p>
        ) : null}
        {right ? (
          <button type="button" className="btn btn-primary aifb-game__next" onClick={() => setIndex(index + 1)}>
            {index + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
