"use client";

// Cvičení – port edu/js/components/exercise.js. Obsahuje OpenCard (textová
// odpověď) a CodeCard (kódové cvičení s volitelným během v sandboxu) + seznam
// cvičení (ExerciseList). Třídy jsou identické s legacy, JSX nahrazuje string
// template + escapeHtml (text je automaticky escapován).

import { useState } from "react";
import { useEduLang } from "../i18n";
import { XPBadge } from "../ui";
import { Icon } from "./icon";

const LANG_LABELS: Record<string, string> = {
  javascript: "JavaScript", python: "Python", java: "Java", cpp: "C++", csharp: "C#",
  go: "Go", rust: "Rust", kotlin: "Kotlin", swift: "Swift", ruby: "Ruby", php: "PHP",
  typescript: "TypeScript", html: "HTML/CSS", sql: "SQL", bash: "Bash",
  dockerfile: "Dockerfile", git: "Git", "html-css": "HTML/CSS", "terminal-bash": "Bash",
};
function langLabel(l?: string): string {
  return LANG_LABELS[(l || "").toLowerCase()] || l || "";
}

function starterCode(ex: Exercise): string {
  if (ex.modelSolution) return `// ${ex.title}\n// Napiš své řešení níže...\n\n`;
  return `// ${ex.title}\n// Zde napiš svůj kód...\n`;
}

export interface Exercise {
  id: string;
  type?: string;
  title: string;
  task?: string;
  description?: string;
  hint?: string;
  keywords?: string[];
  modelSolution?: string;
  xp?: number;
  testCases?: { input: string; expectedOutput: string; description: string }[];
  [key: string]: unknown;
}

interface SandboxRunnerGlobal {
  run?: (code: string) => Promise<{ output: string[]; error?: string }>;
}

interface ExerciseListProps {
  exercises: Exercise[];
  completedIds?: string[];
  courseLanguage?: string;
  onComplete?: (id: string) => void;
}

