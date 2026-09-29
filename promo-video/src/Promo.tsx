import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { AbsoluteFill, Html5Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { sweep } from "./components/sweep";
import { Account } from "./scenes/Account";
import { AiLiteracy } from "./scenes/AiLiteracy";
import { Art } from "./scenes/Art";
import { Edu } from "./scenes/Edu";
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { Services } from "./scenes/Services";
import { Space } from "./scenes/Space";
import { Tools } from "./scenes/Tools";
import { ToolsAction } from "./scenes/ToolsAction";
import { SCENES, TRANSITION } from "./timeline";

export type PromoProps = { hasMusic: boolean };

const timing = linearTiming({ durationInFrames: TRANSITION });

const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [durationInFrames - 30, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ backgroundColor: "#000", opacity }} />;
};

export const Promo: React.FC<PromoProps> = ({ hasMusic }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES.hook}><Hook /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.intro}><Intro /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.tools}><Tools /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.toolsAction}><ToolsAction /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.edu}><Edu /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.ai}><AiLiteracy /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.services}><Services /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.account}><Account /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={sweep()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.space}><Space /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={sweep()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.art}><Art /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={SCENES.outro}><Outro /></TransitionSeries.Sequence>
      </TransitionSeries>
      <FadeOut />
      {hasMusic && (
        <Html5Audio
          src={staticFile("music.mp3")}
          volume={(frame) =>
            interpolate(frame, [0, 20, durationInFrames - 60, durationInFrames - 1], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          }
        />
      )}
    </AbsoluteFill>
  );
};
