"use client";

// PairGames: jedna sada dvojic, několik herních šablon (jako ve Wordwallu): spojovačka, kvíz,
// pexeso, pravda/lež a kartičky. Žák si šablonu přepíná kdykoli; každá hra je krátká a hned dává
// zpětnou vazbu. Pořadí je stálé (ne náhodné), aby se server a prohlížeč shodly.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { memoryDeck, memoryStars, quizOptionIds, stableOrder, truthStatements } from "@/lib/edu/aifb/interactive-logic";
import { PAIR_TEMPLATES, type PairMatchConfig, type PairTemplate } from "@/lib/edu/aifb/pupil";
import { Dots, Emoji, Result } from "./game-ui";
import { PairMatch } from "./pair-match";

type Pair = PairMatchConfig["pairs"][number];
const byId = (config: PairMatchConfig, id: string): Pair => config.pairs.find((pair) => pair.id === id) ?? config.pairs[0];
const TEMPLATE_EMOJI: Record<PairTemplate, string> = { match: "🔗", quiz: "❓", memory: "🧠", truefalse: "⚖️", flash: "🗂️" };

function Quiz({ config }: { config: PairMatchConfig }) {
  const { t } = useEduLang();
  const order = stableOrder(config.pairs, (pair) => pair.id, "quiz");
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(0);
  const total = order.length;
  const restart = () => { setIndex(0); setWrong([]); setSolved(false); setFirstTry(0); };
  if (index >= total) return <Result t={t} correct={firstTry} total={total} onRestart={restart} />;
  const pair = order[index];
  const options = quizOptionIds(config, pair.id);
  const pick = (id: string) => {
    if (id === pair.id) { if (wrong.length === 0) setFirstTry(firstTry + 1); setSolved(true); }
    else setWrong([...wrong, id]);
  };
  return (
    <div>
      <Dots total={total} current={index} done={(i) => i < index} />
      <div className="aifb-game__card">
        <span className="aifb-game__step">{t("aifb.game.question", { n: index + 1, total })}</span>
        <p className="aifb-game__prompt"><Emoji value={pair.emoji} className="aifb-game__emoji--big" />{pair.left}</p>
        <div className="aifb-game__options">
          {options.map((id) => {
            const state = solved && id === pair.id ? "right" : wrong.includes(id) ? "wrong" : "idle";
            return (
              <button key={id} type="button" className="aifb-tile" data-state={state} disabled={solved || state === "wrong"} onClick={() => pick(id)}>
                <span>{byId(config, id).right}</span>
              </button>
            );
          })}
        </div>
        {wrong.length > 0 && !solved ? <p key={wrong.length} className="aifb-game__feedback" role="status" data-right="false"><strong>{t("aifb.quiz.wrong")}</strong></p> : null}
        {solved ? <p className="aifb-game__feedback" role="status" data-right="true"><strong>{t("aifb.quiz.correct")}</strong></p> : null}
        {solved ? (
          <button type="button" className="btn btn-primary aifb-game__next" onClick={() => { setIndex(index + 1); setWrong([]); setSolved(false); }}>
            {index + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TrueFalse({ config }: { config: PairMatchConfig }) {
  const { t } = useEduLang();
  const statements = truthStatements(config);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [right, setRight] = useState(0);
  const total = statements.length;
  const restart = () => { setIndex(0); setAnswer(null); setRight(0); };
  if (index >= total) return <Result t={t} correct={right} total={total} onRestart={restart} />;
  const item = statements[index];
  const pair = byId(config, item.pairId);
  const shown = byId(config, item.shownId);
  const good = answer === item.isTrue;
  const choose = (value: boolean) => { setAnswer(value); if (value === item.isTrue) setRight(right + 1); };
  return (
    <div>
      <Dots total={total} current={index} done={(i) => i < index} />
      <div className="aifb-game__card">
        <span className="aifb-game__step">{t("aifb.game.question", { n: index + 1, total })}</span>
        <p className="aifb-game__prompt"><Emoji value={pair.emoji} className="aifb-game__emoji--big" /><strong>{pair.left}</strong> <span aria-hidden="true">→</span> {shown.right}</p>
        <p className="aifb-muted">{t("aifb.pairgames.tfAsk")}</p>
        <div className="aifb-game__options">
          <button type="button" className="aifb-tile" data-state={answer === null ? "idle" : item.isTrue ? "right" : answer === true ? "wrong" : "idle"} disabled={answer !== null} onClick={() => choose(true)}>
            <Emoji value="✅" /><span>{t("aifb.pairgames.true")}</span>
          </button>
          <button type="button" className="aifb-tile" data-state={answer === null ? "idle" : !item.isTrue ? "right" : answer === false ? "wrong" : "idle"} disabled={answer !== null} onClick={() => choose(false)}>
            <Emoji value="❌" /><span>{t("aifb.pairgames.false")}</span>
          </button>
        </div>
        {answer !== null ? (
          <>
            <p className="aifb-game__feedback" role="status" data-right={good}>
              <strong>{good ? t("aifb.quiz.correct") : t("aifb.quiz.wrong")}</strong>{" "}
              {item.isTrue ? t("aifb.pairgames.tfWasTrue") : t("aifb.pairgames.tfRight", { left: pair.left, right: pair.right })}
            </p>
            <button type="button" className="btn btn-primary aifb-game__next" onClick={() => { setIndex(index + 1); setAnswer(null); }}>
              {index + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Memory({ config }: { config: PairMatchConfig }) {
  const { t } = useEduLang();
  const deck = memoryDeck(config);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const pairs = deck.length / 2;
  const done = found.length === pairs;
  const restart = () => { setOpen([]); setFound([]); setMoves(0); };
  const flip = (key: string) => {
    if (open.length === 2 || open.includes(key)) return;
    const next = [...open, key];
    setOpen(next);
    if (next.length === 2) {
      setMoves(moves + 1);
      const [a, b] = next.map((k) => deck.find((card) => card.key === k)!);
      if (a.pairId === b.pairId) { setFound([...found, a.pairId]); setOpen([]); }
    }
  };
  const stars = memoryStars(moves, pairs);
  return (
    <div>
      <p className="aifb-game__ask" role="status">{t("aifb.pairgames.memoryStatus", { found: found.length, pairs, moves })}</p>
      <div className="aifb-memory__grid">
        {deck.map((card) => {
          const isFound = found.includes(card.pairId);
          const isOpen = isFound || open.includes(card.key);
          return (
            <button
              key={card.key}
              type="button"
              className="aifb-tile aifb-memory__card"
              data-state={isFound ? "right" : isOpen ? "open" : "idle"}
              aria-label={isOpen ? card.text : t("aifb.pairgames.hidden")}
              disabled={isFound}
              onClick={() => flip(card.key)}
            >
              <span aria-hidden={!isOpen}>{isOpen ? card.text : "?"}</span>
            </button>
          );
        })}
      </div>
      {open.length === 2 ? (
        <div className="aifb-toolbar">
          <p className="aifb-game__feedback" role="status" data-right="false"><strong>{t("aifb.pairs.wrong")}</strong></p>
          <button type="button" className="btn btn-primary" onClick={() => setOpen([])}>{t("aifb.game.next")}</button>
        </div>
      ) : null}
      {done ? <Result t={t} stars={stars} message={t("aifb.pairgames.memoryDone", { moves })} onRestart={restart} /> : null}
    </div>
  );
}

function Flash({ config }: { config: PairMatchConfig }) {
  const { t } = useEduLang();
  const base = stableOrder(config.pairs, (pair) => pair.id, "f");
  const [queue, setQueue] = useState<string[]>(() => base.map((pair) => pair.id));
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const total = base.length;
  const restart = () => { setQueue(base.map((pair) => pair.id)); setFlipped(false); setKnew(0); setSeen([]); };
  if (queue.length === 0) return <Result t={t} correct={knew} total={total} onRestart={restart} />;
  const pair = byId(config, queue[0]);
  const answer = (didKnow: boolean) => {
    const first = !seen.includes(pair.id);
    setSeen(first ? [...seen, pair.id] : seen);
    if (didKnow) { if (first) setKnew(knew + 1); setQueue(queue.slice(1)); }
    else setQueue([...queue.slice(1), pair.id]);
    setFlipped(false);
  };
  return (
    <div>
      <p className="aifb-game__ask" role="status">{t("aifb.pairgames.flashLeft", { n: queue.length })}</p>
      <button type="button" className="aifb-tile aifb-flash__card" data-state={flipped ? "open" : "idle"} onClick={() => setFlipped(!flipped)} aria-pressed={flipped}>
        <Emoji value={pair.emoji} className="aifb-game__emoji--big" />
        <span>{flipped ? pair.right : pair.left}</span>
        <small>{flipped ? t("aifb.pairgames.flashBack") : t("aifb.pairgames.flashFront")}</small>
      </button>
      {flipped ? (
        <div className="aifb-toolbar">
          <button type="button" className="btn btn-primary" onClick={() => answer(true)}>{t("aifb.pairgames.knew")}</button>
          <button type="button" className="btn btn-ghost" onClick={() => answer(false)}>{t("aifb.pairgames.didNot")}</button>
        </div>
      ) : null}
    </div>
  );
}

export function PairGames({ config }: { config: PairMatchConfig }) {
  const { t } = useEduLang();
  const [template, setTemplate] = useState<PairTemplate>(config.template ?? "match");
  return (
    <div className="aifb-game aifb-pairgames">
      <div className="aifb-pairgames__tabs" role="group" aria-label={t("aifb.pairgames.pick")}>
        {PAIR_TEMPLATES.map((name) => (
          <button key={name} type="button" className="aifb-pairgames__tab" aria-pressed={template === name} onClick={() => setTemplate(name)}>
            <Emoji value={TEMPLATE_EMOJI[name]} /><span>{t(`aifb.pairgames.t.${name}`)}</span>
          </button>
        ))}
      </div>
      <div key={template}>
        {template === "match" ? <PairMatch config={config} /> : null}
        {template === "quiz" ? <Quiz config={config} /> : null}
        {template === "memory" ? <Memory config={config} /> : null}
        {template === "truefalse" ? <TrueFalse config={config} /> : null}
        {template === "flash" ? <Flash config={config} /> : null}
      </div>
    </div>
  );
}
