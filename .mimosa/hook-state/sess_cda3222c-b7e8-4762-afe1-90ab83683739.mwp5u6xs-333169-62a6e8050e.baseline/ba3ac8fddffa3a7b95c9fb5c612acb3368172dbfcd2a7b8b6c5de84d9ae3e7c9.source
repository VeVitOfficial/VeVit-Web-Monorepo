"use client";

// PromptLab: krátká kola s modelem přímo v aplikaci (styl Umíme to). Žák napíše zadání, AI odpoví
// (živě, jinak uložená ukázka) a aplikace hned odškrtne splněné podmínky na zadání i na odpovědi.
// Kolo lze opakovat s úpravou zadání; po druhém neúspěchu ho žák smí přeskočit a vrátí se na konec.
// Nic se neukládá a neposílá učiteli; osobní údaje se zastaví na klientu i na serveru (R2).

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { detectPersonalData } from "@/lib/edu/aifb/pii";
import { allOk, evaluateChecks, initialLab, labFinished, labScore, roundStars, skipRound, solveRound, SKIP_AFTER_ATTEMPTS, type CheckResult, type LabState } from "@/lib/edu/aifb/prompt-lab";
import type { PromptLabConfig } from "@/lib/edu/aifb/pupil";
import { askAi, AiModeNotice, type Answer } from "./ai-sandbox";
import { Dots, Emoji, Result } from "./game-ui";

type Phase = "write" | "solved" | "retry";

