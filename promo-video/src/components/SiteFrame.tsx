import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../layout";
import { BrowserFrame } from "./Frames";

/**
 * Okno prohlížeče pro externí weby (vevit.space, vevit.art). Obsah je složený
 * z výřezů snímků webu; `children` dostane šířku obsahu a posouvá se o `scroll`.
 */
export const SiteFrame: React.FC<{
  url: string;
  light?: boolean;
  scroll: [number, number];
  scrollFrames: [number, number];
  background: string;
  children: (width: number) => React.ReactNode;
}> = ({ url, light, scroll, scrollFrames, background, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const geometry = layout.portrait ? { x: 60, y: 76, width: 960, contentHeight: 1060 } : layout.screen;
  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 110 } });
  const offset = interpolate(frame, scrollFrames, scroll, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <BrowserFrame
      x={geometry.x}
      y={geometry.y}
      width={geometry.width}
      contentHeight={geometry.contentHeight}
      url={url}
      light={light}
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [60, 0])}px) scale(${interpolate(enter, [0, 1], [0.97, 1])})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background }}>
        <div style={{ position: "absolute", left: 0, top: -offset * (geometry.width / 1440), width: geometry.width }}>
          {children(geometry.width)}
        </div>
      </div>
    </BrowserFrame>
  );
};
