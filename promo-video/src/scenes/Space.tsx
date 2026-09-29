import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Chip, LowerThird } from "../components/LowerThird";
import { SiteFrame } from "../components/SiteFrame";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { COLORS, FONTS } from "../theme";

// 0:49,5–0:58 – VeVit Software Studios (vevit.space): výřezy skutečného webu.
const NAVY = "#071224";

export const Points: React.FC<{ points: readonly string[]; color: string; url: string; start: number }> = ({ points, color, url, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const size = layout.portrait ? 26 : 21;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: layout.portrait ? 14 : 10, alignSelf: layout.portrait ? "stretch" : "center", paddingLeft: layout.portrait ? 34 : 0 }}>
      {points.map((point, index) => {
        const progress = spring({ frame: frame - start - index * 10, fps, config: { damping: 20, stiffness: 130 } });
        return (
          <div key={point} style={{ opacity: progress, transform: `translateX(${interpolate(progress, [0, 1], [30, 0])}px)`, display: "flex", alignItems: "center", gap: 12, fontFamily: FONTS.text, fontSize: size, color: COLORS.text }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {point}
          </div>
        );
      })}
      <div style={{ opacity: spring({ frame: frame - start - points.length * 10 - 6, fps, config: { damping: 20 } }), marginTop: 6 }}>
        <Chip color={color} size={layout.portrait ? 30 : 24} style={{ fontFamily: FONTS.mono, fontWeight: 600 }}>
          {url}
          <svg width="0.9em" height="0.9em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </Chip>
      </div>
    </div>
  );
};

export const Space: React.FC = () => {
  const t = TEXTS.space;
  const layout = useLayout();
  return (
    <AbsoluteFill>
      <SiteFrame url={t.url} light scroll={layout.portrait ? [0, 0] : [0, 620]} scrollFrames={[70, 190]} background={NAVY}>
        {(width) => {
          const unit = width / 1440;
          // Na výšku je okno užší – výřezy zvětšíme na celou šířku okna.
          const heroHeight = layout.portrait ? 420 : 430 * unit;
          const heroWidth = layout.portrait ? 860 : 1050 * unit;
          const cropWidth = layout.portrait ? width - 40 : 1360 * unit;
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width, height: heroHeight, background: "#ffffff", display: "grid", placeItems: "center" }}>
                <Img src={staticFile("external/space-hero.jpg")} style={{ width: heroWidth }} />
              </div>
              <Img src={staticFile("external/space-process.jpg")} style={{ width: cropWidth, marginTop: 30 }} />
              <Img src={staticFile("external/space-pricing.jpg")} style={{ width: cropWidth, marginTop: 16, marginBottom: 40 }} />
            </div>
          );
        }}
      </SiteFrame>
      <LowerThird tag={t.tag} color={COLORS.space} title={t.title} subtitle={t.subtitle} aside={<Points points={t.points} color={COLORS.space} url={t.url} start={40} />} />
    </AbsoluteFill>
  );
};
