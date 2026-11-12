"use client";

// NextWord: hra na jazykový model. Žák tipuje, které slovo ve větě následuje, a pak vidí sloupce
// s tím, jak pravděpodobná slova by volil model. Nehodnotí se pravda, jen shoda s nejčastějším slovem.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import type { NextWordConfig } from "@/lib/edu/aifb/pupil";
import { Dots, Result } from "./game-ui";

export function NextWord({ config }: { config: NextWordConfig }) {
  const { t } = useEduLang();
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const total = config.rounds.length;
  const top = (round: NextWordConfig["rounds"][number]) => [...round.options].sort((a, b) => b.percent - a.percent)[0].word;
  const restart = () => { setIndex(0); setPicks({}); };

  if (index >= total) {
    const matches = config.rounds.filter((round) => picks[round.id] === top(round)).length;
    return (
      <div className="aifb-game aifb-nextword">
        <Result t={t} message={t("aifb.nextword.result", { n: matches, total })} onRestart={restart} />
      </div>
    );
  }

  const round = config.rounds[index];
  const pick = picks[round.id];
  return (
    <div className="aifb-game aifb-nextword">
      <Dots total={total} current={index} done={(i) => picks[config.rounds[i].id] !== undefined} />
      <div key={round.id} className="aifb-game__card">
        <p className="aifb-game__step">{t("aifb.game.round", { n: index + 1, total })}</p>
        <p className="aifb-nextword__sentence">{round.start} <span className="aifb-nextword__blank" data-filled={pick !== undefined}>{pick ?? "?"}</span></p>
        {pick === undefined ? (
          <>
            <p className="aifb-game__ask">{t("aifb.nextword.ask")}</p>
            <div className="aifb-game__options">
              {round.options.map((option) => (
                <button key={option.word} type="button" className="aifb-tile" onClick={() => setPicks({ ...picks, [round.id]: option.word })}>
                  <span>{option.word}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="aifb-game__ask">{t("aifb.nextword.model")}</p>
            <ul className="aifb-nextword__bars">
              {[...round.options].sort((a, b) => b.percent - a.percent).map((option) => (
                <li key={option.word} data-mine={option.word === pick}>
                  <span className="aifb-nextword__word">{option.word}{option.word === pick ? <em> ({t("aifb.nextword.you")})</em> : null}</span>
                  <span className="aifb-nextword__bar" aria-hidden="true"><i style={{ width: `${option.percent}%` }} /></span>
                  <span className="aifb-nextword__pct">{option.percent} %</span>
                </li>
              ))}
            </ul>
            <p className="aifb-game__feedback" role="status" data-right="true">
              <strong>{pick === top(round) ? t("aifb.nextword.match") : t("aifb.nextword.other")}</strong> {round.note}
            </p>
            <button type="button" className="btn btn-primary aifb-game__next" onClick={() => setIndex(index + 1)}>
              {index + 1 < total ? t("aifb.game.next") : t("aifb.game.finish")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
