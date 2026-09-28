"use client";

// Otázky AI gramotnosti: ovládací prvky všech 16 typů (port quiz/types/*.mjs
// a quiz/types/controls/*.mjs) + feedback po vyhodnocení (renderer.mjs).
// Každý ovládací prvek drží vlastní stav a hlásí aktuální odpověď přes onChange.

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Dict, Difficulty, EvalResult, QuizQuestion } from "./types";

type Answer = Dict;
type ControlProps = { question: QuizQuestion; onChange: (answer: Answer) => void; revealRubric?: boolean };
type Payload = Dict & Record<string, unknown>;

function payloadOf(question: { payload?: unknown }): Payload {
  return (question.payload as Payload) || {};
}

function arr<T = Dict>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// ── choice (mcq / multi) ─────────────────────────────────────────────────
function ChoiceControl({ question, onChange }: ControlProps) {
  const multiple = question.type === "multi";
  const [selected, setSelected] = useState<number[]>([]);
  const options = arr(payloadOf(question).options);
  function toggle(index: number, checked: boolean) {
    const next = multiple
      ? (checked ? [...selected, index] : selected.filter((i) => i !== index)).sort((a, b) => a - b)
      : [index];
    setSelected(next);
    onChange(multiple ? { optionIndices: next } : { optionIndex: next[0] });
  }
  return (
    <div className="quiz-choice-group" role={multiple ? "group" : "radiogroup"}>
      {options.map((option, index) => (
        <label key={index} className="quiz-choice">
          <input
            type={multiple ? "checkbox" : "radio"}
            name={`quiz-${question.id}`}
            value={String(index)}
            checked={selected.includes(index)}
            onChange={(e) => toggle(index, e.target.checked)}
          />
          {String(option.text ?? "")}
        </label>
      ))}
    </div>
  );
}