function Checklist({ title, results }: { title: string; results: CheckResult[] }) {
  if (results.length === 0) return null;
  return (
    <div className="aifb-lab__checks">
      <p className="aifb-ai__label">{title}</p>
      <ul>
        {results.map(({ check, ok }) => (
          <li key={check.id} data-ok={ok}>
            <span aria-hidden="true">{ok ? "✓" : "✗"}</span>
            <span>
              {check.label}
              <span className="aifb-sr">{ok ? " – splněno" : " – nesplněno"}</span>
              {ok ? null : <em className="aifb-lab__hint">{check.hint}</em>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PromptLab({ lessonId, categoryId, config }: { lessonId: string; categoryId: string; config: PromptLabConfig }) {
  const { t } = useEduLang();
  const [lab, setLab] = useState<LabState>(() => initialLab(config));
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("write");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [promptResults, setPromptResults] = useState<CheckResult[]>([]);
  const [answerResults, setAnswerResults] = useState<CheckResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const restart = () => {
    setLab(initialLab(config));
    setText(""); setPhase("write"); setAnswer(null); setPromptResults([]); setAnswerResults([]); setError(null); setStreak(0);
  };

  if (labFinished(lab)) {
    const score = labScore(config, lab);
    return (
      <div className="aifb-game aifb-lab">
        <Result t={t} correct={score.correct} total={score.total} onRestart={restart} />
      </div>
    );
  }

  const roundIndex = lab.queue[lab.position];
  const round = config.rounds[roundIndex];
  const attempts = lab.attempts[round.id] ?? 0;
  const total = lab.queue.length;
  const canSkip = phase === "retry" && attempts >= SKIP_AFTER_ATTEMPTS;

  const goNext = () => {
    setLab({ ...lab, position: lab.position + 1 });
    setText(""); setPhase("write"); setAnswer(null); setPromptResults([]); setAnswerResults([]); setError(null);
  };
  const skip = () => {
    setLab(skipRound(lab));
    setStreak(0);
    setText(""); setPhase("write"); setAnswer(null); setPromptResults([]); setAnswerResults([]); setError(null);
  };

  async function submit() {
    const prompt = text.trim();
    setError(null);
    const kind = detectPersonalData(prompt);
    if (kind) {
      setError(t(`aifb.ai.error.personal_data.${kind}`));
      return;
    }
    setBusy(true);
    const result = await askAi(lessonId, prompt, round.id);
    setBusy(false);
    if (!result.ok) {
      setError(t(result.error === "personal_data" && result.kind ? `aifb.ai.error.personal_data.${result.kind}` : result.error === "rate_limited" ? "aifb.ai.error.rate_limited" : "aifb.ai.error.generic"));
      return;
    }
    const forPrompt = evaluateChecks(round.promptChecks, prompt);
    // Uloženou ukázku nelze posuzovat podle zadání žáka, proto se její podmínky nevyhodnocují.
    const forAnswer = result.answer.source === "live" ? evaluateChecks(round.answerChecks ?? [], result.answer.text) : [];
    const tries = attempts + 1;
    setAnswer(result.answer);
    setPromptResults(forPrompt);
    setAnswerResults(forAnswer);
    if (allOk(forPrompt) && allOk(forAnswer)) {
      setLab({ ...solveRound({ ...lab, attempts: { ...lab.attempts, [round.id]: tries } }, round.id, tries) });
      setStreak(tries === 1 ? streak + 1 : 0);
      setPhase("solved");
    } else {
      setLab({ ...lab, attempts: { ...lab.attempts, [round.id]: tries } });
      setStreak(0);
      setPhase("retry");
    }
  }

  const ready = text.trim().length >= 3 && !busy && phase !== "solved";
  const stars = roundStars(attempts);

  return (
    <div className="aifb-game aifb-lab">
      <AiModeNotice categoryId={categoryId} />
      <Dots total={total} current={lab.position} done={(i) => lab.stars[config.rounds[lab.queue[i]].id] !== undefined} />
      <div className="aifb-lab__top">
        <span className="aifb-game__step">{t("aifb.game.round", { n: lab.position + 1, total })}</span>
        {streak >= 2 ? <span className="aifb-lab__streak" role="status">🔥 {t("aifb.lab.streak", { n: streak })}</span> : null}
      </div>
      <div key={round.id} className="aifb-game__card aifb-lab__card">
        <p className="aifb-game__prompt"><Emoji value={round.emoji} className="aifb-game__emoji--big" />{round.scenario}</p>
        <p className="aifb-lab__goal"><strong>{t("aifb.lab.goal")}</strong> {round.goal}</p>
        <label className="aifb-ai__field">
          <span>{t("aifb.lab.yourPrompt")}</span>
          <textarea
            rows={4}
            maxLength={800}
            value={text}
            disabled={phase === "solved" || busy}
            placeholder={round.placeholder ?? t("aifb.lab.placeholder")}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        {error ? <p className="aifb-error" role="alert">{error}</p> : null}
        <div className="aifb-toolbar">
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={() => void submit()}>
            {busy ? t("aifb.ai.thinking") : phase === "retry" ? t("aifb.lab.askAgain") : t("aifb.lab.ask")}
          </button>
          {canSkip ? <button type="button" className="btn btn-ghost" onClick={skip}>{t("aifb.lab.skip")}</button> : null}
        </div>
        {answer ? (
          <div className="aifb-ai__answer" aria-live="polite">
            <p className="aifb-ai__label">{t(`aifb.ai.source.${answer.source}`)}</p>
            {answer.text.split("\n").map((line, index) => <p key={index}>{line}</p>)}
          </div>
        ) : null}
        {answer ? (
          <>
            <Checklist title={t("aifb.lab.checkPrompt")} results={promptResults} />
            <Checklist title={t("aifb.lab.checkAnswer")} results={answerResults} />
            {answer.source === "stored" && (round.answerChecks?.length ?? 0) > 0 ? <p className="aifb-muted">{t("aifb.lab.storedNote")}</p> : null}
          </>
        ) : null}
        {phase === "solved" ? (
          <>
            <p className="aifb-game__feedback" role="status" data-right="true">
              <strong>{t("aifb.lab.solved")}</strong> {"★".repeat(stars)}<span className="aifb-sr"> {t("aifb.game.stars", { n: stars })}</span>
            </p>
            <button type="button" className="btn btn-primary aifb-game__next" onClick={goNext}>
              {lab.position + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
