import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// Tmavé pozadí jako na vevit.cz: jemná mřížka a pomalu se pohybující zelená záře.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drift = Math.sin(frame / 90) * 60;
  const drift2 = Math.cos(frame / 120) * 80;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${width * 0.78 + drift}px ${height * 0.18 + drift2}px, rgba(16,185,129,0.16), transparent 70%),
            radial-gradient(800px 700px at ${width * 0.12 - drift}px ${height * 0.9}px, rgba(150,106,200,0.10), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          backgroundPosition: `${(frame * 0.25) % 64}px ${(frame * 0.25) % 64}px`,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};
