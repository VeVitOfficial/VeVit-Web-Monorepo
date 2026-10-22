"use client";

// Žákovská vrstva lekce: text + interaktivní komponenta podle konfigurace (CardSort, TrafficLightCards,
// QuizCard, AiSandbox). Konfigurace přichází ze serveru; komponenty nic neukládají mimo prohlížeč.

import { RichText, type RichTextContext } from "../rich-text";
import type { AiSandboxConfig, CardSortConfig, PupilLayer, QuizConfig, TrafficLightConfig } from "@/lib/edu/aifb/pupil";
import { AiSandbox } from "./ai-sandbox";
import { CardSort } from "./card-sort";
import { QuizCard } from "./quiz-card";
import { TrafficLightCards } from "./traffic-light-cards";

export function PupilLayerView({ lessonId, categoryId, layer, ctx }: { lessonId: string; categoryId: string; layer: PupilLayer; ctx: RichTextContext }) {
  return (
    <div className="aifb-pupil">
      {(layer.text ?? []).map((text, index) => <p key={index} className="aifb-lead"><RichText text={text} ctx={ctx} /></p>)}
      {layer.component === "CardSort" ? <CardSort config={layer.config as CardSortConfig} /> : null}
      {layer.component === "TrafficLightCards" ? <TrafficLightCards config={layer.config as TrafficLightConfig} /> : null}
      {layer.component === "QuizCard" ? <QuizCard config={layer.config as QuizConfig} /> : null}
      {layer.component === "AiSandbox" ? <AiSandbox lessonId={lessonId} categoryId={categoryId} config={layer.config as AiSandboxConfig} /> : null}
    </div>
  );
}
