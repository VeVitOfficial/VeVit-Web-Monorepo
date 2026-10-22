"use client";

// AiSandbox: cvičení s modelem přes serverový endpoint /edu/api/aifb/complete.
// Pravidla: žáci 1. stupně sem nikdy nepíšou (komponenta se pro zs1 nepoužívá); na 2. stupni je
// výchozí režim učitele a samostatnou práci zapíná učitel potvrzením souhlasu a pověřence; na SŠ je
// samostatný režim. Zadání se ještě před odesláním kontroluje na osobní údaje (server kontroluje znovu).
// Rozhraní nikdy neukazuje značku modelu; při výpadku se zobrazí uložená ukázka.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { detectPersonalData } from "@/lib/edu/aifb/pii";
import { splitSentences } from "@/lib/edu/aifb/interactive-logic";
import type { AiSandboxConfig } from "@/lib/edu/aifb/pupil";

type Answer = { source: "live" | "stored"; text: string; plantedErrors?: string[] };

async function askAi(lessonId: string, prompt: string): Promise<{ ok: true; answer: Answer } | { ok: false; error: string; kind?: string }> {
  try {
    const response = await fetch("/edu/api/aifb/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, prompt }),
    });
    const data = (await response.json()) as { ok: boolean; source?: "live" | "stored"; text?: string; plantedErrors?: string[]; error?: string; kind?: string };
    if (data.ok && data.text && data.source) return { ok: true, answer: { source: data.source, text: data.text, plantedErrors: data.plantedErrors } };
    return { ok: false, error: data.error ?? "generic", kind: data.kind };
  } catch {
    return { ok: false, error: "generic" };
  }
}

function useCopy() {
  const { t } = useEduLang();
  const [done, setDone] = useState(false);
  return {
    done,
    copy: async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setDone(true);
      } catch {
        setDone(false);
      }
    },
    label: t("aifb.ai.copied"),
  };
}

function AnswerBox({ answer, title }: { answer: Answer; title: string }) {
  const { t } = useEduLang();
  return (
    <div className="aifb-ai__answer">
      <p className="aifb-ai__label">{title} · {t(`aifb.ai.source.${answer.source}`)}</p>
      {answer.text.split("\n").map((line, index) => <p key={index}>{line}</p>)}
    </div>
  );
}

type Row = { rewrite: string; original?: Answer; improved?: Answer; note: string };

