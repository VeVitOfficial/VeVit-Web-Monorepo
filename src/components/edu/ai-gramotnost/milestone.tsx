"use client";

// Boss kvízy kapitol a závěrečný test (port renderMilestone z components.js
// + mountMilestoneQuiz z lesson-runtime.mjs). Vyhodnocuje výhradně server.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QuestionBody, QuestionFeedback } from "./question";
import { useAiGram } from "./shell";
import type { Dict, EvalResult, MilestoneConfig, QuizQuestion } from "./types";

const REFLECTION_PROMPTS = [
  "Co jsem si myslel(a) o AI před kurzem a co si myslím teď?",
  "Jedna věc, kterou jsem si prakticky ověřil(a).",
  "Moje pravidlo pro kontrolu AI výstupů.",
];

function adaptiveFor(question: QuizQuestion, pool: QuizQuestion[], used: Set<string>): QuizQuestion | null {
  const tag = (question.tags || []).find((value) => String(value).startsWith("chapter-"));
  return pool.find((candidate) => !used.has(candidate.id) && (!tag || (candidate.tags || []).includes(tag)))
    || pool.find((candidate) => !used.has(candidate.id)) || null;
}

interface Entry { question: QuizQuestion; adaptive: boolean }

function MilestoneQuestion({ entry, number, config, onChecked }: {
  entry: Entry;
  number: number;
  config: MilestoneConfig;
  onChecked: (question: QuizQuestion, answer: Dict, result: EvalResult) => void;
}) {
  const { api } = useAiGram();
  const { question, adaptive } = entry;
  const [answer, setAnswer] = useState<Dict>({});
  const [result, setResult] = useState<{ evaluation: EvalResult; why?: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rubricShown, setRubricShown] = useState(false);
  async function check() {
    setBusy(true);
    setError("");
    try {
      const checked = await api.checkMilestone(config.milestone, question.id, answer, config.attempt || 1) as { result: EvalResult; why?: string };
      setResult({ evaluation: checked.result, why: checked.why });
      if (checked.result?.valid === false) setRubricShown(true);
      onChecked(question, answer, checked.result);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Odpověď se nepodařilo ověřit.");
      setBusy(false);
    }
  }
  const feedbackId = `milestone-feedback-${question.id}`;
  return (
    <section className={`quiz-question card${adaptive ? " quiz-question--adaptive" : ""}`}>
      <h3>{adaptive ? "Doplňující otázka po chybě" : `Otázka ${number}`}</h3>
      <div aria-describedby={feedbackId}>
        <QuestionBody question={question} onChange={setAnswer} revealRubric={rubricShown} />
      </div>
      <button type="button" className="btn btn-secondary" disabled={busy} onClick={check}>Uložit odpověď</button>
      <div id={feedbackId}>
        {error || (result ? <QuestionFeedback question={{ ...question, why: result.why || question.why }} result={result.evaluation} difficulty="pro" /> : null)}
      </div>
    </section>
  );
}

