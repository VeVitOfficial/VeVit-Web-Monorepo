import { AbsoluteFill } from "remotion";
import { Screen } from "../components/Frames";
import { LowerThird } from "../components/LowerThird";
import type { Shot } from "../components/ShotStack";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS } from "../theme";

// 0:42–0:50 – účet: XP a levely, zabezpečení (2FA), tarify Premium.
export const Account: React.FC = () => {
  const layout = useLayout();
  const t = TEXTS.account;
  const shots: Shot[] = layout.portrait
    ? [
        { capture: "mobile/m-acc-overview", from: 0, scroll: [0, 260], scrollFrames: [40, 100], highlights: [{ x: 13, y: 287, w: 364, h: 250, at: 24 }] },
        { capture: "mobile/m-acc-billing", from: 125, scroll: [0, 780], scrollFrames: [10, 100] },
      ]
    : [
        { capture: "desktop/acc-overview", from: 0, url: t.url, highlights: [{ x: 500, y: 237, w: 920, h: 260, at: 18 }] },
        { capture: "desktop/acc-security", from: 80, url: `${t.url}/security`, highlights: [{ x: 500, y: 392, w: 920, h: 110, at: 14 }] },
        { capture: "desktop/acc-billing", from: 158, scroll: [0, 200], scrollFrames: [6, 40], url: `${t.url}/billing`, highlights: [{ x: 525, y: 551, w: 870, h: 197, at: 36 }] },
      ];
  return (
    <AbsoluteFill>
      <Screen shots={shots} duration={SCENES.account} />
      <LowerThird tag={t.tag} color={COLORS.account} title={t.title} subtitle={t.subtitle} />
    </AbsoluteFill>
  );
};