// ─── Otevřené cvičení ───
export function OpenCard({
  exercise,
  index,
  completed,
  onComplete,
}: {
  exercise: Exercise;
  index: number;
  completed: boolean;
  onComplete?: () => void;
}) {
  const { t } = useEduLang();
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(completed);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const keywords = exercise.keywords || [];
  const matched = keywords.filter((kw) => answer.toLowerCase().includes(kw.toLowerCase()));
  const hasKeywords = keywords.length > 0;
  const isGoodMatch = hasKeywords && matched.length >= Math.ceil(keywords.length / 2);
  const done = completed || checked;
  const canCheck = answer.trim().length > 0;

  return (
    <div className="glass glow-border overflow-hidden rounded-xl border border-[var(--color-glass-border)]">
      <div className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-semibold">{index}</span>
            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">{exercise.title}</h4>
          </div>
          {done ? <Icon name="check-circle-2" className="h-4 w-4 text-emerald-500" /> : null}
        </div>
      </div>
      <div className="px-6 pb-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{exercise.task || ""}</p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-6">{exercise.description || ""}</p>
        </div>
        {!checked ? (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
              placeholder={t("exercise.typeAnswer")}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canCheck}
                onClick={() => {
                  setChecked(true);
                  onComplete?.();
                }}
                className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Icon name="check-circle-2" className="h-4 w-4" />
                {t("exercise.check")}
              </button>
              {exercise.hint ? (
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <Icon name="lightbulb" className="h-4 w-4" />
                  {showHint ? t("exercise.hideHint") : t("exercise.hint")}
                </button>
              ) : null}
            </div>
            {showHint && exercise.hint ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600 leading-6">
                <Icon name="lightbulb" className="inline h-4 w-4 mr-1 mb-0.5" />
                {exercise.hint}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-lg border p-3 text-sm leading-6 ${isGoodMatch || !hasKeywords ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-amber-500/20 bg-amber-500/5 text-amber-600"}`}>
              {isGoodMatch ? (
                <>
                  <Icon name="check-circle-2" className="inline h-4 w-4 mr-1 mb-0.5" />
                  {t("exercise.completed")}. {matched.length}/{keywords.length} {t("exercise.keywordsFound")}.
                </>
              ) : !hasKeywords ? (
                <>
                  <Icon name="check-circle-2" className="inline h-4 w-4 mr-1 mb-0.5" />
                  {t("exercise.completed")}. {t("exercise.showSolution")}.
                </>
              ) : (
                <>
                  {t("exercise.notCompleted")}. {matched.length}/{keywords.length} {t("exercise.keywordsFound")}.
                </>
              )}
            </div>
            {exercise.modelSolution ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSolution((v) => !v)}
                  className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <Icon name="eye" className="h-4 w-4" />
                  {showSolution ? t("exercise.hideSolution") : t("exercise.showSolution")}
                </button>
                {showSolution ? (
                  <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-4 text-sm text-[var(--color-text-secondary)] leading-6 whitespace-pre-wrap">
                    {exercise.modelSolution}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChecked(false);
                  setShowSolution(false);
                  setAnswer("");
                }}
                className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                <Icon name="rotate-ccw" className="h-4 w-4" />
                {t("quiz.retry")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kódové cvičení ───
function CodeCard({
  exercise,
  index,
  completed,
  onComplete,
  language,
}: {
  exercise: Exercise;
  index: number;
  completed: boolean;
  onComplete?: () => void;
  language: string;
}) {
  const { t } = useEduLang();
  const [code, setCode] = useState(() => starterCode(exercise));
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expandedTests, setExpandedTests] = useState(false);
  const isJS = ["javascript", "typescript"].includes((language || "").toLowerCase());

  function xpEarned() {
    return Math.max(0, (exercise.xp || 25) - hintPenalty);
  }

  async function run() {
    if (!isJS) return;
    setIsRunning(true);
    setOutput([]);
    try {
      const runner = (window as unknown as { VeVitSandboxRunner?: SandboxRunnerGlobal }).VeVitSandboxRunner;
      const r = runner?.run ? await runner.run(code) : { output: [] as string[], error: "Sandbox nedostupný" };
      setOutput(r.error ? [`[ERROR] ${r.error}`] : r.output);
    } catch (e) {
      setOutput([`[ERROR] ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setIsRunning(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignorujeme
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-semibold">{index}</span>
            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">{exercise.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {exercise.xp && exercise.xp > 0 ? <XPBadge xp={xpEarned()} size="sm" /> : null}
            {completed ? <Icon name="check-circle-2" className="h-4 w-4 text-emerald-500" /> : null}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{exercise.task || ""}</p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-6">{exercise.description || ""}</p>
        </div>

        {exercise.testCases && exercise.testCases.length > 0 ? (
          <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedTests((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-input-bg)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Icon name="terminal" className="h-4 w-4 text-[var(--color-text-muted)]" />
                Test cases ({exercise.testCases.length})
              </span>
              <Icon name={expandedTests ? "chevron-up" : "chevron-down"} className="h-4 w-4" />
            </button>
            {expandedTests ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-input-bg)]">
                      <th className="text-left px-4 py-2 text-[var(--color-text-muted)] font-medium">Vstup</th>
                      <th className="text-left px-4 py-2 text-[var(--color-text-muted)] font-medium">Očekávaný výstup</th>
                      <th className="text-left px-4 py-2 text-[var(--color-text-muted)] font-medium">Popis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.testCases.map((tc, i) => (
                      <tr key={i} className="border-b border-[var(--color-border-subtle)] last:border-0">
                        <td className="px-4 py-2 font-mono text-[var(--color-text-secondary)]">
                          <code className="text-[11px] bg-[var(--color-input-bg)] px-1.5 py-0.5 rounded">{tc.input}</code>
                        </td>
                        <td className="px-4 py-2 font-mono text-emerald-500">
                          <code className="text-[11px] bg-emerald-500/5 px-1.5 py-0.5 rounded">{tc.expectedOutput}</code>
                        </td>
                        <td className="px-4 py-2 text-[var(--color-text-muted)]">{tc.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}

        {isJS ? (
          <>
            <div className="rounded-lg overflow-hidden border border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border-b border-[#30363d]">
                <span className="text-[10px] uppercase tracking-wider text-[#8b949e] font-mono">{langLabel(language)}</span>
                <button
                  type="button"
                  onClick={copy}
                  className="p-1.5 rounded text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
                  title={t("lesson.copyCode")}
                >
                  <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full bg-[#0d1117] text-[#e6edf3] font-mono text-sm leading-6 p-4 resize-y focus:outline-none min-h-[180px]"
                style={{ tabSize: 2 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isRunning || code.trim().length === 0}
                onClick={run}
                className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Icon name="play" className="h-4 w-4" />
                {isRunning ? "Běží..." : "Spustit"}
              </button>
              {!completed ? (
                <button
                  type="button"
                  onClick={() => onComplete?.()}
                  className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                >
                  <Icon name="check-circle-2" className="h-4 w-4" />
                  {t("lesson.complete")}
                </button>
              ) : null}
              {exercise.hint ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!showHint) setHintPenalty((p) => p + 5);
                    setShowHint((v) => !v);
                  }}
                  className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-amber-500 transition-colors"
                >
                  <Icon name="lightbulb" className="h-4 w-4" />
                  {showHint ? t("exercise.hideHint") : t("exercise.hint")}
                  {showHint && hintPenalty > 0 ? <span className="text-amber-500 text-[10px]">(-{hintPenalty} XP)</span> : null}
                </button>
              ) : null}
            </div>
            {output.length > 0 || isRunning ? (
              <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-input-bg)] border-b border-[var(--color-border-subtle)]">
                  <Icon name="terminal" className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-muted)]">Konzole</span>
                </div>
                <div className="bg-[#0d1117] p-3 min-h-[60px] max-h-[200px] overflow-y-auto">
                  {isRunning && output.length === 0 ? <p className="text-xs text-[#8b949e] font-mono animate-pulse">Spouštění...</p> : null}
                  {output.map((line, i) => (
                    <pre key={i} className={`text-xs font-mono leading-5 ${line.startsWith("[ERROR]") ? "text-red-400" : line.startsWith("[WARN]") ? "text-amber-400" : "text-[#e6edf3]"}`}>
                      {line}
                    </pre>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-5 text-center">
            <Icon name="lock" className="h-6 w-6 text-[var(--color-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">Pro tento jazyk si kód zkopíruj do svého IDE.</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={copy}
                className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border border-[var(--color-border-subtle)] hover:bg-[var(--color-glass-highlight)] transition-colors"
              >
                <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
                {copied ? t("lesson.copied") : t("lesson.copyCode")}
              </button>
              {!completed ? (
                <button
                  type="button"
                  onClick={() => onComplete?.()}
                  className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  <Icon name="check-circle-2" className="h-4 w-4" />
                  {t("lesson.complete")}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {showHint && exercise.hint ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-4 flex gap-3">
            <Icon name="lightbulb" className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{exercise.hint}</p>
              <p className="text-[11px] text-amber-500 mt-1">Nápověda: -{hintPenalty} XP z celkové odměny</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ExerciseList({
  exercises,
  completedIds = [],
  courseLanguage = "javascript",
  onComplete,
}: ExerciseListProps) {
  const { t } = useEduLang();
  if (!exercises || exercises.length === 0) return null;
  const completedSet = new Set(completedIds);

  return (
    <div className="mt-8 space-y-6 max-w-3xl mx-auto px-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="dumbbell" className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t("lesson.exercises")}</h3>
        <span className="text-xs text-[var(--color-muted)]">
          {completedIds.length}/{exercises.length} {t("exercise.completed").toLowerCase()}
        </span>
      </div>
      {exercises.map((ex, i) => {
        const onCompleteOne = () => onComplete?.(ex.id);
        if (ex.type === "code") {
          return (
            <CodeCard
              key={ex.id}
              exercise={ex}
              index={i + 1}
              completed={completedSet.has(ex.id)}
              onComplete={onCompleteOne}
              language={courseLanguage}
            />
          );
        }
        return (
          <OpenCard
            key={ex.id}
            exercise={ex}
            index={i + 1}
            completed={completedSet.has(ex.id)}
            onComplete={onCompleteOne}
          />
        );
      })}
    </div>
  );
}