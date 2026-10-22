"use client";

// CardSort: třídění karet do hromádek. Bez tahání: každá karta má tlačítka „Dát do hromádky: …",
// takže jde ovládat klávesnicí i dotykem. Bez `expected` se nehodnotí (důležité je zdůvodnění).

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { cardsLeft, misplacedCards, placeCard, type Placement } from "@/lib/edu/aifb/interactive-logic";
import type { CardSortConfig } from "@/lib/edu/aifb/pupil";

export function CardSort({ config }: { config: CardSortConfig }) {
  const { t } = useEduLang();
  const [placement, setPlacement] = useState<Placement>({});
  const left = cardsLeft(config, placement);
  const wrong = misplacedCards(config, placement);
  const label = (id: string) => config.cards.find((card) => card.id === id)?.label ?? id;

  return (
    <div className="aifb-sort">
      {config.hint ? <p className="aifb-muted">{config.hint}</p> : null}
      <section aria-labelledby="sort-unsorted">
        <h3 className="aifb-h3" id="sort-unsorted">{t("aifb.cardsort.unsorted")}</h3>
        <ul className="aifb-sort__cards">
          {config.cards.filter((card) => placement[card.id] === undefined).map((card) => (
            <li key={card.id} className="aifb-sort__card">
              <span className="aifb-sort__label">{card.label}</span>
              <span className="aifb-sort__actions">
                {config.piles.map((pile) => (
                  <button key={pile.id} type="button" className="btn btn-ghost" onClick={() => setPlacement(placeCard(placement, card.id, pile.id))}>
                    {t("aifb.cardsort.moveTo", { pile: pile.label })}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <p role="status" className="aifb-sort__status">
        {left > 0 ? t("aifb.cardsort.left", { n: left }) : t("aifb.cardsort.done")}
        {wrong.length > 0 ? ` ${t("aifb.cardsort.misplaced", { cards: wrong.map(label).join(", ") })}` : ""}
      </p>
      <section aria-labelledby="sort-piles">
        <h3 className="aifb-h3" id="sort-piles">{t("aifb.cardsort.piles")}</h3>
        <div className="aifb-sort__piles">
          {config.piles.map((pile) => {
            const cards = config.cards.filter((card) => placement[card.id] === pile.id);
            return (
              <div key={pile.id} className="aifb-sort__pile">
                <h4>{pile.label}</h4>
                {cards.length === 0 ? <p className="aifb-muted">{t("aifb.cardsort.empty")}</p> : (
                  <ul>
                    {cards.map((card) => (
                      <li key={card.id}>
                        <span>{card.label}</span>
                        <button type="button" className="btn btn-ghost" onClick={() => setPlacement(placeCard(placement, card.id, null))}>
                          {t("aifb.cardsort.back", { card: card.label })}
                        </button>
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
