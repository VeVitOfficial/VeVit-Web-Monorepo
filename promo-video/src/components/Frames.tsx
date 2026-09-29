import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../layout";
import { COLORS, FONTS } from "../theme";
import { activeShot, ShotStack, type Shot } from "./ShotStack";

const CHROME = 44;

/** Okno prohlížeče s adresním řádkem. */
export const BrowserFrame: React.FC<{
  x: number; y: number; width: number; contentHeight: number; url: string;
  light?: boolean; style?: React.CSSProperties; children: React.ReactNode;
}> = ({ x, y, width, contentHeight, url, light = false, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      borderRadius: 18,
      overflow: "hidden",
      background: light ? "#ffffff" : "#0f0f10",
      border: `1px solid ${light ? "rgba(255,255,255,0.35)" : COLORS.borderStrong}`,
      boxShadow: "0 50px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03), 0 0 80px rgba(16,185,129,0.08)",
      ...style,
    }}
  >
    <div
      style={{
        height: CHROME,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 18px",
        background: light ? "#eef1f5" : "#1a1a1c",
        borderBottom: `1px solid ${light ? "#dde2ea" : COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
          <span key={color} style={{ width: 12, height: 12, borderRadius: 6, background: color, opacity: 0.85 }} />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          maxWidth: 560,
          margin: "0 auto",
          height: 28,
          borderRadius: 8,
          background: light ? "#ffffff" : "#0d0d0d",
          border: `1px solid ${light ? "#d5dbe4" : COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: FONTS.mono,
          fontSize: 15,
          color: light ? "#334155" : COLORS.textSecondary,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2.5" strokeLinecap="round">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        {url}
      </div>
      <div style={{ width: 60 }} />
    </div>
    <div style={{ position: "relative", width, height: contentHeight, overflow: "hidden" }}>{children}</div>
  </div>
);

/** Telefon pro vertikální verzi. */
export const PhoneFrame: React.FC<{ x: number; y: number; width: number; contentHeight: number; children: React.ReactNode }> = ({
  x, y, width, contentHeight, children,
}) => {
  const bezel = 14;
  return (
    <div
      style={{
        position: "absolute",
        left: x - bezel,
        top: y - bezel,
        width: width + bezel * 2,
        height: contentHeight + bezel * 2,
        borderRadius: 64,
        padding: bezel,
        background: "linear-gradient(160deg, #2a2a2d, #101012 40%, #1b1b1e)",
        boxShadow: "0 60px 140px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.06), 0 0 90px rgba(16,185,129,0.10)",
      }}
    >
      <div style={{ position: "relative", width, height: contentHeight, borderRadius: 50, overflow: "hidden", background: "#0d0d0d" }}>
        {children}
      </div>
    </div>
  );
};

/** Hlavní „obrazovka“ scény: prohlížeč (na šířku) nebo telefon (na výšku) se záběry. */
export const Screen: React.FC<{ shots: Shot[]; duration: number; url?: string; enterAt?: number }> = ({ shots, duration, url, enterAt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const { x, y, width, contentHeight } = layout.screen;
  const enter = spring({ frame: frame - enterAt, fps, config: { damping: 20, stiffness: 110 } });
  const style: React.CSSProperties = {
    opacity: interpolate(enter, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(enter, [0, 1], [60, 0])}px) scale(${interpolate(enter, [0, 1], [0.97, 1])})`,
  };
  const stack = <ShotStack shots={shots} width={width} height={contentHeight} duration={duration} />;
  if (layout.portrait) {
    return (
      <div style={{ position: "absolute", inset: 0, ...style }}>
        <PhoneFrame x={x} y={y} width={width} contentHeight={contentHeight}>{stack}</PhoneFrame>
      </div>
    );
  }
  const current = activeShot(shots, frame);
  return (
    <BrowserFrame x={x} y={y} width={width} contentHeight={contentHeight} url={current.url ?? url ?? "vevit.cz"} style={style}>
      {stack}
    </BrowserFrame>
  );
};
