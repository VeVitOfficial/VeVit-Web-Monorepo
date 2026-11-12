"use client";

// CardSort: třídění karet do hromádek. Bez tahání: aktuální karta je velká uprostřed a pod ní jsou
// hromádky jako velká tlačítka, takže jde ovládat klávesnicí i dotykem. S `expected` se špatná
// hromádka hned ohlásí a karta zůstane; bez `expected` se nehodnotí (důležité je zdůvodnění).

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { cardsLeft, placeCard, type Placement } from "@/lib/edu/aifb/interactive-logic";
import type { CardSortConfig } from "@/lib/edu/aifb/pupil";
import { Dots, Emoji, Result } from "./game-ui";

export function CardSort({ config }: { config: CardSortConfig }) {
  const { t } = useEduLang();
  const [placement, setPlacement] = useState<Placement>({});
  const [missed, setMissed] = useState<Record<string, number>>({});
  const [lastWrong, setLastWrong] = useState<{ card: string; pile: string; n: number } | null>(null);
  const total = config.cards.length;
  const left = cardsLeft(config, placement);
  const current = config.cards.find((card) => placement[card.id] === undefined);
  const graded = config.expected !== undefined;
  const restart = () => { setPlacement({}); setMissed({}); setLastWrong(null); };

  const drop = (cardId: string, pileId: string) => {
    const expected = config.expected?.[cardId];
    if (expected !== undefined && expected !== pileId) {
      setMissed({ ...missed, [cardId]: (missed[cardId] ?? 0) + 1 });
      setLastWrong({ card: cardId, pile: pileId, n: (lastWrong?.n ?? 0) + 1 });
      return;
    }
    setLastWrong(null);
    setPlacement(placeCard(placement, cardId, pileId));
  };

  return (
    <div className="aifb-game aifb-sort">
      {config.hint ? <p className="aifb-muted">{config.hint}</p> : null}
      <Dots total={total} current={total - left} done={(i) => placement[config.cards[i].id] !== undefined} />
      {current ? (
        <section className="aifb-game__card" aria-labelledby="sort-unsorted">
          <h3 className="aifb-game__step" id="sort-unsorted">{t("aifb.game.card", { n: total - left + 1, total })}</h3>
          <p key={`${current.id}-${lastWrong?.n ?? 0}`} className="aifb-sort__card aifb-sort__current" data-wrong={lastWrong?.card === current.id}>
            <Emoji value={current.emoji} className="aifb-game__emoji--big" />
            <span className="aifb-sort__label">{current.label}</span>
          </p>
          <p className="aifb-game__ask">{t("aifb.cardsort.where")}</p>
          <div className="aifb-game__options aifb-sort__actions">
            {config.piles.map((pile) => (
              <button
                key={pile.id}
                type="button"
                className="aifb-tile aifb-tile--pile"
                data-state={lastWrong?.card === current.id && lastWrong.pile === pile.id ? "wrong" : "idle"}
                aria-label={t("aifb.cardsort.moveTo", { pile: pile.label })}
                onClick={() => drop(current.id, pile.id)}
              >
                <Emoji value={pile.emoji} />
                <span>{pile.label}</span>
              </button>
            ))}
          </div>
          {lastWrong?.card === current.id ? (
            <p key={lastWrong.n} className="aifb-game__feedback" role="status" data-right="false"><strong>{t("aifb.cardsort.wrongPile")}</strong></p>
          ) : null}
        </section>
      ) : graded ? (
        <Result t={t} correct={config.cards.filter((card) => !missed[card.id]).length} total={total} onRestart={restart} />
      ) : (
        <Result t={t} message={t("aifb.game.doneOpen")} onRestart={restart} />
      )}
      <p role="status" className="aifb-sr">{left > 0 ? t("aifb.cardsort.left", { n: left }) : t("aifb.cardsort.done")}</p>
      <section aria-labelledby="sort-piles">
        <h3 className="aifb-h3" id="sort-piles">{t("aifb.cardsort.piles")}</h3>
        <div className="aifb-sort__piles">
          {config.piles.map((pile) => {
            const cards = config.cards.filter((card) => placement[card.id] === pile.id);
            return (
              <div key={pile.id} className="aifb-sort__pile">
                <h4><Emoji value={pile.emoji} />{pile.label}</h4>
                {cards.length === 0 ? <p className="aifb-muted">{t("aifb.cardsort.empty")}</p> : (
                  <ul>
                    {cards.map((card) => (
                      <li key={card.id}>
                        {graded ? (
                          <span className="aifb-sort__chip"><Emoji value={card.emoji} />{card.label}</span>
                        ) : (
                          <button type="button" className="aifb-sort__chip" aria-label={t("aifb.cardsort.back", { card: card.label })} onClick={() => setPlacement(placeCard(placement, card.id, null))}>
                            <Emoji value={card.emoji} />{card.label}<span aria-hidden="true"> ↩</span>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
