import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Screen } from "../components/Frames";
import { LowerThird } from "../components/LowerThird";
import type { Shot } from "../components/ShotStack";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS } from "../theme";

// 0:04–0:09,5 – logo VeVit, pak domovská stránka s titulkem.
const LOGO_OUT = 42;

const Emphasis: React.FC<{ start: number; children: React.ReactNode }> = ({ start, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = spring({ frame: frame - start, fps, config: { damping: 30, stiffness: 80 } });
  return (
    <span style={{ position: "relative", color: COLORS.text, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
      <span
        style={{
          position: "absolute",
          left: -4,
          right: -4,
          bottom: -6,
          height: 5,
          borderRadius: 3,
          background: COLORS.accent,
          transform: `scaleX(${draw}) rotate(-1deg)`,
          transformOrigin: "left",
          boxShadow: `0 0 16px ${COLORS.accent}`,
        }}
      />
    </span>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const t = TEXTS.intro;
  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const logoOut = interpolate(frame, [LOGO_OUT - 12, LOGO_OUT], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoSize = layout.portrait ? 420 : 360;
  const shots: Shot[] = layout.portrait
    ? [{ capture: "mobile/m-home", from: 0, scroll: [0, 120], scrollFrames: [60, 150] }]
    : [{ capture: "desktop/home-hero", from: 0, zoom: [1, 1.05], focus: [560, 520], url: "vevit.cz" }];
  return (
    <AbsoluteFill>
      {frame < LOGO_OUT && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: logoOut }}>
          <div
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: "50%",
              transform: `scale(${interpolate(logoIn, [0, 1], [0.6, 1]) + interpolate(frame, [0, LOGO_OUT], [0, 0.08])})`,
              opacity: logoIn,
              boxShadow: `0 0 ${80 + 40 * Math.sin(frame / 6)}px rgba(16,185,129,0.45)`,
            }}
          >
            <Img src={staticFile("brand/logo.webp")} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
          </div>
        </AbsoluteFill>
      )}
      {frame >= LOGO_OUT - 12 && <Screen shots={shots} duration={SCENES.intro} url="vevit.cz" enterAt={LOGO_OUT - 8} />}
      <LowerThird
        tag={t.tag}
        color={COLORS.accent}
        start={LOGO_OUT + 4}
        title={t.title}
        subtitle={
          <>
            {t.subtitle} <Emphasis start={LOGO_OUT + 26}>{t.emphasis}</Emphasis>
          </>
        }
      />
    </AbsoluteFill>
  );
};
