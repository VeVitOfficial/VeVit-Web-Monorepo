"use client";

// Stav lekce v místním průběhu: štítek (Nezačato / Rozpracováno / Hotovo), tlačítko „Označit jako
// hotové" a automatické „Rozpracováno" při otevření lekce. Stav je vždy i text, ne jen barva.

import { useEffect } from "react";
import { useEduLang } from "../i18n";
import { lessonStateOf, type LessonState } from "@/lib/edu/aifb/progress";
import { getProgressNow, setStatus, useAifbProgress } from "./use-progress";

const STATE_KEY: Record<LessonState, string> = {
  todo: "aifb.status.todo",
  started: "aifb.status.started",
  done: "aifb.status.done",
};

export function LessonStatusBadge({ lessonId }: { lessonId: string }) {
  const { t } = useEduLang();
  const state = lessonStateOf(useAifbProgress(), lessonId);
  return <span className="aifb-state" data-state={state}>{state === "done" ? "✓ " : ""}{t(STATE_KEY[state])}</span>;
}

export function LessonProgressControls({ lessonId, autoStart }: { lessonId: string; autoStart: boolean }) {
  const { t } = useEduLang();
  const state = lessonStateOf(useAifbProgress(), lessonId);

  useEffect(() => {
    // Čte se uložený stav, ne hodnota z renderu: při hydrataci je v renderu ještě „todo" a hotová
    // lekce by se přepsala na „rozpracováno" (chybu odhalil E2E test).
    if (autoStart && lessonStateOf(getProgressNow(), lessonId) === "todo") setStatus(lessonId, "started");
  }, [lessonId, autoStart]);

  return (
    <div className="aifb-lesson-progress aifb-noprint">
      <span className="aifb-state" data-state={state} role="status">
        {t("aifb.progress.lessonState", { state: t(STATE_KEY[state]) })}
      </span>
      <button
        type="button"
        className={state === "done" ? "btn btn-ghost" : "btn btn-primary"}
        onClick={() => setStatus(lessonId, state === "done" ? "started" : "done")}
      >
        {state === "done" ? t("aifb.progress.unmark") : t("aifb.progress.mark")}
      </button>
    </div>
  );
}
