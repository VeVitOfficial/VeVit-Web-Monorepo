"use client";

// TextDetective: text (odpověď AI, zpráva, e-mail, web) rozdělený na úseky. Žák kliká na úseky,
// které hledá: chyby, varovné znaky, nebo osobní údaje (ty se po kliknutí nahradí bezpečným slovem).
// Každý úsek je tlačítko, takže jde ovládat klávesnicí; nalezené se vypisují i s vysvětlením.

import { useState } from "react";
import { useEduLang } from "../../i18n";
import { detectiveProgress } from "@/lib/edu/aifb/interactive-logic";
import type { TextDetectiveConfig } from "@/lib/edu/aifb/pupil";
import { Result } from "./game-ui";

export function TextDetective({ config }: { config: TextDetectiveConfig }) {
  const { t } = useEduLang();
  const [found, setFound] = useState<string[]>([]);
  const [misses, setMisses] = useState<string[]>([]);
  const [last, setLast] = useState<{ id: string; n: number } | null>(null);
  const progress = detectiveProgress(config, found);
  const restart = () => { setFound([]); setMisses([]); setLast(null); };
  const click = (id: string, target: boolean) => {
    if (target) { if (!found.includes(id)) setFound([...found, id]); setLast(null); return; }
    if (!misses.includes(id)) setMisses([...misses, id]);
    setLast({ id, n: (last?.n ?? 0) + 1 });
  };

  return (
    <div className="aifb-game aifb-detective">
      <p className="aifb-game__ask">{t(`aifb.detective.task.${config.mode}`)}</p>
      <p className="aifb-detective__count" role="status">🔎 {t("aifb.detective.found", { found: progress.found, total: progress.total })}</p>
      <div className={`aifb-detective__frame aifb-detective__frame--${config.frame ?? "document"}`}>
        {config.header ? (
          <dl className="aifb-detective__header">
            {config.header.from ? <><dt>{t("aifb.detective.from")}</dt><dd>{config.header.from}</dd></> : null}
            {config.header.subject ? <><dt>{t("aifb.detective.subject")}</dt><dd>{config.header.subject}</dd></> : null}
          </dl>
        ) : null}
        <p className="aifb-detective__text">
          {config.segments.map((segment) => {
            const isFound = found.includes(segment.id);
            const state = isFound ? "found" : misses.includes(segment.id) ? "miss" : "idle";
            return (
              <button
                key={segment.id}
                type="button"
                className="aifb-seg"
                data-state={state}
                data-mode={config.mode}
                aria-pressed={isFound}
                disabled={isFound || progress.done}
                onClick={() => click(segment.id, segment.target === true)}
              >
                {isFound && config.mode === "redact" ? segment.replacement : segment.text}
              </button>
            );
          })}
        </p>
      </div>
      {last && !progress.done ? <p key={last.n} className="aifb-game__feedback" role="status" data-right="false"><strong>{t("aifb.detective.miss")}</strong></p> : null}
      {found.length > 0 ? (
        <section className="aifb-detective__notes" aria-labelledby="aifb-detective-notes">
          <h3 className="aifb-game__step" id="aifb-detective-notes">{t("aifb.detective.notes")}</h3>
          <ul>
            {config.segments.filter((segment) => found.includes(segment.id)).map((segment) => (
              <li key={segment.id}><strong>{segment.text.trim()}</strong> {segment.explanation}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {progress.done ? <Result t={t} correct={Math.max(0, progress.total - misses.length)} total={progress.total} onRestart={restart} /> : null}
    </div>
  );
}
