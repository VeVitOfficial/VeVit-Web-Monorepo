"use client";

// Lekce AI gramotnosti (port renderLesson z components.js + mountLessonRhythm,
// mountQuizQuestions, mountDifficultyControl z lesson-runtime.mjs).

import Link from "next/link";
import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { evaluateQuestion } from "./evaluate";
import { AiGramIcon } from "./icons";
import { completeLesson, useProgress } from "./progress";
import { QuestionBody, QuestionFeedback } from "./question";
import { enqueueAttempt, newAttemptId } from "./quiz-api";
import { useAiGram } from "./shell";
import type { CourseLesson, Dict, Difficulty, EvalResult, QuizLesson, QuizQuestion } from "./types";

const DIFFICULTY_KEY = "vevit-edu-quiz-difficulty";
const difficultyListeners = new Set<() => void>();

function readDifficulty(): Difficulty {
  try {
    return window.localStorage.getItem(DIFFICULTY_KEY) === "pro" ? "pro" : "junior";
  } catch {
    return "junior";
  }
}

function storeDifficulty(value: Difficulty) {
  try {
    window.localStorage.setItem(DIFFICULTY_KEY, value);
  } catch {
    // bez úložiště platí volba jen do obnovení stránky
  }
  difficultyListeners.forEach((listener) => listener());
}

function useDifficulty(): Difficulty {
  return useSyncExternalStore(
    (listener) => {
      difficultyListeners.add(listener);
      return () => difficultyListeners.delete(listener);
    },
    readDifficulty,
    () => "junior",
  );
}