function PromptRescue({ lessonId, vaguePrompts }: { lessonId: string; vaguePrompts: string[] }) {
  const { t } = useEduLang();
  const [rows, setRows] = useState<Row[]>(() => vaguePrompts.map(() => ({ rewrite: "", note: "" })));
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clip = useCopy();

  const update = (index: number, patch: Partial<Row>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  async function run(index: number, which: "original" | "improved") {
    const prompt = which === "original" ? vaguePrompts[index] : rows[index].rewrite.trim();
    setError(null);
    const kind = detectPersonalData(prompt);
    if (kind) {
      setError(t(`aifb.ai.error.personal_data.${kind}`));
      return;
    }
    setBusy(index);
    const result = await askAi(lessonId, prompt);
    setBusy(null);
    if (result.ok) update(index, which === "original" ? { original: result.answer } : { improved: result.answer });
    else setError(t(result.error === "personal_data" && result.kind ? `aifb.ai.error.personal_data.${result.kind}` : result.error === "rate_limited" ? "aifb.ai.error.rate_limited" : "aifb.ai.error.generic"));
  }

  const table = [t("aifb.ai.col.original"), t("aifb.ai.col.rewrite"), t("aifb.ai.col.note")].join("\t") + "\n" +
    rows.map((row, i) => [vaguePrompts[i], row.rewrite, row.note].map((cell) => cell.replace(/\s+/g, " ")).join("\t")).join("\n");

  return (
    <div className="aifb-ai">
      <p className="aifb-muted">{t("aifb.ai.rules")}</p>
      {error ? <p className="aifb-error" role="alert">{error}</p> : null}
      <ol className="aifb-ai__list">
        {vaguePrompts.map((vague, index) => {
          const row = rows[index];
          const ready = row.rewrite.trim().length >= 3 && busy === null;
          return (
            <li key={vague} className="aifb-ai__item">
              <p className="aifb-ai__vague"><strong>{t("aifb.ai.vague")}:</strong> „{vague}“</p>
              <label className="aifb-ai__field">
                <span>{t("aifb.ai.rewrite")}</span>
                <textarea rows={3} maxLength={800} value={row.rewrite} placeholder={t("aifb.ai.rewritePlaceholder")} onChange={(event) => update(index, { rewrite: event.target.value })} />
              </label>
              <div className="aifb-toolbar">
                <button type="button" className="btn btn-ghost" disabled={busy !== null} onClick={() => void run(index, "original")}>{t("aifb.ai.tryOriginal")}</button>
                <button type="button" className="btn btn-primary" disabled={!ready} onClick={() => void run(index, "improved")}>{t("aifb.ai.tryRewrite")}</button>
                {busy === index ? <span className="aifb-muted" role="status">{t("aifb.ai.thinking")}</span> : null}
              </div>
              {row.original ? <AnswerBox answer={row.original} title={t("aifb.ai.answerOriginal")} /> : null}
              {row.improved ? <AnswerBox answer={row.improved} title={t("aifb.ai.answerRewrite")} /> : null}
              <label className="aifb-ai__field">
                <span>{t("aifb.ai.note")}</span>
                <textarea rows={2} maxLength={400} value={row.note} onChange={(event) => update(index, { note: event.target.value })} />
              </label>
            </li>
          );
        })}
      </ol>
      <div className="aifb-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => void clip.copy(table)}>{t("aifb.ai.copyTable")}</button>
        {clip.done ? <span className="aifb-muted" role="status">{clip.label}</span> : null}
      </div>
    </div>
  );
}

function FactCheck({ lessonId, topicLabel }: { lessonId: string; topicLabel: string }) {
  const { t } = useEduLang();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marked, setMarked] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const clip = useCopy();

  async function load() {
    setBusy(true);
    setError(null);
    setSubmitted(false);
    setMarked({});
    const result = await askAi(lessonId, "");
    setBusy(false);
    if (result.ok) setAnswer(result.answer);
    else setError(t(result.error === "rate_limited" ? "aifb.ai.error.rate_limited" : "aifb.ai.error.generic"));
  }

  const sentences = answer ? splitSentences(answer.text) : [];
  const findings = Object.entries(marked).map(([index, how]) => `${sentences[Number(index)]}\n→ ${how}`).join("\n\n");

  return (
    <div className="aifb-ai">
      <p className="aifb-muted">{t("aifb.ai.fact.topic", { topic: topicLabel })}</p>
      {error ? <p className="aifb-error" role="alert">{error}</p> : null}
      {!answer ? (
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void load()}>{busy ? t("aifb.ai.thinking") : t("aifb.ai.fact.get")}</button>
      ) : (
        <>
          <p className="aifb-ai__label">{t(`aifb.ai.source.${answer.source}`)}</p>
          <ol className="aifb-ai__list">
            {sentences.map((sentence, index) => {
              const isMarked = marked[index] !== undefined;
              return (
                <li key={index} className="aifb-ai__item">
                  <p>{sentence}</p>
                  <label className="aifb-quiz__option">
                    <input
                      type="checkbox"
                      checked={isMarked}
                      disabled={submitted}
                      onChange={(event) => {
                        const next = { ...marked };
                        if (event.target.checked) next[index] = "";
                        else delete next[index];
                        setMarked(next);
                      }}
                    />
                    <span>{t("aifb.ai.fact.mark")}</span>
                  </label>
                  {isMarked ? (
                    <label className="aifb-ai__field">
                      <span>{t("aifb.ai.fact.how")}</span>
                      <textarea rows={2} maxLength={400} value={marked[index]} disabled={submitted} onChange={(event) => setMarked({ ...marked, [index]: event.target.value })} />
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {!submitted ? <button type="button" className="btn btn-primary" onClick={() => setSubmitted(true)}>{t("aifb.ai.fact.submit")}</button> : (
            <div className="aifb-ai__answer" role="status">
              <p className="aifb-ai__label">{t("aifb.ai.fact.summary")}</p>
              {findings === "" ? <p>{t("aifb.ai.fact.none")}</p> : findings.split("\n\n").map((block, index) => <p key={index} className="aifb-ai__finding">{block}</p>)}
              <div className="aifb-toolbar">
                <button type="button" className="btn btn-ghost" onClick={() => void clip.copy(findings)}>{t("aifb.ai.fact.copy")}</button>
                {clip.done ? <span className="aifb-muted">{clip.label}</span> : null}
              </div>
              {answer.plantedErrors ? (
                <details className="aifb-details" open>
                  <summary><h4>{t("aifb.ai.fact.key")}</h4></summary>
                  <ul className="aifb-list">{answer.plantedErrors.map((item) => <li key={item}>{item}</li>)}</ul>
                </details>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function AiSandbox({ lessonId, categoryId, config }: { lessonId: string; categoryId: string; config: AiSandboxConfig }) {
  const { t } = useEduLang();
  // SŠ: samostatný režim. 2. stupeň: režim učitele, dokud učitel nepotvrdí souhlas a pověřence (R5).
  const [individual, setIndividual] = useState(categoryId === "ss");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="aifb-ai-wrap">
      {individual ? (
        <p className="aifb-muted">{t("aifb.ai.individualMode")}</p>
      ) : (
        <div className="aifb-callout" role="note">
          <p className="aifb-callout__title">{t("aifb.ai.unlockTitle")}</p>
          <p>{t("aifb.ai.teacherMode")}</p>
          <label className="aifb-quiz__option">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>{t("aifb.ai.unlockCheck")}</span>
          </label>
          <button type="button" className="btn btn-ghost" disabled={!confirmed} onClick={() => setIndividual(true)}>{t("aifb.ai.unlockButton")}</button>
        </div>
      )}
      {config.mode === "prompt-rescue"
        ? <PromptRescue lessonId={lessonId} vaguePrompts={config.vaguePrompts} />
        : <FactCheck lessonId={lessonId} topicLabel={config.topicLabel} />}
    </div>
  );
}
