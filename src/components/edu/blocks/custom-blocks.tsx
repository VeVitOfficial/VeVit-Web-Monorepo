"use client";

// Vlastní bloky – port edu/js/components/custom-blocks.js. Renderuje statické
// bloky (heading/paragraph/list/code/callout/timeline) a interaktivní bloky
// (quiz/multiple/match/order/open) uživatelských lekcí + doložku (Attribution).
// Třídy identické s legacy; JSX nahrazuje string template + escapeHtml.
//
// Sanitizační rozhodnutí: vešcherý uživatelský text se renderuje přes JSX
// (automaticky escapováno) — stejně jako legacy volala escapeHtml() na každé
// vkládané textové pole. dangerouslySetInnerHTML se v této komponentě vůbec
// nepoužívá. Žádné oslabení sanitizace oproti legacy.

import { useMemo, useState } from "react";
import { Icon } from "./icon";
import { CodeBlock } from "./code-block";
import { OpenCard } from "./exercise";

export interface CustomBlock {
  type: string;
  level?: number;
  text?: string;
  items?: string[];
  ordered?: boolean;
  language?: string;
  code?: string;
  variant?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  correctIndices?: number[];
  explanation?: string;
  pairs?: { left: string; right: string }[];
  correctOrder?: number[];
  title?: string;
  task?: string;
  description?: string;
  hint?: string;
  keywords?: string[];
  modelSolution?: string;
  year?: string;
  [key: string]: unknown;
}

export interface CustomLessonLike {
  title: string;
  blocks?: CustomBlock[];
  author?: string;
  sources?: string[];
  category?: string;
  createdAt?: string;
  description?: string;
  [key: string]: unknown;
}

const headingClasses: Record<number, string> = {
  1: "text-3xl md:text-4xl font-bold mb-6 mt-2 tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-[var(--color-hero-gradient-to)] bg-clip-text text-transparent",
  2: "text-xl md:text-2xl font-semibold mb-4 mt-10 tracking-tight text-[var(--color-text-primary)]",
  3: "text-lg font-semibold mb-3 mt-6 text-[var(--color-text-primary)]",
};
const calloutIcons: Record<string, string> = { info: "info", warning: "alert-triangle", tip: "lightbulb" };