// ── truefalse_rapid ──────────────────────────────────────────────────────
function RapidControl({ question, onChange }: ControlProps) {
  const statements = arr(payloadOf(question).statements);
  const [values, setValues] = useState<(boolean | null)[]>(() => statements.map(() => null));
  function pick(index: number, value: boolean) {
    const next = values.map((v, i) => (i === index ? value : v));
    setValues(next);
    // Nezodpovězené položky se v originále serializují jako false.
    onChange({ answers: next.map((v) => v === true) });
  }
  return (
    <div className="quiz-rapid-list">
      {statements.map((statement, index) => (
        <fieldset key={index}>
          <legend>{String(statement.text ?? "")}</legend>
          {(["Ano", "Ne"] as const).map((label, optionIndex) => (
            <label key={label}>
              <input
                type="radio"
                name={`${question.id}-${index}`}
                checked={values[index] === (optionIndex === 0)}
                onChange={() => pick(index, optionIndex === 0)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

// ── assignments (sort_buckets / match / order) ───────────────────────────
function AssignmentsControl({ question, onChange }: ControlProps) {
  const payload = payloadOf(question);
  const mode = question.type === "sort_buckets" ? "bucket" : question.type;
  const items = arr<Dict | string>(payload.items ?? payload.pairs);
  const targets: string[] = mode === "bucket"
    ? arr<string>(payload.buckets)
    : mode === "match"
      ? (payload.rightOptions
        ? arr<string>(payload.rightOptions)
        : [...items.map((pair) => String((pair as Dict).right ?? "")), ...arr<string>(payload.distractorsRight)])
      : items.map((_, index) => String(index + 1));
  const [choices, setChoices] = useState<string[]>(() => items.map(() => ""));
  const [live, setLive] = useState("");
  const itemText = (item: Dict | string) => (mode === "match" ? String((item as Dict).left ?? "") : typeof item === "string" ? item : String(item.text ?? ""));

  function change(index: number, value: string) {
    const next = choices.map((c, i) => (i === index ? value : c));
    setChoices(next);
    if (mode === "bucket") {
      onChange({ assignments: Object.fromEntries(next.map((v, i) => [i, v === "" ? "" : targets[Number(v)]])) });
    } else if (mode === "match") {
      onChange({ matches: Object.fromEntries(next.map((v, i) => [i, v === "" ? "" : targets[Number(v)]])) });
    } else {
      const orderItems = next
        .map((v, i) => ({ position: v === "" ? null : Number(v), value: itemText(items[i]) }))
        .filter((entry): entry is { position: number; value: string } => Number.isInteger(entry.position))
        .sort((a, b) => a.position - b.position)
        .map((entry) => entry.value);
      onChange({ orderItems });
    }
    setLive(`${itemText(items[index])}: volba změněna.`);
  }

  return (
    <div>
      <p className="quiz-help">Klávesnice a dotyk: u každé položky vyber cíl v nabídce.</p>
      <div className="quiz-assignment-list">
        {items.map((item, index) => (
          <label key={index} className="quiz-assignment-row">
            <span>{itemText(item)}</span>
            <select aria-label={`${itemText(item)}: vyber cíl`} value={choices[index]} onChange={(e) => change(index, e.target.value)}>
              <option value="">Vyber cíl…</option>
              {targets.map((target, targetIndex) => (
                <option key={targetIndex} value={String(targetIndex)}>{target}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{live}</p>
    </div>
  );
}

// ── slider (+ neuron widget) ─────────────────────────────────────────────
function NeuronWidget({ question, onChange }: ControlProps) {
  const examples = arr(payloadOf(question).examples);
  const [state, setState] = useState({ length: 0, links: 2, threshold: 2 });
  const correct = examples.filter((sample) =>
    (Number(sample.length) * state.length + Number(sample.links) * state.links >= state.threshold) === sample.spam).length;
  const report = useRef(onChange);
  useEffect(() => {
    report.current = onChange;
  });
  useEffect(() => {
    report.current({ value: correct, weights: { ...state } });
  }, [correct, state]);
  const sliders: [string, keyof typeof state, number, number][] = [
    ["Váha délky", "length", -3, 3], ["Váha odkazů", "links", -3, 3], ["Práh", "threshold", -4, 8],
  ];
  return (
    <div className="quiz-neuron-widget">
      <svg viewBox="0 0 420 180" role="img" aria-label="Dva vstupy vedou přes váhy do neuronu a rozhodnutí spam.">
        <line x1="100" y1="45" x2="205" y2="90" />
        <line x1="100" y1="135" x2="205" y2="90" />
        <line x1="255" y1="90" x2="360" y2="90" />
        <text x="10" y="48">délka textu</text>
        <text x="10" y="138">počet odkazů</text>
        <text x="200" y="95">Σ → práh</text>
        <text x="365" y="95">spam?</text>
      </svg>
      <div className="quiz-neuron-controls">
        {sliders.map(([title, key, min, max]) => (
          <label key={key}>
            {`${title}: `}
            <input
              type="range" min={min} max={max} step={1} value={state[key]}
              onChange={(e) => setState((s) => ({ ...s, [key]: Number(e.target.value) }))}
            />
            <output>{state[key]}</output>
          </label>
        ))}
      </div>
      <output>{`${correct} z 5 správně`}</output>
    </div>
  );
}

function SliderControl(props: ControlProps) {
  const payload = payloadOf(props.question);
  const [value, setValue] = useState<number>(Number(payload.min ?? 0));
  if (payload.widget === "neuron") return <NeuronWidget {...props} />;
  const unit = payload.unit ? ` ${String(payload.unit)}` : "";
  return (
    <div className="quiz-slider">
      <input
        type="range"
        min={Number(payload.min ?? 0)}
        max={Number(payload.max ?? 100)}
        step={Number(payload.step || 1)}
        value={value}
        onChange={(e) => {
          setValue(Number(e.target.value));
          props.onChange({ value: Number(e.target.value) });
        }}
      />
      <output>{`${value}${unit}`}</output>
    </div>
  );
}

// ── find (hotspot / hallucination_hunt) ──────────────────────────────────
function FindControl({ question, onChange }: ControlProps) {
  const payload = payloadOf(question);
  const spans = arr((payload.text as Dict | undefined)?.spans ?? payload.regions);
  const [selected, setSelected] = useState<number[]>([]);
  return (
    <div className="quiz-find-list" role="group">
      {spans.map((span, index) => {
        const pressed = selected.includes(index);
        return (
          <button
            key={index}
            type="button"
            className="quiz-find-item"
            aria-pressed={pressed}
            onClick={() => {
              const next = pressed ? selected.filter((i) => i !== index) : [...selected, index].sort((a, b) => a - b);
              setSelected(next);
              onChange({ selected: next });
            }}
          >
            {String(span.text || `Oblast ${index + 1}`)}
          </button>
        );
      })}
    </div>
  );
}

// ── blind_test ───────────────────────────────────────────────────────────
function BlindControl({ question, onChange }: ControlProps) {
  const items = arr(payloadOf(question).items);
  const [sources, setSources] = useState<string[]>(() => items.map(() => ""));
  return (
    <div className="quiz-blind-list">
      {items.map((item, index) => (
        <fieldset key={index}>
          <legend>{String(item.md || `Ukázka ${index + 1}`)}</legend>
          {(["human", "ai"] as const).map((source) => (
            <label key={source}>
              <input
                type="radio"
                name={`${question.id}-${index}`}
                value={source}
                checked={sources[index] === source}
                onChange={() => {
                  const next = sources.map((s, i) => (i === index ? source : s));
                  setSources(next);
                  onChange({ sources: next });
                }}
              />
              {source === "human" ? "Člověk" : "AI"}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

// ── poll ─────────────────────────────────────────────────────────────────
function PollControl({ question, onChange }: ControlProps) {
  const [state, setState] = useState<{ index: number | undefined; reason: string }>({ index: undefined, reason: "" });
  function update(next: { index: number | undefined; reason: string }) {
    setState(next);
    onChange({ optionIndex: next.index, reason: next.reason });
  }
  return (
    <div className="quiz-poll">
      <ChoiceControl question={{ ...question, type: "mcq" }} onChange={(value) => update({ ...state, index: value.optionIndex as number })} />
      <textarea rows={3} placeholder="Krátce vysvětli proč." value={state.reason} onChange={(e) => update({ ...state, reason: e.target.value })} />
    </div>
  );
}

// ── branching ────────────────────────────────────────────────────────────
function BranchingControl({ question, onChange }: ControlProps) {
  const payload = payloadOf(question);
  const nodes = (payload.nodes as Record<string, Dict>) || {};
  const endings = arr<string>(payload.endings);
  const [current, setCurrent] = useState<string>(String(payload.start ?? ""));
  const node = nodes[current];
  return (
    <div className="quiz-branching">
      <p>{String(node?.md || "")}</p>
      {arr(node?.choices).map((choice, index) => (
        <button
          key={index}
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            const next = String(choice.next ?? "");
            setCurrent(next);
            if (endings.includes(next)) onChange({ ending: next });
          }}
        >
          {String(choice.label ?? "")}
        </button>
      ))}
    </div>
  );
}

// ── text (prompt_lab / open_rubric / microtask) ──────────────────────────
function TextControl({ question, onChange, revealRubric }: ControlProps) {
  const payload = payloadOf(question);
  const rubric = arr<Dict | string>(payload.rubric);
  const [text, setText] = useState("");
  const [scores, setScores] = useState<(number | null)[]>(() => rubric.map(() => null));
  const details = useRef<HTMLDetailsElement>(null);
  const report = useRef(onChange);
  useEffect(() => {
    report.current = onChange;
  });
  useEffect(() => {
    report.current({
      text,
      ...(rubric.length ? { selfScores: [...scores] } : {}),
      ...(question.type === "microtask" ? { confirmed: text.trim().length >= 1 } : {}),
    });
    // rubric.length je pro danou otázku konstantní
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, scores, question.type]);
  // Rubrika se ukáže (a rozbalí) až po neplatném pokusu, jako v originálu.
  useEffect(() => {
    if (revealRubric && details.current) details.current.open = true;
  }, [revealRubric]);
  return (
    <div className="quiz-text-control">
      <textarea rows={5} className="quiz-text-input" placeholder="Napiš svou odpověď." value={text} onChange={(e) => setText(e.target.value)} />
      {rubric.length ? (
        <details ref={details} className="quiz-self-rubric" hidden={!revealRubric}>
          <summary>Sebehodnocení podle rubriky</summary>
          {rubric.map((criterion, index) => {
            const labelText = typeof criterion === "string" ? criterion : String(criterion.label || criterion.text || `Kritérium ${index + 1}`);
            return (
              <label key={index} className="quiz-self-rubric__row">
                <span>{labelText}</span>
                <select
                  aria-label={`${labelText}: hodnocení 0 až 5`}
                  value={scores[index] === null ? "" : String(scores[index])}
                  onChange={(e) => setScores((s) => s.map((v, i) => (i === index ? (e.target.value === "" ? null : Number(e.target.value)) : v)))}
                >
                  <option value="">Vyber 0–5</option>
                  {[0, 1, 2, 3, 4, 5].map((value) => <option key={value} value={String(value)}>{value}</option>)}
                </select>
              </label>
            );
          })}
          {payload.sampleAnswer ? <p className="quiz-self-rubric__sample">{`Ukázková odpověď: ${String(payload.sampleAnswer)}`}</p> : null}
        </details>
      ) : null}
    </div>
  );
}

// ── wager ────────────────────────────────────────────────────────────────
function InnerControl({ question, onChange }: ControlProps) {
  if (question.type === "mcq") return <ChoiceControl question={question} onChange={onChange} />;
  if (question.type === "slider") return <SliderControl question={question} onChange={onChange} />;
  if (question.type === "sort_buckets") return <AssignmentsControl question={question} onChange={onChange} />;
  return <p>Tento typ sázky není podporovaný.</p>;
}

function StakePicker({ name, stakes, value, onPick }: { name: string; stakes: number[]; value: number | null; onPick: (stake: number) => void }) {
  return (
    <>
      {stakes.map((stake) => (
        <label key={stake}>
          <input type="radio" name={name} value={String(stake)} checked={value === stake} onChange={() => onPick(stake)} />
          {`${stake} XP`}
        </label>
      ))}
    </>
  );
}

function WagerControl({ question, onChange }: ControlProps) {
  const payload = payloadOf(question);
  const stakes = arr<number>(payload.stakes).map(Number);
  const rounds = arr(payload.rounds);
  const series = Array.isArray(payload.rounds);
  const [states, setStates] = useState<{ stake: number | null; answer: Answer }[]>(() =>
    (series ? rounds : [null]).map(() => ({ stake: null, answer: {} })));
  const latest = useRef(states);
  function update(index: number, patch: Partial<{ stake: number | null; answer: Answer }>) {
    const next = latest.current.map((s, i) => (i === index ? { ...s, ...patch } : s));
    latest.current = next;
    setStates(next);
    onChange(series ? { rounds: next.map((s) => ({ stake: s.stake, answer: s.answer })) } : { stake: next[0].stake, answer: next[0].answer });
  }
  if (series) {
    return (
      <div className="quiz-wager quiz-wager--series">
        {rounds.map((round, index) => (
          <fieldset key={index} className="quiz-wager-round">
            <legend>{`${index + 1}. ${String(round.prompt ?? "")}`}</legend>
            <div className="quiz-wager-stakes">
              <StakePicker name={`${question.id}-${index}-stake`} stakes={stakes} value={states[index].stake} onPick={(stake) => update(index, { stake })} />
            </div>
            <InnerControl
              question={{ id: `${question.id}-${index}`, type: String(round.type ?? ""), payload: (round.payload as Dict) || {}, prompt: String(round.prompt ?? "") }}
              onChange={(answer) => update(index, { answer })}
            />
          </fieldset>
        ))}
      </div>
    );
  }
  const inner = (payload.inner as Dict) || {};
  return (
    <div className="quiz-wager">
      <fieldset>
        <legend>Kolik XP vsadíš?</legend>
        <StakePicker name={`${question.id}-stake`} stakes={stakes} value={states[0].stake} onPick={(stake) => update(0, { stake })} />
      </fieldset>
      <InnerControl
        question={{ id: `${question.id}-inner`, type: String(inner.type ?? ""), payload: (inner.payload as Dict) || {}, prompt: String(inner.prompt || "Vnitřní otázka") }}
        onChange={(answer) => update(0, { answer })}
      />
    </div>
  );
}

const CONTROLS: Record<string, (props: ControlProps) => ReactNode> = {
  mcq: ChoiceControl, multi: ChoiceControl, truefalse_rapid: RapidControl,
  sort_buckets: AssignmentsControl, order: AssignmentsControl, match: AssignmentsControl,
  slider: SliderControl, hotspot: FindControl, hallucination_hunt: FindControl,
  blind_test: BlindControl, wager: WagerControl, poll: PollControl, branching: BranchingControl,
  prompt_lab: TextControl, open_rubric: TextControl, microtask: TextControl,
};

/** Zadání + ovládací prvek otázky. */
export function QuestionBody({ question, onChange, revealRubric }: ControlProps) {
  const Control = CONTROLS[question.type];
  return (
    <>
      <p className="quiz-question__prompt">{question.prompt}</p>
      {question.helpText ? <p className="quiz-help">{question.helpText}</p> : null}
      {Control ? <Control question={question} onChange={onChange} revealRubric={revealRubric} /> : <p>Nepodporovaný typ otázky.</p>}
    </>
  );
}

/** Feedback po vyhodnocení (port renderer.mjs feedback()). */
export function QuestionFeedback({ question, result, difficulty = "junior", children }: {
  question: QuizQuestion;
  result: EvalResult;
  difficulty?: Difficulty;
  children?: ReactNode;
}) {
  const failed = result.valid === false || result.correct === false;
  const why = difficulty === "pro" ? question.proWhy || question.why : question.juniorWhy || question.why;
  const payload = payloadOf(question);
  const selfScorePct = Number(result.detail?.selfScorePct);
  const trap = question.trap === true && result.correct === false;
  return (
    <div className={`quiz-feedback ${failed ? "quiz-feedback--bad" : "quiz-feedback--ok"}${trap ? " quiz-feedback--trap" : ""}`} role="status">
      {result.valid === false
        ? String(result.detail?.error || "Odpověď ještě není úplná.")
        : `${result.correct === false ? "Zkus to znovu." : "Hotovo."} ${why || ""}`}
      {trap ? <p>🪤 Tohle je častý mýtus. Otázka byla zařazena do opakování.</p> : null}
      {question.type === "slider" && (payload.reveal as Dict | undefined)?.md ? <p>{String((payload.reveal as Dict).md)}</p> : null}
      {question.type === "blind_test"
        ? arr(payload.items).map((item, index) => <p key={index}>{`Ukázka ${index + 1}: ${String(item.tell || "")}`}</p>)
        : null}
      {(question.type === "prompt_lab" || question.type === "open_rubric") && Number.isFinite(selfScorePct)
        ? <p>{`Sebehodnocení: ${Math.round(selfScorePct)} %.`}</p>
        : null}
      {children}
    </div>
  );
}
