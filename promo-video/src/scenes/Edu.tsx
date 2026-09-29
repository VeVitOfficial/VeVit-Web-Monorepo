import { AbsoluteFill } from "remotion";
import { Screen } from "../components/Frames";
import { LowerThird } from "../components/LowerThird";
import type { Shot } from "../components/ShotStack";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS } from "../theme";

// 0:21–0:27,5 – přehled kurzů programování a spuštění kódu v lekci.
const RUN_AT = 95;

export const Edu: React.FC = () => {
  const layout = useLayout();
  const t = TEXTS.edu;
  const shots: Shot[] = layout.portrait
    ? [
        { capture: "mobile/m-edu-programming", from: 0, scroll: [0, 760], scrollFrames: [22, 90] },
        { capture: "mobile/m-edu-js", from: RUN_AT, zoom: [1.3, 1.36], focus: [195, 560] },
      ]
    : [
        { capture: "desktop/edu-programming", from: 0, scroll: [0, 640], scrollFrames: [22, 88], url: "vevit.cz/edu/programovani" },
        {
          capture: "desktop/edu-js",
          from: RUN_AT,
          stepEvery: 11,
          stepDelay: 10,
          url: "vevit.cz/edu/lekce/javascript-10-pole-arrays",
          highlights: [
            { x: 316, y: 430, w: 104, h: 36, at: 40, radius: 8 },
            { x: 316, y: 488, w: 630, h: 138, at: 56 },
          ],
        },
      ];
  return (
    <AbsoluteFill>
      <Screen shots={shots} duration={SCENES.edu} />
      <LowerThird
        tag={t.tag}
        color={COLORS.edu}
        title={t.title}
        subtitle={[
          { from: 0, text: t.subtitle },
          { from: RUN_AT + 8, text: t.subtitleRun },
        ]}
      />
    </AbsoluteFill>
  );
};
