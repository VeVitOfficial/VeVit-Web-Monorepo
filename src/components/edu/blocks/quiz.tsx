"use client";

// Quiz – port edu/js/components/quiz.js. Single-choice kvíz s postupem, feedback
// a závěrečnými výsledky. Třídy identické s legacy; JSX nahrazuje string template.

import { useState } from "react";
import { useEduLang } from "../i18n";
import { Icon } from "./icon";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  [key: string]: unknown;
}

interface QuizProps {
  questions: QuizQuestion[];
}

function resultMessage(lang: string, percentage: number): string {
  const dict: Record<string, Record<string, string>> = {
    cs: {
      ge90: "Skvělé! Máš to perfektně zvládnuté. 🔥",
      ge70: "Dobrá práce! Ještě malé doladění a budeš expert. 👍",
      ge50: "Není to špatné, ale ještě si to zopakuj. 📚",
      lt50: "Zkus to znovu, procvičováním se zlepšíš! 💪",
    },
    en: {
      ge90: "Excellent! You've mastered this perfectly. 🔥",
      ge70: "Good job! A little fine-tuning and you'll be an expert. 👍",
      ge50: "Not bad, but review it once more. 📚",
      lt50: "Try again, practice makes perfect! 💪",
    },
    es: {
      ge90: "¡Excelente! Lo tienes dominado a la perfección. 🔥",
      ge70: "¡Buen trabajo! Un pequeño ajuste y serás un experto. 👍",
      ge50: "No está mal, pero repásalo una vez más. 📚",
      lt50: "¡Inténtalo de nuevo, la práctica hace al maestro! 💪",
    },
    de: {
      ge90: "Hervorragend! Du beherrschst das perfekt. 🔥",
      ge70: "Gute Arbeit! Noch ein bisschen Feinschliff und du bist Experte. 👍",
      ge50: "Nicht schlecht, aber wiederhole es noch einmal. 📚",
      lt50: "Versuche es erneut, Übung macht den Meister! 💪",
    },
    uk: {
      ge90: "Чудово! Ти ідеально це засвоїв. 🔥",
      ge70: "Гарна робота! Трохи практики і ти експерт. 👍",
      ge50: "Непогано, але повтори ще раз. 📚",
      lt50: "Спробуй ще, практика робить досконалим! 💪",
    },
    fr: {
      ge90: "Excellent! You've mastered this perfectly. 🔥",
      ge70: "Good job! A little fine-tuning and you'll be an expert. 👍",
      ge50: "Not bad, but review it once more. 📚",
      lt50: "Try again, practice makes perfect! 💪",
    },
    sk: {
      ge90: "Skvelé! Máš to perfektne zvládnuté. 🔥",
      ge70: "Dobrá práca! Ešte malé doladenie a budeš expert. 👍",
      ge50: "Nie je to zlé, ale ešte si to zopakuj. 📚",
      lt50: "Skús to znova, precvičovaním sa zlepšíš! 💪",
    },
  };
  const d = dict[lang] || dict.cs;
  if (percentage >= 90) return d.ge90;
  if (percentage >= 70) return d.ge70;
  if (percentage >= 50) return d.ge50;
  return d.lt50;
}

export function Quiz({ questions }: QuizProps) {
  const { t, lang } = useEduLang();
  const total = questions.length;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (total === 0) return null;

  const progress = ((current + (finished ? 1 : answered ? 1 : 0)) / total) * 100;

  function restart() {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <Icon name="trophy" className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">{t("quiz.results")}!</h3>
        <p className="text-sm text-[var(--color-muted)] mb-1">
          {t("quiz.score")}: {score} {t("quiz.of")} {total}
        </p>
        <p className="text-3xl font-bold text-emerald-500 mb-4">{percentage}%</p>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">{resultMessage(lang, percentage)}</p>
        <button
          type="button"
          onClick={restart}
          className="gap-2 glass border border-[var(--color-border-subtle)] rounded-md px-4 py-2 text-sm font-medium hover:bg-[var(--color-glass-highlight)] transition-colors inline-flex items-center"
        >
          <Icon name="rotate-ccw" className="h-4 w-4" />
          {t("quiz.retry")}
        </button>
      </div>
    );
  }

  const q = questions[current];
  const isLast = current === total - 1;

  return (
    <div className="glass glow-border my-8 overflow-hidden max-w-3xl mx-auto rounded-xl border border-[var(--color-glass-border)]">
      <div className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="brain" className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t("lesson.quiz")}</h3>
          </div>
          <span className="text-xs text-[var(--color-muted)]">
            {t("quiz.question")} {current + 1} {t("quiz.of")} {total}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full bg-[var(--color-input-bg)] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          <h3 className="text-base font-medium leading-7 text-[var(--color-text-primary)]">{q.question}</h3>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = answered && i === q.correctIndex;
              const isWrong = answered && isSelected && i !== q.correctIndex;
              let stateCls: string;
              if (isCorrect) stateCls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
              else if (isWrong) stateCls = "border-red-500/50 bg-red-500/10 text-red-500";
              else if (isSelected) stateCls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
              else stateCls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)] hover:border-[var(--color-glass-highlight)]";
              const dim = answered && !isSelected && i !== q.correctIndex ? "opacity-50 cursor-not-allowed" : "";

              let badgeCls: string;
              if (isCorrect) badgeCls = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500";
              else if (isWrong) badgeCls = "bg-red-500/20 border-red-500/30 text-red-500";
              else if (isSelected) badgeCls = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500";
              else badgeCls = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]";

              return (
                <button
                  key={i}
                  type="button"
                  disabled={answered}
                  onClick={() => {
                    if (answered) return;
                    setSelected(i);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${stateCls} ${dim}`}
                >
                  <span className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${badgeCls}`}>
                    {isCorrect ? <Icon name="check" className="h-3.5 w-3.5" /> : isWrong ? <Icon name="x" className="h-3.5 w-3.5" /> : LETTERS[i] || String(i + 1)}
                  </span>
                  <span className="text-sm leading-5">{opt}</span>
                </button>
              );
            })}
          </div>
          {answered ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mt-4">
              <p className="text-sm text-emerald-500 font-medium mb-1">{t("quiz.explanation")}:</p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-6">{q.explanation || ""}</p>
            </div>
          ) : null}
        </div>
        <div className="my-4 h-px bg-[var(--color-border-subtle)]" />
        <div className="flex justify-end">
          {!answered ? (
            <button
              type="button"
              disabled={selected === null}
              onClick={() => {
                if (selected === null) return;
                if (selected === q.correctIndex) setScore((s) => s + 1);
                setAnswered(true);
              }}
              className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Icon name="check-circle-2" className="h-4 w-4" />
              {t("quiz.submit")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (current >= total - 1) setFinished(true);
                else {
                  setCurrent((c) => c + 1);
                  setSelected(null);
                  setAnswered(false);
                }
              }}
              className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              {isLast ? t("quiz.finish") : t("quiz.next")}
              <Icon name="arrow-right" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}