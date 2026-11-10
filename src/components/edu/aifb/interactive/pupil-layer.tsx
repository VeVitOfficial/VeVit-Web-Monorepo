"use client";

// Žákovská vrstva lekce: text + interaktivní komponenta podle konfigurace (CardSort, TrafficLightCards,
// QuizCard, PromptBuilder, TextDetective, NextWord, ScaleLine, ChatSim, PairMatch, AiSandbox). Konfigurace přichází ze serveru; komponenty nic neukládají mimo prohlížeč.

import { useEduLang } from "../../i18n";
import { RichText, type RichTextContext } from "../rich-text";
import type {
  AiSandboxConfig, CardSortConfig, ChatSimConfig, NextWordConfig, PairMatchConfig, PromptBuilderConfig, PupilLayer, QuizConfig,
  ScaleLineConfig, TextDetectiveConfig, TrafficLightConfig,
} from "@/lib/edu/aifb/pupil";
import { AiSandbox } from "./ai-sandbox";
import { CardSort } from "./card-sort";
import { ChatSim } from "./chat-sim";
import { NextWord } from "./next-word";
import { PairMatch } from "./pair-match";
import { PromptBuilder } from "./prompt-builder";
import { ScaleLine } from "./scale-line";
import { TextDetective } from "./text-detective";
import { QuizCard } from "./quiz-card";
import { TrafficLightCards } from "./traffic-light-cards";

export function PupilLayerView({ lessonId, categoryId, layer, ctx }: { lessonId: string; categoryId: string; layer: PupilLayer; ctx: RichTextContext }) {
  const { t } = useEduLang();
  return (
    <div className="aifb-pupil">
      {layer.theme ? (
        <div className="aifb-mission">
          <span className="aifb-mission__emoji" aria-hidden="true">{layer.theme.emoji}</span>
          <p className="aifb-mission__text">
            <span className="aifb-mission__eyebrow">{t("aifb.game.mission")}</span>
            <strong>{layer.theme.title}</strong>
          </p>
        </div>
      ) : null}
      {(layer.text ?? []).map((text, index) => <p key={index} className="aifb-lead"><RichText text={text} ctx={ctx} /></p>)}
      {layer.component === "CardSort" ? <CardSort config={layer.config as CardSortConfig} /> : null}
      {layer.component === "TrafficLightCards" ? <TrafficLightCards config={layer.config as TrafficLightConfig} /> : null}
      {layer.component === "QuizCard" ? <QuizCard config={layer.config as QuizConfig} /> : null}
      {layer.component === "PromptBuilder" ? <PromptBuilder config={layer.config as PromptBuilderConfig} /> : null}
      {layer.component === "TextDetective" ? <TextDetective config={layer.config as TextDetectiveConfig} /> : null}
      {layer.component === "NextWord" ? <NextWord config={layer.config as NextWordConfig} /> : null}
      {layer.component === "ScaleLine" ? <ScaleLine config={layer.config as ScaleLineConfig} /> : null}
      {layer.component === "ChatSim" ? <ChatSim config={layer.config as ChatSimConfig} /> : null}
      {layer.component === "PairMatch" ? <PairMatch config={layer.config as PairMatchConfig} /> : null}
      {layer.component === "AiSandbox" ? <AiSandbox lessonId={lessonId} categoryId={categoryId} config={layer.config as AiSandboxConfig} /> : null}
    </div>
  );
}