function MilestoneQuiz({ config }: { config: MilestoneConfig }) {
  const { api, path } = useAiGram();
  const isFinal = config.milestone === "final-6";
  const [entries, setEntries] = useState<Entry[]>(() => (config.questions || []).map((question) => ({ question, adaptive: false })));
  const [answers, setAnswers] = useState<Record<string, Dict>>({});
  const [mistakes, setMistakes] = useState(0);
  const used = useRef(new Set((config.questions || []).map((question) => question.id)));
  const adaptiveAdded = useRef(0);
  const [reflection, setReflection] = useState(() => REFLECTION_PROMPTS.map(() => ({ text: "", score: null as number | null })));
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<{ text: string; compare?: string; certificate?: boolean; retry?: boolean } | null>(null);
  const [failedSave, setFailedSave] = useState(false);

  function onChecked(question: QuizQuestion, answer: Dict, evaluation: EvalResult) {
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    if (evaluation.correct !== false) return;
    setMistakes((m) => m + 1);
    if (config.adaptive && adaptiveAdded.current < 5) {
      const extra = adaptiveFor(question, config.adaptive_pool || [], used.current);
      if (extra) {
        adaptiveAdded.current += 1;
        used.current.add(extra.id);
        setEntries((current) => [...current, { question: extra, adaptive: true }]);
      }
    }
  }

  const completed = entries.filter((entry) => answers[entry.question.id] !== undefined).length;
  const lives = Number(config.lives || 0);
  const reflectionIncomplete = isFinal && reflection.some((value) => value.text.trim().length < 10 || !Number.isInteger(value.score) || (value.score as number) < 0 || (value.score as number) > 5);
  const canSubmit = completed === entries.length && !reflectionIncomplete && !submitting && !outcome;

  async function submit() {
    setSubmitting(true);
    setFailedSave(false);
    try {
      const result = await api.milestone(config.milestone, { ...answers }, config.attempt || 1, reflection) as { passed?: boolean; score_pct?: number };
      const next: NonNullable<typeof outcome> = {
        text: result.passed
          ? `Splněno: ${result.score_pct} %. Odznak byl ověřen serverem.`
          : `Nesplněno: ${result.score_pct} %. Zopakuj slabá témata a zkus to znovu.`,
      };
      if (isFinal) {
        try {
          const entry = await api.selfAssessment() as { estimate: number | null };
          next.compare = entry.estimate === null
            ? `Výsledek: ${result.score_pct} %. Vstupní odhad nebyl uložen.`
            : `Na začátku sis tipnul(a) ${entry.estimate} z 8; závěrečný výsledek je ${result.score_pct} %.`;
        } catch {
          // Výsledek zůstává zobrazen.
        }
        next.certificate = Boolean(result.passed);
      }
      next.retry = !result.passed && config.milestone.startsWith("boss-");
      setOutcome(next);
    } catch {
      setFailedSave(true);
    } finally {
      setSubmitting(false);
    }
  }

  const numbers = entries.map((_, index) => entries.slice(0, index + 1).filter((entry) => !entry.adaptive).length);
  return (
    <>
      <p className="quiz-milestone-status" aria-live="polite">
        {`Dokončeno ${completed}/${entries.length}${lives > 0 ? ` · životy ${Math.max(0, lives - mistakes)}/${lives}` : ""}`}
      </p>
      <div>
        {entries.map((entry, index) => (
          <MilestoneQuestion key={entry.question.id} entry={entry} number={numbers[index]} config={config} onChecked={onChecked} />
        ))}
      </div>
      {isFinal ? (
        <section className="card quiz-final-reflection">
          <h2>Závěrečná reflexe</h2>
          {REFLECTION_PROMPTS.map((prompt, index) => (
            <fieldset key={index}>
              <legend>{prompt}</legend>
              <textarea
                rows={4}
                aria-label={prompt}
                value={reflection[index].text}
                onChange={(e) => setReflection((r) => r.map((v, i) => (i === index ? { ...v, text: e.target.value } : v)))}
              />
              <label>
                {"Jak konkrétní a ověřitelná je odpověď? "}
                <select
                  aria-label={`${prompt}: sebehodnocení 0 až 5`}
                  value={reflection[index].score === null ? "" : String(reflection[index].score)}
                  onChange={(e) => setReflection((r) => r.map((v, i) => (i === index ? { ...v, score: e.target.value === "" ? null : Number(e.target.value) } : v)))}
                >
                  <option value="">Vyber 0–5</option>
                  {[0, 1, 2, 3, 4, 5].map((value) => <option key={value} value={String(value)}>{value}</option>)}
                </select>
              </label>
            </fieldset>
          ))}
        </section>
      ) : null}
      <button type="button" className="btn btn-primary" disabled={!canSubmit} onClick={submit}>Vyhodnotit milník</button>
      <div role="status">
        {submitting ? "Vyhodnocuji…" : null}
        {failedSave ? "Výsledek se nyní nepodařilo uložit. Odpovědi zůstávají na stránce." : null}
        {outcome ? (
          <>
            {outcome.text}
            {outcome.compare ? <p>{outcome.compare}</p> : null}
            {outcome.certificate ? <a className="btn btn-secondary" href="/edu/ai-gramotnost/certificate.php">Otevřít certifikát</a> : null}
            {outcome.retry ? (
              <a className="btn btn-secondary" href={path(`milnik/${encodeURIComponent(config.milestone)}?pokus=${Number(config.attempt || 1) + 1}`)}>
                Zopakovat s jinou sadou
              </a>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}

export function AiGramMilestone({ milestone, attempt }: { milestone: string; attempt: number }) {
  const { api, authenticated, path } = useAiGram();
  const [config, setConfig] = useState<MilestoneConfig | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!authenticated) return;
    api.milestoneConfig(milestone, attempt)
      .then(setConfig)
      .catch((e: unknown) => setError(e instanceof Error && e.message ? e.message : "Milník nelze načíst."));
  }, [api, authenticated, milestone, attempt]);

  if (!authenticated) {
    const returnTo = `/edu/ai-gramotnost/milnik/${encodeURIComponent(milestone)}`;
    return (
      <section className="card">
        <h1>Milník kurzu</h1>
        <p>Lekce zůstávají čitelné bez přihlášení. Pro boss kvíz, finální test, XP a odznak se přihlaste.</p>
        <a className="btn btn-primary" href={`/account/login?return_to=${encodeURIComponent(returnTo)}`}>Přihlásit se</a>
      </section>
    );
  }
  if (error) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: "3rem auto", textAlign: "center" }}>
        <p style={{ color: "var(--error)" }}>⚠️ {error}</p>
        <p style={{ marginTop: ".75rem" }}><Link href={path("kurz")}>Zpět na kurz</Link></p>
      </div>
    );
  }
  if (!config) return <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>Načítám milník…</p>;
  const isFinal = milestone === "final-6";
  return (
    <>
      <section className="hero">
        <h1>{isFinal ? "Závěrečný test" : "Boss kvíz"}</h1>
        <p>{isFinal
          ? "25 základních otázek napříč kurzem; po chybě dostaneš doplňující otázku ze stejného tématu."
          : "Deset otázek vybraných deterministicky pro tvůj účet. Máš tři životy."}</p>
      </section>
      <div id="quiz-milestone-host">
        <MilestoneQuiz key={`${milestone}-${attempt}`} config={config} />
      </div>
    </>
  );
}
