import { AbsoluteFill } from "remotion";
import { Screen } from "../components/Frames";
import { LowerThird } from "../components/LowerThird";
import type { Shot } from "../components/ShotStack";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS } from "../theme";

// 0:27–0:33 – kurz AI gramotnosti: postup, odznaky, lekce s kvízem.
export const AiLiteracy: React.FC = () => {
  const layout = useLayout();
  const t = TEXTS.ai;
  const shots: Shot[] = layout.portrait
    ? [{ capture: "mobile/m-ai-overview", from: 0, scroll: [0, 1000], scrollFrames: [26, 165] }]
    : [
        {
          capture: "desktop/ai-overview",
          from: 0,
          scroll: [0, 470],
          scrollFrames: [30, 90],
          url: t.url,
          highlights: [{ x: 255, y: 627, w: 174, h: 99, at: 70 }],
        },
        {
          capture: "desktop/ai-lesson",
          from: 110,
          scroll: [0, 330],
          scrollFrames: [4, 50],
          url: `${t.url}/lekce/3-2-struktura-promptu`,
          highlights: [{ x: 280, y: 532, w: 716, h: 372, at: 40 }],
        },
      ];
  return (
    <AbsoluteFill>
      <Screen shots={shots} duration={SCENES.ai} />
      <LowerThird tag={t.tag} color={COLORS.edu} title={t.title} subtitle={t.subtitle} />
    </AbsoluteFill>
  );
};
