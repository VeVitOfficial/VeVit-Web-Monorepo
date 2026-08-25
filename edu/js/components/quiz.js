// QuizCard – port QuizCard/QuestionView/AnswerOption/QuizResults + useQuiz

import { icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { t, currentLang } from "../store/lang.js?v=20260824a";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function answerOption(opt, i, { selected, isCorrect, disabled }) {
  const letter = LETTERS[i] || String(i + 1);
  let stateCls;
  if (isCorrect === true) stateCls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
  else if (isCorrect === false && selected) stateCls = "border-red-500/50 bg-red-500/10 text-red-500";
  else if (selected) stateCls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
  else stateCls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)] hover:border-[var(--color-glass-highlight)]";

  const dim = disabled && !selected && isCorrect === undefined ? "opacity-50 cursor-not-allowed" : "";

  let badgeCls;
  if (selected || isCorrect !== undefined) {
    if (isCorrect === true) badgeCls = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500";
    else if (isCorrect === false && selected) badgeCls = "bg-red-500/20 border-red-500/30 text-red-500";
    else badgeCls = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500";
  } else badgeCls = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]";

  let badgeInner = "";
  if (isCorrect === true) badgeInner = icon("check", "h-3.5 w-3.5");
  else if (isCorrect === false && selected) badgeInner = icon("x", "h-3.5 w-3.5");
  else if (isCorrect === undefined) badgeInner = letter;

  return `<button data-opt="${i}" ${disabled ? "disabled" : ""} class="w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${stateCls} ${dim}"><span class="h-7 w-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${badgeCls}">${badgeInner}</span><span class="text-sm leading-5">${escapeHtml(opt)}</span></button>`;
}

function resultsHTML(score, total, onRestart) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const lang = currentLang();
  let msg;
  if (percentage >= 90) msg = { cs: "Skvělé! Máš to perfektně zvládnuté. 🔥", en: "Excellent! You've mastered this perfectly. 🔥", es: "¡Excelente! Lo tienes dominado a la perfección. 🔥", de: "Hervorragend! Du beherrschst das perfekt. 🔥", uk: "Чудово! Ти ідеально це засвоїв. 🔥" }[lang];
  else if (percentage >= 70) msg = { cs: "Dobrá práce! Ještě malé doladění a budeš expert. 👍", en: "Good job! A little fine-tuning and you'll be an expert. 👍", es: "¡Buen trabajo! Un pequeño ajuste y serás un experto. 👍", de: "Gute Arbeit! Noch ein bisschen Feinschliff und du bist Experte. 👍", uk: "Гарна робота! Трохи практики і ти експерт. 👍" }[lang];
  else if (percentage >= 50) msg = { cs: "Není to špatné, ale ještě si to zopakuj. 📚", en: "Not bad, but review it once more. 📚", es: "No está mal, pero repásalo una vez más. 📚", de: "Nicht schlecht, aber wiederhole es noch einmal. 📚", uk: "Непогано, але повтори ще раз. 📚" }[lang];
  else msg = { cs: "Zkus to znovu, procvičováním se zlepšíš! 💪", en: "Try again, practice makes perfect! 💪", es: "¡Inténtalo de nuevo, la práctica hace al maestro! 💪", de: "Versuche es erneut, Übung macht den Meister! 💪", uk: "Спробуй ще, практика робить досконалим! 💪" }[lang];

  return `<div class="flex flex-col items-center justify-center py-8 text-center"><div class="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">${icon("trophy", "h-8 w-8 text-emerald-500")}</div><h3 class="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">${escapeHtml(t("quiz.results"))}!</h3><p class="text-sm text-[var(--color-muted)] mb-1">${escapeHtml(t("quiz.score"))}: ${score} ${escapeHtml(t("quiz.of"))} ${total}</p><p class="text-3xl font-bold text-emerald-500 mb-4">${percentage}%</p><p class="text-sm text-[var(--color-text-secondary)] mb-6 max-w-xs">${escapeHtml(msg)}</p><button id="quiz-restart" class="gap-2 glass border border-[var(--color-border-subtle)] rounded-md px-4 py-2 text-sm font-medium hover:bg-[var(--color-glass-highlight)] transition-colors">${icon("rotate-ccw", "h-4 w-4")}${escapeHtml(t("quiz.retry"))}</button></div>`;
}

