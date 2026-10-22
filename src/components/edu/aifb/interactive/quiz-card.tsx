"use client";

// QuizCard: kvíz s jednou správnou odpovědí a vysvětlením. Každá otázka je skupina přepínačů
// (ovladatelná klávesnicí); po kontrole se ukáže text „Správně" / „Zatím ne" a vysvětlení.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { quizScore } from "@/lib/edu/aifb/interactive-logic";
import type { QuizConfig } from "@/lib/edu/aifb/pupil";

export function QuizCard({ config }: { config: QuizConfig }) {
  const { t } = useEduLang();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const score = quizScore(config, Object.fromEntries(Object.entries(picked).filter(([id]) => checked[id])));
  const allChecked = config.questions.every((question) => checked[question.id]);

  return (
    <div className="aifb-quiz">
      {config.questions.map((question, index) => {
        const isChecked = checked[question.id] === true;
        const right = picked[question.id] === question.correct;
        return (
          <fieldset key={question.id} className="aifb-quiz__q">
            <legend>{index + 1}. {question.prompt}</legend>
            {question.options.map((option) => (
              <label key={option.id} className="aifb-quiz__option">
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={picked[question.id] === option.id}
                  onChange={() => { setPicked({ ...picked, [question.id]: option.id }); setChecked({ ...checked, [question.id]: false }); }}
                />
                <span>{option.text}</span>
              </label>
            ))}
            <button type="button" className="btn btn-primary" disabled={picked[question.id] === undefined} onClick={() => setChecked({ ...checked, [question.id]: true })}>
              {t("aifb.quiz.check")}
            </button>
            {isChecked ? (
              <p className="aifb-quiz__feedback" role="status" data-right={right}>
                <strong>{right ? t("aifb.quiz.correct") : t("aifb.quiz.wrong")}</strong> {question.explanation}
              </p>
            ) : null}
          </fieldset>
        );
      })}
      {allChecked ? (
        <p className="aifb-sort__status" role="status">
          {t("aifb.quiz.score", { correct: score.correct, total: score.total })}{" "}
          <button type="button" className="btn btn-ghost" onClick={() => { setPicked({}); setChecked({}); }}>{t("aifb.quiz.reset")}</button>
        </p>
      ) : null}
    </div>
  );
}