// ── jednoduchý markdown teorie (appendPlanMarkdown) ──────────────────────
function plainMarkdown(text: string): string {
  return String(text || "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function PlanMarkdown({ markdown }: { markdown: string }) {
  const nodes: ReactNode[] = [];
  let list: { type: "ol" | "ul"; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const { type, items } = list;
    const children = items.map((item, index) => <li key={index}>{item}</li>);
    nodes.push(type === "ol" ? <ol key={nodes.length}>{children}</ol> : <ul key={nodes.length}>{children}</ul>);
    list = null;
  };
  for (const sourceLine of String(markdown || "").split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line) { flush(); continue; }
    const heading = line.match(/^###\s+(.+)$/);
    if (heading) { flush(); nodes.push(<h3 key={nodes.length}>{plainMarkdown(heading[1])}</h3>); continue; }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (ordered || unordered) {
      const type = ordered ? "ol" : "ul";
      if (list && list.type !== type) flush();
      if (!list) list = { type, items: [] };
      list.items.push(plainMarkdown((ordered || unordered)![1]));
      continue;
    }
    flush();
    nodes.push(line.startsWith(">")
      ? <blockquote key={nodes.length}>{plainMarkdown(line.replace(/^>\s*/, ""))}</blockquote>
      : <p key={nodes.length}>{plainMarkdown(line)}</p>);
  }
  flush();
  return <>{nodes}</>;
}

function RhythmSection({ id, title, description, children }: { id: string; title: string; description: string; children?: ReactNode }) {
  return (
    <section id={id} className="quiz-rhythm-section card">
      <h2>{title}</h2>
      <p className="quiz-rhythm-section__description">{description}</p>
      {children}
    </section>
  );
}

// ── jedna kontrolní otázka ───────────────────────────────────────────────
function LessonQuestion({ lesson, question, index, difficulty }: { lesson: QuizLesson; question: QuizQuestion; index: number; difficulty: Difficulty }) {
  const { api, authenticated } = useAiGram();
  const [answer, setAnswer] = useState<Dict>({});
  const [result, setResult] = useState<EvalResult | null>(null);
  const [queued, setQueued] = useState(false);
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState<{ streak?: string; distribution?: string; prediction?: boolean; review?: boolean }>({});
  const [reviewState, setReviewState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  const [rubricShown, setRubricShown] = useState(false);

  async function check() {
    const local = evaluateQuestion(answer, question);
    setResult(local);
    if (!local.valid) setRubricShown(true);
    setQueued(false);
    setExtra({});
    if (!local.valid || !authenticated) return;
    const attempt = { course: "ai-gramotnost", lesson_slug: lesson.slug, question_id: question.id, client_attempt_uuid: newAttemptId(), answer, difficulty };
    setBusy(true);
    try {
      const saved = await api.evaluate(attempt) as { result?: Partial<EvalResult>; state?: { streak?: number; multiplier?: number } };
      setResult({ ...local, ...saved.result });
      const next: typeof extra = {
        streak: `🔥 Série v lekci: ${saved.state?.streak || 0} · ${Number(saved.state?.multiplier || 1) >= 1.25 ? "×1,25 aktivní" : "×1"}`,
        review: question.trap === true && saved.result?.correct === false,
      };
      if (question.type === "poll") {
        const poll = await api.poll(question.id) as { distribution?: { option_index: number; response_count: number }[] };
        next.distribution = `Odpovědi ostatních: ${(poll.distribution || []).map((item) => `${item.option_index}: ${item.response_count}`).join(" · ") || "zatím žádné"}`;
      }
      if (question.id === "5-5-q3" && typeof answer.text === "string") {
        await api.prediction(answer.text);
        next.prediction = true;
      }
      setExtra(next);
    } catch {
      enqueueAttempt(attempt);
      setQueued(true);
    } finally {
      setBusy(false);
    }
  }

  async function scheduleReview() {
    setReviewState("busy");
    try {
      await api.scheduleReview([question.id]);
      setReviewState("done");
    } catch {
      setReviewState("failed");
    }
  }

  const feedbackId = `quiz-feedback-${question.id}`;
  return (
    <section className="quiz-question card">
      <h3>{`Otázka ${index + 1}`}</h3>
      <div aria-describedby={feedbackId}>
        <QuestionBody question={question} onChange={setAnswer} revealRubric={rubricShown} />
      </div>
      <div className="quiz-question__actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={check}>Zkontrolovat</button>
      </div>
      <div id={feedbackId}>
        {queued ? "Odpověď je bezpečně ve frontě a po obnovení připojení se odešle právě jednou." : result ? (
          <QuestionFeedback question={question} result={result} difficulty={difficulty}>
            {extra.streak ? <p className="quiz-streak-live">{extra.streak}</p> : null}
            {extra.review ? (
              <button type="button" className="btn btn-secondary" disabled={reviewState === "busy" || reviewState === "done"} onClick={scheduleReview}>
                {reviewState === "done" ? "Přidáno do opakování" : reviewState === "failed" ? "Přidání se nezdařilo" : "Chci to zkusit znovu za pár lekcí"}
              </button>
            ) : null}
            {extra.distribution ? <p className="quiz-poll-distribution">{extra.distribution}</p> : null}
            {extra.prediction ? <p>Předpověď je uložená na 12 měsíců. E-mailový worker je samostatný provozní krok.</p> : null}
          </QuestionFeedback>
        ) : null}
      </div>
    </section>
  );
}

// ── rozcvička ────────────────────────────────────────────────────────────
function SaveButton({ idle, disabled, onSave, className = "btn btn-secondary" }: { idle: string; disabled?: boolean; onSave: () => Promise<string>; className?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  return (
    <button
      type="button"
      className={className}
      disabled={disabled || state !== "idle"}
      onClick={async () => {
        setState("busy");
        try {
          setMessage(await onSave());
          setState("done");
        } catch (error) {
          setMessage(error instanceof Error && error.message ? error.message : "Uložení se nezdařilo");
          setState("idle");
        }
      }}
    >
      {message ?? idle}
    </button>
  );
}

function WarmupQuestion({ question, difficulty, onValid }: { question: QuizQuestion; difficulty: Difficulty; onValid: (answer: Dict) => void }) {
  const [answer, setAnswer] = useState<Dict>({});
  const [result, setResult] = useState<EvalResult | null>(null);
  const [rubricShown, setRubricShown] = useState(false);
  return (
    <section className="quiz-question">
      <div><QuestionBody question={question} onChange={setAnswer} revealRubric={rubricShown} /></div>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={result?.valid === true}
        onClick={() => {
          const evaluated = evaluateQuestion(answer, question);
          setResult(evaluated);
          if (evaluated.valid) onValid(answer);
          else setRubricShown(true);
        }}
      >
        Zkontrolovat rozcvičku
      </button>
      <div>{result ? <QuestionFeedback question={question} result={result} difficulty={difficulty} /> : null}</div>
    </section>
  );
}

function Warmup({ lesson, difficulty }: { lesson: QuizLesson; difficulty: Difficulty }) {
  const { api, authenticated } = useAiGram();
  const [estimate, setEstimate] = useState(4);
  const [prepared, setPrepared] = useState<{ questions: QuizQuestion[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Dict>>({});
  const isFirst = lesson.slug === "1-1-co-je-ai";

  useEffect(() => {
    if (isFirst || !authenticated) return;
    api.warmup(lesson.slug)
      .then((data) => setPrepared({ questions: Array.isArray((data as Dict).questions) ? ((data as Dict).questions as QuizQuestion[]) : [] }))
      .catch(() => setFailed(true));
  }, [api, authenticated, isFirst, lesson.slug]);

  if (isFirst) {
    return (
      <>
        <p>Na kolik z 8 otázek o AI podle sebe teď odpovíš správně?</p>
        <input type="range" min={0} max={8} value={estimate} aria-label="Vstupní odhad z osmi otázek" onChange={(e) => setEstimate(Number(e.target.value))} />
        <output>{`${estimate} z 8`}</output>
        <SaveButton
          idle={authenticated ? "Uložit vstupní odhad" : "Odhad se uloží po přihlášení"}
          disabled={!authenticated}
          onSave={async () => {
            await api.saveSelfAssessment(estimate);
            return "Vstupní odhad uložen";
          }}
        />
      </>
    );
  }
  if (!authenticated) return <p>Po přihlášení se rozcvička sestaví z předchozích chyb, pastí a termínů opakování.</p>;
  if (failed) return <p>Rozcvička je dočasně nedostupná; pokračuj teorií.</p>;
  if (!prepared) return null;
  const questions = prepared.questions;
  return (
    <>
      {questions.map((question) => (
        <WarmupQuestion key={question.id} question={question} difficulty={difficulty} onValid={(value) => setAnswers((a) => ({ ...a, [question.id]: value }))} />
      ))}
      {questions.length >= 2 ? (
        <SaveButton
          className="btn btn-primary"
          idle="Dokončit rozcvičku"
          onSave={async () => {
            if (Object.keys(answers).length !== questions.length) throw new Error("Nejdřív odpověz na všechny otázky");
            try {
              const saved = await api.saveWarmup({ lesson_slug: lesson.slug, client_attempt_uuid: newAttemptId(), answers }) as { score_pct?: number; xp_awarded?: number };
              return `Rozcvička: ${saved.score_pct} % · +${saved.xp_awarded} XP`;
            } catch {
              throw new Error("Rozcvičku se nepodařilo uložit");
            }
          }}
        />
      ) : null}
    </>
  );
}

// ── mikro-úkol, zapamatuj si, kalibrace ──────────────────────────────────
function Microtask({ lesson }: { lesson: QuizLesson }) {
  const { api, authenticated } = useAiGram();
  const micro = lesson.microtask || {};
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <p>{micro.md || "V této lekci není mikro-úkol."}</p>
      {micro.proof === "text" ? (
        <>
          <textarea rows={4} placeholder="Napiš krátký důkaz nebo výsledek." aria-label="Důkaz splnění mikro-úkolu" value={proof} onChange={(e) => setProof(e.target.value)} />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!authenticated || busy || saved}
            onClick={async () => {
              const text = proof.trim();
              if (!text) { setStatus("Doplň krátký důkaz splnění."); return; }
              const entry = { _endpoint: "microtask", lesson_slug: lesson.slug, client_attempt_uuid: newAttemptId(), text };
              setBusy(true);
              try {
                const result = await api.microtask(entry) as { xp_awarded?: number };
                setStatus(`Mikro-úkol uložen · +${result.xp_awarded || 0} XP`);
                setSaved(true);
              } catch {
                enqueueAttempt(entry);
                setStatus("Mikro-úkol je bezpečně ve frontě a odešle se po obnovení připojení.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {authenticated ? "Uložit mikro-úkol" : "Přihlásit se pro uložení XP"}
          </button>
          <p role="status">{status}</p>
        </>
      ) : null}
    </>
  );
}

function Remember({ lesson }: { lesson: QuizLesson }) {
  const { api, authenticated } = useAiGram();
  return (
    <>
      <ul>{(lesson.remember || []).slice(0, 3).map((item, index) => <li key={index}>{item}</li>)}</ul>
      <SaveButton
        idle={authenticated ? "Přidat do opakování" : "Přihlásit se pro opakování"}
        disabled={!authenticated}
        onSave={async () => {
          try {
            await api.scheduleReview((lesson.questionBank || []).slice(0, 5).map((question) => question.id));
          } catch {
            throw new Error("Přidání se nezdařilo");
          }
          return "Přidáno do opakování";
        }}
      />
    </>
  );
}

interface CalibrationData {
  round_count?: number;
  mean_absolute_error_pct?: number;
  calibrated?: boolean;
  buckets?: { stake: number; count: number; confidence_pct: number; accuracy_pct: number }[];
}

function Calibration() {
  const { api } = useAiGram();
  const [data, setData] = useState<CalibrationData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api.calibration().then((value) => setData(value as CalibrationData)).catch(() => setFailed(true));
  }, [api]);
  let body: ReactNode = null;
  if (failed) body = <p>Kalibrační graf je dočasně nedostupný; lekce zůstává použitelná.</p>;
  else if (data && !data.round_count) body = <p>Graf se zobrazí po dokončení šesti sázek v této lekci.</p>;
  else if (data) {
    body = (
      <>
        <svg className="quiz-calibration-chart" viewBox="0 0 480 260" role="img"
          aria-label={`Kalibrační graf: osa X vsazená jistota, osa Y reálná úspěšnost. Odchylka ${data.mean_absolute_error_pct} procentního bodu.`}>
          <line x1="55" y1="20" x2="55" y2="220" className="quiz-calibration-axis" />
          <line x1="55" y1="220" x2="455" y2="220" className="quiz-calibration-axis" />
          <text x="8" y="22">100 %</text>
          <text x="24" y="224">0 %</text>
          <text x="190" y="252">vsazená jistota (XP)</text>
          {(data.buckets || []).map((bucket, index) => {
            const x = 120 + index * 130;
            const expectedY = 220 - bucket.confidence_pct * 2;
            const actualY = 220 - bucket.accuracy_pct * 2;
            return (
              <Fragment key={index}>
                <line x1={x} y1={220} x2={x} y2={actualY} className="quiz-calibration-actual" />
                <circle cx={x} cy={expectedY} r={7} className="quiz-calibration-expected" />
                <circle cx={x} cy={actualY} r={7} className="quiz-calibration-point" />
                <text x={x - 18} y={240}>{`${bucket.stake} XP`}</text>
                <text x={x - 30} y={Math.max(15, actualY - 12)}>{`${bucket.accuracy_pct} % (${bucket.count}×)`}</text>
              </Fragment>
            );
          })}
        </svg>
        <p>{`Průměrná kalibrační odchylka: ${data.mean_absolute_error_pct} procentního bodu.${data.calibrated ? " Odznak Kalibrovaný je splněn." : ""}`}</p>
      </>
    );
  }
  return <RhythmSection id="kalibrace" title="Kalibrační graf" description="Porovnání tvé deklarované jistoty se skutečnou úspěšností.">{body}</RhythmSection>;
}

// ── stránka lekce ────────────────────────────────────────────────────────
const TOC: [string, string][] = [["rozcvicka", "Rozcvička"], ["teorie", "Teorie"], ["otazky", "Kontrolní otázky"], ["mikro-ukol", "Mikro-úkol"], ["zapamatuj", "Zapamatuj si"]];

export function AiGramLesson({ lesson, courseLesson }: { lesson: QuizLesson; courseLesson: CourseLesson | null }) {
  const { api, authenticated, course, path } = useAiGram();
  const progress = useProgress();
  const difficulty = useDifficulty();
  const [skipped, setSkipped] = useState(false);
  const xp = courseLesson?.xp_reward || 25;
  const completed = courseLesson ? progress.completedLessons.includes(Number(courseLesson.id)) : false;
  const [justCompleted, setJustCompleted] = useState(false);

  // Přihlášený uživatel má úroveň uloženou v profilu; lokální volba je fallback.
  useEffect(() => {
    if (!authenticated) return;
    api.profile()
      .then((profile) => storeDifficulty((profile as Dict).difficulty === "pro" ? "pro" : "junior"))
      .catch(() => { /* Bez sítě zůstane lokální fallback. */ });
  }, [api, authenticated]);

  async function changeDifficulty(next: Difficulty) {
    storeDifficulty(next);
    if (authenticated) {
      try {
        await api.setDifficulty(next);
      } catch {
        // Lokální preference zůstává použitelná.
      }
    }
  }

  const questions = (lesson.questionBank || []).filter((question) => question.difficulty === "both" || question.difficulty === difficulty);
  const toc = lesson.slug === "6-1-kriticke-mysleni" && authenticated ? [...TOC, ["kalibrace", "Kalibrační graf"] as [string, string]] : TOC;

  return (
    <div className="lesson-layout">
      <div className="lesson-content card">
        <Link href={path("kurz")} style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", color: "var(--text-secondary)", fontSize: ".85rem", marginBottom: "1rem" }}>
          <AiGramIcon name="arrow" flip /> Zpět na kurz
        </Link>
        <h1>{lesson.title}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".85rem", marginBottom: "1.5rem" }}>{courseLesson?.duration || 15} min • +{xp} XP</p>
        <div id="quiz-difficulty-control">
          <label className="quiz-difficulty">
            {"Výklad: "}
            <select aria-label="Úroveň výkladu" value={difficulty} onChange={(e) => changeDifficulty(e.target.value === "pro" ? "pro" : "junior")}>
              <option value="junior">Junior</option>
              <option value="pro">Pro</option>
            </select>
          </label>
        </div>
        <div id="quiz-rhythm" key={difficulty}>
          <RhythmSection id="rozcvicka" title="Rozcvička" description="Krátké zopakování z předchozích lekcí. Po zobrazení ji můžeš přeskočit.">
            <Warmup lesson={lesson} difficulty={difficulty} />
            <button type="button" className="btn btn-secondary" disabled={skipped} onClick={() => setSkipped(true)}>
              {skipped ? "Rozcvička přeskočena" : "Rozcvičku přeskočit"}
            </button>
          </RhythmSection>
          <RhythmSection id="teorie" title="Teorie" description="Nejdřív si vytvoř pevný základ.">
            {(lesson.theory?.blocks || []).map((block, index) => (
              <section key={index}>
                {block.title ? <h3>{block.title}</h3> : null}
                <PlanMarkdown markdown={difficulty === "pro" ? (block.pro || block.md || block.junior || "") : (block.junior || block.md || block.pro || "")} />
              </section>
            ))}
          </RhythmSection>
          <RhythmSection id="otazky" title="Kontrolní otázky" description="Odpovídej postupně, feedback dostaneš ihned.">
            <div>
              {questions.map((question, index) => (
                <LessonQuestion key={question.id} lesson={lesson} question={question} index={index} difficulty={difficulty} />
              ))}
            </div>
          </RhythmSection>
          <RhythmSection id="mikro-ukol" title="Mikro-úkol" description="Dobrovolný úkol přidá XP, ale neblokuje dokončení lekce.">
            <Microtask lesson={lesson} />
          </RhythmSection>
          <RhythmSection id="zapamatuj" title="Zapamatuj si" description="Tři myšlenky, ke kterým se můžeš vrátit.">
            <Remember lesson={lesson} />
          </RhythmSection>
          {lesson.slug === "6-1-kriticke-mysleni" && authenticated ? <Calibration /> : null}
        </div>
        <div id="complete-wrap" style={{ marginTop: "1.5rem" }}>
          {completed || justCompleted ? (
            <div className="ex-feedback ok" style={{ textAlign: "center" }}>{justCompleted ? "✓ Lekce dokončena!" : "✓ Lekce již dokončena"}</div>
          ) : courseLesson ? (
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={() => {
                completeLesson(courseLesson.id, xp, course);
                setJustCompleted(true);
              }}
            >
              <AiGramIcon name="check" /> {`Dokončit lekci (+${xp} XP)`}
            </button>
          ) : null}
        </div>
      </div>
      <aside className="lesson-sidebar card">
        <strong style={{ display: "block", marginBottom: ".75rem" }}>Obsah lekce</strong>
        <nav aria-label="Obsah lekce">
          {toc.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              style={{ display: "block", padding: ".35rem 0 .35rem .6rem", color: "var(--text-secondary)", fontSize: ".85rem", borderLeft: "2px solid transparent" }}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>
    </div>
  );
}
