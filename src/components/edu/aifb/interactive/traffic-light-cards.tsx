"use client";

// TrafficLightCards: zelená (můžu říct) / červená (tajemství) u každé situace. Odpověď je vždy i text,
// ne jen barva; zpětná vazba se ukáže hned po odpovědi.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { trafficCorrect, type Light } from "@/lib/edu/aifb/interactive-logic";
import type { TrafficLightConfig } from "@/lib/edu/aifb/pupil";

export function TrafficLightCards({ config }: { config: TrafficLightConfig }) {
  const { t } = useEduLang();
  const [answers, setAnswers] = useState<Record<string, Light>>({});
  const result = trafficCorrect(config, answers);
  const answeredAll = Object.keys(answers).length === config.situations.length;
  const labelOf = (light: Light) => t(light === "green" ? "aifb.traffic.green" : "aifb.traffic.red");

  return (
    <div className="aifb-traffic">
      <ol className="aifb-traffic__list">
        {config.situations.map((situation) => {
          const answer = answers[situation.id];
          const right = answer !== undefined && situation.answer !== undefined ? answer === situation.answer : null;
          return (
            <li key={situation.id} className="aifb-traffic__item">
              <p className="aifb-traffic__text">{situation.text}</p>
              <div className="aifb-traffic__buttons" role="group" aria-label={situation.text}>
                {(["green", "red"] as const).map((light) => (
                  <button
                    key={light}
                    type="button"
                    className={`btn btn-ghost aifb-light aifb-light--${light}`}
                    aria-pressed={answer === light}
                    onClick={() => setAnswers({ ...answers, [situation.id]: light })}
                  >
                    {labelOf(light)}
                  </button>
                ))}
              </div>
              {answer !== undefined ? (
                <p className="aifb-traffic__feedback" role="status">
                  {t("aifb.traffic.answer", { answer: labelOf(answer) })}{" "}
                  {right === false ? t("aifb.traffic.retry") : situation.feedback}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      {answeredAll && result.graded > 0 ? <p className="aifb-sort__status" role="status">{t("aifb.traffic.score", { correct: result.correct, graded: result.graded })}</p> : null}
    </div>
  );
}
