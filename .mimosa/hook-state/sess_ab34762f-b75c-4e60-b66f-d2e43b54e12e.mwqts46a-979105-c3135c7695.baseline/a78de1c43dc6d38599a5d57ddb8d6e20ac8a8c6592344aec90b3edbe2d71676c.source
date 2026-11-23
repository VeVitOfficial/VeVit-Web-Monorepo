"use client";

// QuizCard: kvíz po jedné otázce. Možnosti jsou velké dlaždice (tlačítka, ovladatelná klávesnicí);
// odpověď se hodnotí hned po výběru: správná ukáže vysvětlení a tlačítko „Další“, chybnou lze zkusit
// znovu. Hvězdičky na konci se počítají z odpovědí napoprvé.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { quizScore } from "@/lib/edu/aifb/interactive-logic";
import type { QuizConfig } from "@/lib/edu/aifb/pupil";
import { Dots, Emoji, Result } from "./game-ui";

export function QuizCard({ config }: { config: QuizConfig }) {
  const { t } = useEduLang();
  const [index, setIndex] = useState(0);
  const [first, setFirst] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Record<string, string[]>>({});
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const total = config.questions.length;
  const restart = () => { setIndex(0); setFirst({}); setWrong({}); setSolved({}); };

  if (index >= total) {
    const score = quizScore(config, first);
    return (
      <div className="aifb-game aifb-quiz">
        <Result t={t} correct={score.correct} total={score.total} onRestart={restart} />
      </div>
    );
  }

  const question = config.questions[index];
  const tried = wrong[question.id] ?? [];
  const isSolved = solved[question.id] === true;
  const pick = (optionId: string) => {
    if (first[question.id] === undefined) setFirst({ ...first, [question.id]: optionId });
    if (optionId === question.correct) setSolved({ ...solved, [question.id]: true });
    else setWrong({ ...wrong, [question.id]: [...tried, optionId] });
  };

  return (
    <div className="aifb-game aifb-quiz">
      <Dots total={total} current={index} done={(i) => solved[config.questions[i].id] === true} />
      <fieldset key={question.id} className="aifb-quiz__q aifb-game__card">
        <legend>
          <span className="aifb-game__step">{t("aifb.game.question", { n: index + 1, total })}</span>
          <span className="aifb-game__prompt"><Emoji value={question.emoji} className="aifb-game__emoji--big" />{question.prompt}</span>
        </legend>
        <div className="aifb-game__options">
          {question.options.map((option) => {
            const state = isSolved && option.id === question.correct ? "right" : tried.includes(option.id) ? "wrong" : "idle";
            return (
              <button
                key={option.id}
                type="button"
                className="aifb-tile"
                data-state={state}
                aria-pressed={state !== "idle"}
                disabled={isSolved || state === "wrong"}
                onClick={() => pick(option.id)}
              >
                <Emoji value={option.emoji} />
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
        {isSolved ? (
          <p className="aifb-quiz__feedback aifb-game__feedback" role="status" data-right="true">
            <strong>{t("aifb.quiz.correct")}</strong> {question.explanation}
          </p>
        ) : tried.length > 0 ? (
          <p key={tried.length} className="aifb-quiz__feedback aifb-game__feedback" role="status" data-right="false">
            <strong>{t("aifb.quiz.wrong")}</strong>
          </p>
        ) : null}
        {isSolved ? (
          <button type="button" className="btn btn-primary aifb-game__next" onClick={() => setIndex(index + 1)}>
            {index + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
          </button>
        ) : null}
      </fieldset>
    </div>
  );
}
