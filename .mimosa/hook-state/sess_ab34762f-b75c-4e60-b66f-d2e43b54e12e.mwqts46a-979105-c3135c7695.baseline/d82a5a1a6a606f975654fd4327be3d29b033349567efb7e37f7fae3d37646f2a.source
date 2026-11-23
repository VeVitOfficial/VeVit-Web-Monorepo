"use client";

// PairMatch: spojovačka. Žák vybere kartu vlevo a k ní kartu vpravo; správná dvojice se zamkne
// a dostane stejné číslo, nesprávná se zatřese. Pravý sloupec je promíchaný stále stejně.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { pairRightOrder } from "@/lib/edu/aifb/interactive-logic";
import type { PairMatchConfig } from "@/lib/edu/aifb/pupil";
import { Emoji, Result } from "./game-ui";

export function PairMatch({ config }: { config: PairMatchConfig }) {
  const { t } = useEduLang();
  const [left, setLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [wrong, setWrong] = useState<{ left: string; right: string; n: number } | null>(null);
  const total = config.pairs.length;
  const rightOrder = pairRightOrder(config);
  const byId = (id: string) => config.pairs.find((pair) => pair.id === id);
  const restart = () => { setLeft(null); setMatched([]); setMissed([]); setWrong(null); };

  const pickRight = (id: string) => {
    if (left === null) return;
    if (left === id) { setMatched([...matched, id]); setWrong(null); }
    else {
      if (!missed.includes(left)) setMissed([...missed, left]);
      setWrong({ left, right: id, n: (wrong?.n ?? 0) + 1 });
    }
    setLeft(null);
  };

  const done = matched.length === total;
  return (
    <div className="aifb-game aifb-pairs">
      <p className="aifb-game__ask" role="status">
        {done ? t("aifb.pairs.done", { n: matched.length, total }) : left === null ? t("aifb.pairs.left") : t("aifb.pairs.right")}
        {!done ? ` · ${t("aifb.pairs.done", { n: matched.length, total })}` : ""}
      </p>
      <div className="aifb-pairs__grid">
        <ul className="aifb-pairs__col">
          {config.pairs.map((pair) => {
            const number = matched.indexOf(pair.id) + 1;
            return (
              <li key={pair.id}>
                <button
                  type="button"
                  className="aifb-tile aifb-pairs__card"
                  data-state={number > 0 ? "right" : wrong?.left === pair.id ? "shake" : "idle"}
                  data-n={wrong?.left === pair.id ? wrong.n : undefined}
                  aria-pressed={left === pair.id}
                  disabled={number > 0}
                  onClick={() => { setLeft(pair.id); setWrong(null); }}
                >
                  {number > 0 ? <span className="aifb-pairs__num" aria-hidden="true">{number}</span> : <Emoji value={pair.emoji} />}
                  <span>{pair.left}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="aifb-pairs__col">
          {rightOrder.map((id) => {
            const pair = byId(id);
            if (!pair) return null;
            const number = matched.indexOf(id) + 1;
            return (
              <li key={id}>
                <button
                  type="button"
                  className="aifb-tile aifb-pairs__card aifb-pairs__card--right"
                  data-state={number > 0 ? "right" : wrong?.right === id ? "shake" : "idle"}
                  disabled={number > 0 || left === null}
                  onClick={() => pickRight(id)}
                >
                  {number > 0 ? <span className="aifb-pairs__num" aria-hidden="true">{number}</span> : null}
                  <span>{pair.right}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {wrong ? <p key={wrong.n} className="aifb-game__feedback" role="status" data-right="false"><strong>{t("aifb.pairs.wrong")}</strong></p> : null}
      {done ? <Result t={t} correct={total - missed.length} total={total} onRestart={restart} /> : null}
    </div>
  );
}
