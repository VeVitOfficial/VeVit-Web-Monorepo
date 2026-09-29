import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Screen } from "../components/Frames";
import { LowerThird } from "../components/LowerThird";
import type { Shot } from "../components/ShotStack";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS, FONTS } from "../theme";

// 0:32,5–0:42,5 – tržiště poptávek: úvod, seznam poptávek, detail s nabídkami.
const STEPS_AT = 70;

const Steps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const t = TEXTS.services;
  const size = layout.portrait ? 27 : 22;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: layout.portrait ? 16 : 10, alignSelf: layout.portrait ? "stretch" : "center", paddingLeft: layout.portrait ? 34 : 0 }}>
      {t.steps.map((step, index) => {
        const progress = spring({ frame: frame - STEPS_AT - index * 14, fps, config: { damping: 20, stiffness: 130 } });
        return (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: progress,
              transform: `translateX(${interpolate(progress, [0, 1], [30, 0])}px)`,
              fontFamily: FONTS.text,
              fontSize: size,
              color: COLORS.text,
            }}
          >
            <span
              style={{
                width: size * 1.6,
                height: size * 1.6,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: `${COLORS.services}26`,
                border: `1px solid ${COLORS.services}88`,
                color: COLORS.services,
                fontFamily: FONTS.display,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </span>
            {step}
          </div>
        );
      })}
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: size * 0.72,
          color: COLORS.textSecondary,
          marginTop: 4,
          opacity: interpolate(frame, [STEPS_AT + 60, STEPS_AT + 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {t.note}
      </div>
    </div>
  );
};

export const Services: React.FC = () => {
  const layout = useLayout();
  const t = TEXTS.services;
  const shots: Shot[] = layout.portrait
    ? [
        { capture: "mobile/m-svc-home", from: 0, scroll: [0, 520], scrollFrames: [40, 110] },
        { capture: "mobile/m-svc-detail", from: 125, scroll: [0, 1250], scrollFrames: [10, 160] },
      ]
    : [
        { capture: "desktop/svc-home", from: 0, zoom: [1, 1.05], focus: [580, 260], url: t.url },
        { capture: "desktop/svc-list", from: 85, scroll: [0, 420], scrollFrames: [10, 90], url: `${t.url}/poptavky`, highlights: [{ x: 518, y: 186, w: 882, h: 165, at: 14 }] },
        {
          capture: "desktop/svc-detail",
          from: 185,
          scroll: [0, 600],
          scrollFrames: [8, 60],
          url: `${t.url}/poptavka`,
          highlights: [{ x: 201, y: 676, w: 854, h: 234, at: 62 }],
        },
      ];
  return (
    <AbsoluteFill>
      <Screen shots={shots} duration={SCENES.services} />
      <LowerThird tag={t.tag} color={COLORS.services} title={t.title} subtitle={t.subtitle} aside={<Steps />} />
    </AbsoluteFill>
  );
};