// ─── Statické bloky ───
function StaticBlock({ block }: { block: CustomBlock }) {
  switch (block.type) {
    case "heading": {
      const level = block.level ?? 3;
      const cls = headingClasses[level] || headingClasses[3];
      const Tag = (`h${Math.min(Math.max(level, 1), 6)}`) as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag className={cls}>{block.text || ""}</Tag>;
    }
    case "paragraph":
      return <p className="text-base leading-7 text-[var(--color-text-secondary)] mb-4 text-balance">{block.text || ""}</p>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      const style = block.ordered ? "list-decimal" : "list-disc";
      return (
        <Tag className={`mb-6 pl-5 text-[var(--color-text-secondary)] ${style}`}>
          {(block.items || []).map((it, i) => (
            <li key={i} className="mb-2 leading-7 pl-1">{it}</li>
          ))}
        </Tag>
      );
    }
    case "code":
      return <CodeBlock code={block.code || ""} language={block.language} />;
    case "callout": {
      const ic = calloutIcons[block.variant || ""] || calloutIcons.tip;
      return (
        <div className="my-6 rounded-lg border-l-4 border-emerald-500/50 bg-emerald-500/[0.03] p-4 flex gap-3">
          <Icon name={ic} className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-500" />
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{block.text || ""}</p>
        </div>
      );
    }
    case "timeline":
      return (
        <div className="my-6 relative pl-6 border-l-2 border-[var(--color-border-subtle)]">
          {((block.items as unknown as { year?: string; description?: string }[]) || []).map((item, i) => (
            <div key={i} className="relative mb-6 last:mb-0">
              <span className="absolute -left-[31px] top-0 h-5 w-5 rounded-full bg-emerald-500 border-4 border-[var(--color-background)]" />
              <div className="text-sm font-semibold text-emerald-500 mb-1">{item.year || ""}</div>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item.description || ""}</p>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

// ─── Quiz (single choice) ───
function QuizBlock({ block }: { block: CustomBlock }) {
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const options = block.options || [];
  const correctIndex = block.correctIndex ?? 0;

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="check-square" className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Kvíz</span>
      </div>
      <h3 className="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">{block.question || ""}</h3>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isCorrect = answered && i === correctIndex;
          const isWrong = answered && selected === i && i !== correctIndex;
          const isSelected = selected === i;
          let cls: string;
          let badge: string;
          let badgeInner: React.ReactNode;
          if (isCorrect) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"; badgeInner = <Icon name="check" className="h-3.5 w-3.5" />; }
          else if (isWrong) { cls = "border-red-500/50 bg-red-500/10 text-red-500"; badge = "bg-red-500/20 border-red-500/30 text-red-500"; badgeInner = <Icon name="x" className="h-3.5 w-3.5" />; }
          else if (isSelected) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]"; badgeInner = LETTERS[i] || i + 1; }
          else { cls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]"; badge = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]"; badgeInner = LETTERS[i] || i + 1; }
          const dim = answered && selected !== i && i !== correctIndex ? "opacity-50" : "";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => {
                if (answered) return;
                setSelected(i);
                setAnswered(true);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${cls} ${dim}`}
            >
              <span className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${badge}`}>{badgeInner}</span>
              <span className="text-sm leading-5">{opt}</span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mt-4">
            <p className="text-sm text-emerald-500 font-medium mb-1">Vysvětlení:</p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-6">{block.explanation || ""}</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => { setSelected(null); setAnswered(false); }}
              className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Icon name="rotate-ccw" className="h-4 w-4" />Zkusit znovu
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Multiple choice ───
function MultipleBlock({ block }: { block: CustomBlock }) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [answered, setAnswered] = useState(false);
  const correctSet = useMemo(() => new Set(block.correctIndices || []), [block.correctIndices]);
  const options = block.options || [];
  const allCorrect = answered && selected.size === correctSet.size && [...selected].every((s) => correctSet.has(s));

  function toggle(i: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="check-square" className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Více správných odpovědí</span>
      </div>
      <h3 className="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">{block.question || ""}</h3>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const chosen = selected.has(i);
          const shouldBe = correctSet.has(i);
          const showCorrect = answered && shouldBe;
          const showWrong = answered && chosen && !shouldBe;
          let cls: string;
          let badge: string;
          if (showCorrect) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"; }
          else if (showWrong) { cls = "border-red-500/50 bg-red-500/10 text-red-500"; badge = "bg-red-500/20 border-red-500/30 text-red-500"; }
          else if (chosen) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"; }
          else { cls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]"; badge = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]"; }
          const dim = answered && !chosen && !shouldBe ? "opacity-50" : "";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => { if (!answered) toggle(i); }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${cls} ${dim}`}
            >
              <span className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${badge}`}>
                {(chosen || showCorrect) ? <Icon name="check-square" className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="text-sm leading-5">{opt}</span>
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className="mt-4">
          <div className={`rounded-lg border p-3 text-sm leading-6 ${allCorrect ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-amber-500/20 bg-amber-500/5 text-amber-600"}`}>
            {allCorrect ? (
              <><Icon name="check" className="inline h-4 w-4 mr-1 mb-0.5" />Správně! Všechny odpovědi jsou v pořádku.</>
            ) : (
              <><Icon name="x" className="inline h-4 w-4 mr-1 mb-0.5" />Některé odpovědi nejsou správné. Správné jsou: {(block.correctIndices || []).map((i) => options[i]).join(", ")}.</>
            )}
          </div>
          {block.explanation ? (
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm text-emerald-500 font-medium mb-1">Vysvětlení:</p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-6">{block.explanation}</p>
            </div>
          ) : null}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => { setSelected(new Set()); setAnswered(false); }}
              className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Icon name="rotate-ccw" className="h-4 w-4" />Zkusit znovu
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => setAnswered(true)}
            className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <Icon name="check-circle-2" className="h-4 w-4" />Potvrdit
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Match (spojovačka) ───
function MatchBlock({ block }: { block: CustomBlock }) {
  const pairs = useMemo(() => block.pairs || [], [block.pairs]);
  // Pozn.: legacy promíchala pravý sloupec při každém remountu. Pro stabilitu
  // v Reactu (re-rendery při setMatches) ho promícháme jen jednou (useMemo).
  // Math.random je záměrně nedeterministické — viz legacy chování; impurity
  // v useMemo tolerována (shuffle nemá být idempotentní).
  const shuffledRight = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => pairs.map((_, i) => i).sort(() => Math.random() - 0.5),
    [pairs],
  );
  const [matches, setMatches] = useState<Map<number, number>>(() => new Map());
  const [answered, setAnswered] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="link" className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Spojovačka</span>
      </div>
      <h3 className="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">{block.question || ""}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {pairs.map((pair, i) => {
            const matchedEntry = [...matches.entries()].find(([, r]) => shuffledRight[r] === i);
            const matched = matchedEntry ? matchedEntry[0] : null;
            let cls: string;
            if (selectedLeft === i && matched === null) cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
            else if (matched !== null) cls = "border-emerald-500/30 bg-emerald-500/5 text-emerald-600";
            else cls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]";
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => {
                  const matchedEntry2 = [...matches.entries()].find(([, r]) => shuffledRight[r] === i);
                  if (matchedEntry2) {
                    setMatches((prev) => {
                      const n = new Map(prev);
                      n.delete(matchedEntry2[0]);
                      return n;
                    });
                    return;
                  }
                  setSelectedLeft(i);
                }}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${cls}`}
              >
                <span className="font-medium">{pair.left}</span>
                {matched !== null ? <span className="ml-2 text-xs text-emerald-500">↔ {pairs[matched].right}</span> : null}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {shuffledRight.map((origIdx, displayIdx) => {
            const used = [...matches.values()].includes(displayIdx);
            return (
              <button
                key={displayIdx}
                type="button"
                disabled={answered || used}
                onClick={() => {
                  if (selectedLeft === null || answered) return;
                  const n = new Map(matches);
                  n.set(selectedLeft, displayIdx);
                  setMatches(n);
                  setSelectedLeft(null);
                  if (n.size === pairs.length) setAnswered(true);
                }}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${used ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 opacity-60" : "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]"}`}
              >
                {pairs[origIdx].right}
              </button>
            );
          })}
        </div>
      </div>
      {answered ? (
        <>
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600">
            <Icon name="check" className="inline h-4 w-4 mr-1 mb-0.5" />Hotovo! Spojovačka je vyřešena.
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => { setMatches(new Map()); setAnswered(false); setSelectedLeft(null); }}
              className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Icon name="rotate-ccw" className="h-4 w-4" />Zkusit znovu
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Order (seřazovačka) ───
function OrderBlock({ block }: { block: CustomBlock }) {
  const itemsText = block.items || [];
  const correctOrder = block.correctOrder || [];
  const [items, setItems] = useState(() =>
    itemsText.map((text, i) => ({ text, original: i })).sort(() => Math.random() - 0.5),
  );
  const [answered, setAnswered] = useState(false);
  const isCorrect = items.every((it, i) => it.original === correctOrder[i]);

  function swap(a: number, b: number) {
    setItems((prev) => {
      const n = [...prev];
      [n[a], n[b]] = [n[b], n[a]];
      return n;
    });
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="arrow-up-down" className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Seřazovačka</span>
      </div>
      <h3 className="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">{block.question || ""}</h3>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const correct = answered && item.original === correctOrder[i];
          const cls = answered
            ? correct
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              : "border-red-500/30 bg-red-500/10 text-red-600"
            : "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)]";
          return (
            <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${cls}`}>
              <span className="text-xs font-semibold text-[var(--color-text-muted)] w-5 shrink-0">{i + 1}.</span>
              <span className="flex-1">{item.text}</span>
              {!answered ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" disabled={i === 0} onClick={() => swap(i, i - 1)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30">▲</button>
                  <button type="button" disabled={i === items.length - 1} onClick={() => swap(i, i + 1)} className="p-1 rounded text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30">▼</button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {answered ? (
        <div className="mt-4">
          <div className={`rounded-lg border p-3 text-sm leading-6 ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-amber-500/20 bg-amber-500/5 text-amber-600"}`}>
            {isCorrect ? (
              <><Icon name="check" className="inline h-4 w-4 mr-1 mb-0.5" />Správně! Pořadí je v pořádku.</>
            ) : (
              <><Icon name="x" className="inline h-4 w-4 mr-1 mb-0.5" />Pořadí není správné. Zkus to znovu.</>
            )}
          </div>
          {block.explanation ? (
            <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm text-emerald-500 font-medium mb-1">Vysvětlení:</p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-6">{block.explanation}</p>
            </div>
          ) : null}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                setItems(itemsText.map((text, i) => ({ text, original: i })).sort(() => Math.random() - 0.5));
                setAnswered(false);
              }}
              className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Icon name="rotate-ccw" className="h-4 w-4" />Zkusit znovu
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setAnswered(true)}
            className="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            <Icon name="check-circle-2" className="h-4 w-4" />Ověřit pořadí
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Open (otevřené cvičení) ───
function OpenBlock({ block, index }: { block: CustomBlock; index: number }) {
  return (
    <OpenCard
      exercise={{
        id: `custom-open-${index}`,
        title: block.title || "Cvičení",
        task: block.task,
        description: block.description,
        hint: block.hint,
        keywords: block.keywords,
        modelSolution: block.modelSolution,
      }}
      index={index + 1}
      completed={false}
    />
  );
}

export function CustomBlocks({ lesson }: { lesson: CustomLessonLike }) {
  const blocks = lesson.blocks || [];
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "quiz":
            return <QuizBlock key={index} block={block} />;
          case "multiple":
            return <MultipleBlock key={index} block={block} />;
          case "match":
            return <MatchBlock key={index} block={block} />;
          case "order":
            return <OrderBlock key={index} block={block} />;
          case "open":
            return <OpenBlock key={index} block={block} index={index} />;
          default:
            return <StaticBlock key={index} block={block} />;
        }
      })}
    </>
  );
}

export function Attribution({ lesson }: { lesson: CustomLessonLike }) {
  if (!lesson.author && (!lesson.sources || lesson.sources.length === 0)) return null;
  const isUrl = (s: string) => /^https?:\/\//.test(s);
  return (
    <div className="mt-10 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">Doložka</span>
      </div>
      <div className="space-y-3">
        {lesson.author ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Icon name="user" className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              <span className="text-[var(--color-text-muted)]">Autor: </span>
              {lesson.author}
            </span>
          </div>
        ) : null}
        {lesson.sources && lesson.sources.length > 0 ? (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Zdroje</div>
            {lesson.sources.map((src, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Icon name="external-link" className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                {isUrl(src) ? (
                  <a href={src} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 hover:underline transition-colors break-all">
                    {src}
                  </a>
                ) : (
                  <span>{src}</span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}