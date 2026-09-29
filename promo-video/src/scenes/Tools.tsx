import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Screen } from "../components/Frames";
import { Chip, LowerThird } from "../components/LowerThird";
import type { Shot } from "../components/ShotStack";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS, FONTS } from "../theme";

// 0:09–0:15 – rozcestník Tools: hledání a průjezd mřížkou 107 nástrojů.
export const Tools: React.FC = () => {
  const layout = useLayout();
  const t = TEXTS.tools;
  const shots: Shot[] = layout.portrait
    ? [{ capture: "mobile/m-tools", from: 0, scroll: [0, 1450], scrollFrames: [30, 170] }]
    : [
        {
          capture: "desktop/tools-search",
          from: 0,
          stepEvery: 7,
          stepDelay: 22,
          url: t.url,
          highlights: [{ x: 160, y: 383, w: 1280, h: 56, at: 18, radius: 10 }],
        },
        { capture: "desktop/tools-hub-long", from: 72, scroll: [0, 1500], scrollFrames: [6, 104], url: t.url },
      ];
  return (
    <AbsoluteFill>
      <Screen shots={shots} duration={SCENES.tools} url={t.url} />
      <LowerThird tag={t.tag} color={COLORS.tools} title={t.title} subtitle={t.subtitle} aside={<Stats />} />
    </AbsoluteFill>
  );
};

const Stats: React.FC = () => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const count = (to: number, delay: number) =>
    Math.round(interpolate(frame, [delay, delay + 30], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const items: [string, string][] = [
    [String(count(107, 24)), "nástrojů"],
    [String(count(8, 30)), "kategorií"],
    ["0 Kč", "cena"],
  ];
  return (
    <div style={{ display: "flex", gap: layout.portrait ? 18 : 14, alignSelf: layout.portrait ? "stretch" : "center", paddingLeft: layout.portrait ? 34 : 0 }}>
      {items.map(([value, label], index) => (
        <Chip key={label} color={COLORS.tools} size={layout.portrait ? 30 : 22} style={{ flexDirection: "column", alignItems: "flex-start", gap: 4, padding: layout.portrait ? "18px 26px" : "14px 22px", opacity: interpolate(frame, [20 + index * 6, 32 + index * 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: layout.portrait ? 54 : 40, lineHeight: 1, color: COLORS.text }}>{value}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: layout.portrait ? 20 : 15, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.textSecondary }}>{label}</span>
        </Chip>
      ))}
    </div>
  );
};
