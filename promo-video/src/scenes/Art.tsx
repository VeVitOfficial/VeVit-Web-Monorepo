import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LowerThird } from "../components/LowerThird";
import { SiteFrame } from "../components/SiteFrame";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { COLORS, FONTS } from "../theme";
import { Points } from "./Space";

// 0:57,5–1:05 – VeVit Art (vevit.art): hero webu + aktivity komunity.
// Fotky a tvorbu členů komunity záměrně neukazujeme.
const ART_BG = "#0d0d0d";
const ART_GREEN = "#10b981";

const Activity: React.FC<{ title: string; text: string; delay: number; unit: number }> = ({ title, text, delay, unit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [30 * unit, 0])}px)`,
        padding: `${26 * unit}px ${30 * unit}px`,
        borderRadius: 18 * unit,
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: `inset 0 0 0 1px rgba(16,185,129,0.06)`,
      }}
    >
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 34 * unit, color: "#ffffff" }}>{title}</div>
      <div style={{ fontFamily: FONTS.text, fontSize: 22 * unit, color: "#a3a3a3", marginTop: 8 * unit, lineHeight: 1.4 }}>{text}</div>
    </div>
  );
};

export const Art: React.FC = () => {
  const t = TEXTS.art;
  const layout = useLayout();
  return (
    <AbsoluteFill>
      <SiteFrame url={t.url} scroll={[0, 0]} scrollFrames={[0, 1]} background={ART_BG}>
        {(width) => {
          const unit = width / 1440;
          const portrait = layout.portrait;
          return (
            <div
              style={{
                display: "flex",
                flexDirection: portrait ? "column" : "row",
                alignItems: portrait ? "stretch" : "center",
                gap: 60 * unit,
                padding: portrait ? `${70 * unit}px ${80 * unit}px` : `${80 * unit}px ${90 * unit}px`,
                minHeight: 720 * unit,
              }}
            >
              <Img src={staticFile("external/art-hero.jpg")} style={{ width: (portrait ? 1000 : 690) * unit, alignSelf: portrait ? "center" : undefined }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 * unit }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: (portrait ? 30 : 20) * unit, letterSpacing: "0.12em", color: ART_GREEN }}>AKTIVNÍ NYNÍ</div>
                {t.points.map((point, index) => (
                  <Activity key={point.title} title={point.title} text={point.text} delay={24 + index * 12} unit={(portrait ? 1.3 : 1) * unit} />
                ))}
              </div>
            </div>
          );
        }}
      </SiteFrame>
      <LowerThird tag={t.tag} color={COLORS.art} title={t.title} subtitle={t.subtitle} aside={<Points points={[]} color={COLORS.art} url={t.url} start={40} />} />
    </AbsoluteFill>
  );
};