export function mountQuiz(container, questions) {
  const total = questions.length;
  let state = { currentQuestionIndex: 0, selectedOptionIndex: null, isAnswered: false, score: 0, finished: false };

  function progress() {
    if (total === 0) return 0;
    return ((state.currentQuestionIndex + (state.finished ? 1 : state.isAnswered ? 1 : 0)) / total) * 100;
  }

  function render() {
    if (state.finished) {
      container.innerHTML = resultsHTML(state.score, total);
      const rb = container.querySelector("#quiz-restart");
      if (rb) rb.addEventListener("click", () => { state = { currentQuestionIndex: 0, selectedOptionIndex: null, isAnswered: false, score: 0, finished: false }; render(); });
      renderIcons(container);
      return;
    }
    const q = questions[state.currentQuestionIndex];
    const isLast = state.currentQuestionIndex === total - 1;
    const options = q.options
      .map((opt, i) =>
        answerOption(opt, i, {
          selected: state.selectedOptionIndex === i,
          isCorrect: state.isAnswered ? i === q.correctIndex : undefined,
          disabled: state.isAnswered,
        })
      )
      .join("");
    const explanation = state.isAnswered
      ? `<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mt-4"><p class="text-sm text-emerald-500 font-medium mb-1">${escapeHtml(t("quiz.explanation"))}:</p><p class="text-sm text-[var(--color-text-secondary)] leading-6">${escapeHtml(q.explanation)}</p></div>`
      : "";
    const submitBtn = !state.isAnswered
      ? `<button id="quiz-submit" ${state.selectedOptionIndex === null ? "disabled" : ""} class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors">${icon("check-circle-2", "h-4 w-4")}${escapeHtml(t("quiz.submit"))}</button>`
      : `<button id="quiz-next" class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">${escapeHtml(isLast ? t("quiz.finish") : t("quiz.next"))}${icon("arrow-right", "h-4 w-4")}</button>`;

    container.innerHTML = `<div class="glass glow-border my-8 overflow-hidden max-w-3xl mx-auto rounded-xl border border-[var(--color-glass-border)]"><div class="p-6 pb-3"><div class="flex items-center justify-between"><div class="flex items-center gap-2">${icon("brain", "h-4 w-4 text-emerald-500")}<h3 class="text-sm font-medium text-[var(--color-text-primary)]">${escapeHtml(t("lesson.quiz"))}</h3></div><span class="text-xs text-[var(--color-muted)]">${escapeHtml(t("quiz.question"))} ${state.currentQuestionIndex + 1} ${escapeHtml(t("quiz.of"))} ${total}</span></div><div class="mt-3 h-1.5 w-full bg-[var(--color-input-bg)] rounded-full overflow-hidden"><div class="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full" style="width:${progress()}%"></div></div></div><div class="px-6 pb-6"><div class="space-y-4"><h3 class="text-base font-medium leading-7 text-[var(--color-text-primary)]">${escapeHtml(q.question)}</h3><div class="space-y-2">${options}</div>${explanation}</div><div class="my-4 h-px bg-[var(--color-border-subtle)]"></div><div class="flex justify-end">${submitBtn}</div></div></div>`;

    container.querySelectorAll("[data-opt]").forEach((b) =>
      b.addEventListener("click", () => {
        if (state.isAnswered) return;
        state.selectedOptionIndex = Number(b.dataset.opt);
        render();
      })
    );
    const submit = container.querySelector("#quiz-submit");
    if (submit) submit.addEventListener("click", () => {
      if (state.selectedOptionIndex === null || state.isAnswered) return;
      if (state.selectedOptionIndex === q.correctIndex) state.score += 1;
      state.isAnswered = true;
      render();
    });
    const next = container.querySelector("#quiz-next");
    if (next) next.addEventListener("click", () => {
      if (!state.isAnswered) return;
      if (state.currentQuestionIndex >= total - 1) state.finished = true;
      else { state.currentQuestionIndex += 1; state.selectedOptionIndex = null; state.isAnswered = false; }
      render();
    });
    renderIcons(container);
  }

  render();
}
