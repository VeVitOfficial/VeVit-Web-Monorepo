"use client";

// PromptBuilder: skládačka zadání. V každé části (role, úkol, podoba…) žák vybere jednu kartičku,
// zadání se průběžně skládá do „zprávy“ a po odeslání se u každé části ukáže, jestli pomohla a proč.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { assemblePrompt, promptSlotsRight } from "@/lib/edu/aifb/interactive-logic";
import type { PromptBuilderConfig } from "@/lib/edu/aifb/pupil";
import { Result } from "./game-ui";

export function PromptBuilder({ config }: { config: PromptBuilderConfig }) {
  const { t } = useEduLang();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(0);
  const [firstRight, setFirstRight] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const right = promptSlotsRight(config, picked);
  const complete = config.slots.every((slot) => picked[slot.id] !== undefined);
  const solved = checked && right.length === config.slots.length;
  const text = assemblePrompt(config, picked);
  const restart = () => { setPicked({}); setSent(0); setFirstRight(null); setChecked(false); };

  return (
    <div className="aifb-game aifb-builder">
      <p className="aifb-builder__goal"><strong>{t("aifb.builder.goal")}:</strong> {config.goal}</p>
      <div className="aifb-game__card">
        {config.slots.map((slot) => {
          const ok = right.includes(slot.id);
          return (
            <fieldset key={slot.id} className="aifb-builder__slot" data-state={checked ? (ok ? "right" : "wrong") : "idle"}>
              <legend className="aifb-game__step">{slot.label}{checked ? <span aria-hidden="true"> {ok ? "✓" : "✗"}</span> : null}</legend>
              <div className="aifb-builder__chips">
                {slot.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="aifb-chip"
                    aria-pressed={picked[slot.id] === option.id}
                    aria-label={t("aifb.builder.pick", { text: option.text })}
                    disabled={solved}
                    onClick={() => { setPicked({ ...picked, [slot.id]: option.id }); setChecked(false); }}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
              {checked ? <p className="aifb-builder__why" data-right={ok}>{slot.why}</p> : null}
            </fieldset>
          );
        })}
        <div className="aifb-bubble aifb-bubble--me" aria-live="polite">
          <span className="aifb-bubble__who">{t("aifb.builder.preview")}</span>
          <p>{text || t("aifb.builder.empty")}</p>
        </div>
        {!solved ? (
          <button
            type="button"
            className="btn btn-primary aifb-game__next"
            disabled={!complete}
            onClick={() => { if (firstRight === null) setFirstRight(right.length); setSent(sent + 1); setChecked(true); }}
          >
            {t("aifb.builder.send")}
          </button>
        ) : null}
        {checked && !solved ? <p key={sent} className="aifb-game__feedback" role="status" data-right="false"><strong>{t("aifb.builder.fix")}</strong></p> : null}
      </div>
      {solved ? <Result t={t} correct={firstRight ?? 0} total={config.slots.length} message={config.success} onRestart={restart} /> : null}
    </div>
  );
}
