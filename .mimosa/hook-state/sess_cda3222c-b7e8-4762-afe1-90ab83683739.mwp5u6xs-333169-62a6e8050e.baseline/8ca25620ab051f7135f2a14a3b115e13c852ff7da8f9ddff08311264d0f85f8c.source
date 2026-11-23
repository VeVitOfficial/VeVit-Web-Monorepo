"use client";

// ChatSim: rozhovor v bublinách. Protistrana (chatbot, kamarád, neznámý odesílatel, agent) napíše
// zprávu a žák vybírá, jak zareaguje. Rozumná reakce posune rozhovor dál, u nerozumné se ukáže proč
// a lze zvolit jinou. Nikam se nic neodesílá, rozhovor je předem napsaný.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import type { ChatSimConfig } from "@/lib/edu/aifb/pupil";
import { Dots, Result } from "./game-ui";

export function ChatSim({ config }: { config: ChatSimConfig }) {
  const { t } = useEduLang();
  const [index, setIndex] = useState(0);
  const [first, setFirst] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Record<string, string[]>>({});
  const total = config.steps.length;
  const restart = () => { setIndex(0); setFirst({}); setDone({}); setWrong({}); };
  const finished = index >= total;
  const step = finished ? null : config.steps[index];
  const tried = step ? wrong[step.id] ?? [] : [];
  const lastWrong = step ? step.choices.find((choice) => choice.id === tried[tried.length - 1]) : undefined;
  const chosen = step ? step.choices.find((choice) => choice.id === done[step.id]) : undefined;

  const pick = (choiceId: string, good: boolean) => {
    if (!step) return;
    if (first[step.id] === undefined) setFirst({ ...first, [step.id]: choiceId });
    if (good) setDone({ ...done, [step.id]: choiceId });
    else setWrong({ ...wrong, [step.id]: [...tried, choiceId] });
  };

  const history = config.steps.slice(0, finished ? total : index + 1);
  const correct = config.steps.filter((s) => s.choices.find((choice) => choice.id === first[s.id])?.good === true).length;

  return (
    <div className="aifb-game aifb-chat">
      <Dots total={total} current={index} done={(i) => done[config.steps[i].id] !== undefined} />
      <div className="aifb-game__card aifb-chat__window">
        <p className="aifb-chat__persona"><span aria-hidden="true">{config.persona.emoji}</span> {config.persona.name}</p>
        <ol className="aifb-chat__log">
          {history.map((s) => {
            const answer = s.choices.find((choice) => choice.id === done[s.id]);
            return (
              <li key={s.id}>
                <div className="aifb-bubble aifb-bubble--them"><span className="aifb-bubble__who">{config.persona.name}</span><p>{s.message}</p></div>
                {answer ? <div className="aifb-bubble aifb-bubble--me"><span className="aifb-bubble__who">{t("aifb.chat.you")}</span><p>{answer.text}</p></div> : null}
                {answer?.reply ? <div className="aifb-bubble aifb-bubble--them"><span className="aifb-bubble__who">{config.persona.name}</span><p>{answer.reply}</p></div> : null}
              </li>
            );
          })}
        </ol>
        {step && !chosen ? (
          <>
            <p className="aifb-game__ask">{t("aifb.chat.choose")}</p>
            <div className="aifb-game__options aifb-chat__choices">
              {step.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="aifb-tile"
                  data-state={tried.includes(choice.id) ? "wrong" : "idle"}
                  disabled={tried.includes(choice.id)}
                  onClick={() => pick(choice.id, choice.good === true)}
                >
                  <span>{choice.text}</span>
                </button>
              ))}
            </div>
            {lastWrong ? (
              <p key={tried.length} className="aifb-game__feedback" role="status" data-right="false">
                {lastWrong.feedback} <strong>{t("aifb.chat.retry")}</strong>
              </p>
            ) : null}
          </>
        ) : null}
        {step && chosen ? (
          <>
            <p className="aifb-game__feedback" role="status" data-right="true"><strong>{t("aifb.quiz.correct")}</strong> {chosen.feedback}</p>
            <button type="button" className="btn btn-primary aifb-game__next" onClick={() => setIndex(index + 1)}>
              {index + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
            </button>
          </>
        ) : null}
      </div>
      {finished ? <Result t={t} correct={correct} total={total} onRestart={restart} /> : null}
    </div>
  );
}
