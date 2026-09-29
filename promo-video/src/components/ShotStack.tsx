import { Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captureInfo, captureSrc } from "../captures";
import { COLORS } from "../theme";

export type Highlight = {
  // Obdélník v CSS px záběru (stejné souřadnice jako v prohlížeči při natáčení).
  x: number;
  y: number;
  w: number;
  h: number;
  /** Snímek (relativně k začátku záběru), kdy se zvýraznění objeví. */
  at?: number;
  color?: string;
  radius?: number;
};

export type Shot = {
  capture: string;
  /** Lokální snímek scény, od kterého se záběr ukazuje. */
  from: number;
  /** Posun stránky v CSS px [od, do]. */
  scroll?: [number, number];
  /** Kdy posun běží, relativně k `from` [začátek, konec]. */
  scrollFrames?: [number, number];
  /** U sekvencí: počet snímků videa na jeden snímek sekvence a zpoždění startu. */
  stepEvery?: number;
  stepDelay?: number;
  /** Pomalé přiblížení [od, do] kolem bodu `focus` (CSS px). */
  zoom?: [number, number];
  focus?: [number, number];
  highlights?: Highlight[];
  url?: string;
};

const FADE = 10;
const ease = Easing.inOut(Easing.cubic);

/** Vrátí záběr, který je v daném snímku navrchu (kvůli adrese v liště). */
export function activeShot(shots: Shot[], frame: number): Shot {
  let current = shots[0];
  for (const shot of shots) if (frame >= shot.from) current = shot;
  return current;
}

const HighlightBox: React.FC<{ highlight: Highlight; scale: number; local: number }> = ({ highlight, scale, local }) => {
  const { fps } = useVideoConfig();
  const start = highlight.at ?? 12;
  if (local < start) return null;
  const appear = spring({ frame: local - start, fps, config: { damping: 18, stiffness: 140 } });
  const pulse = 0.5 + 0.5 * Math.sin((local - start) / 7);
  const color = highlight.color ?? COLORS.accent;
  const pad = 8;
  return (
    <div
      style={{
        position: "absolute",
        left: highlight.x * scale - pad,
        top: highlight.y * scale - pad,
        width: highlight.w * scale + pad * 2,
        height: highlight.h * scale + pad * 2,
        borderRadius: highlight.radius ?? 14,
        border: `3px solid ${color}`,
        boxShadow: `0 0 0 ${4 + pulse * 4}px ${color}33, 0 0 ${30 + pulse * 20}px ${color}66`,
        opacity: appear,
        transform: `scale(${interpolate(appear, [0, 1], [1.08, 1])})`,
      }}
    />
  );
};

const ShotLayer: React.FC<{ shot: Shot; width: number; height: number; local: number; length: number; opacity: number }> = ({
  shot, width, height, local, length, opacity,
}) => {
  const info = captureInfo(shot.capture);
  const scale = width / info.width;
  const maxScroll = Math.max(0, info.height - height / scale);
  const [scrollStart, scrollEnd] = shot.scrollFrames ?? [10, Math.max(11, length)];
  const scrollCss = shot.scroll
    ? interpolate(local, [scrollStart, scrollEnd], shot.scroll, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const scroll = Math.min(maxScroll, Math.max(0, scrollCss)) * scale;
  const step = info.frames > 1 ? Math.floor(Math.max(0, local - (shot.stepDelay ?? 0)) / (shot.stepEvery ?? 6)) : 0;
  const zoom = shot.zoom ? interpolate(local, [0, Math.max(1, length)], shot.zoom, { extrapolateRight: "clamp" }) : 1;
  const [fx, fy] = shot.focus ?? [info.width / 2, height / scale / 2];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: `${fx * scale}px ${fy * scale - scroll}px`,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: -scroll, width, height: info.height * scale }}>
          <Img src={captureSrc(shot.capture, step)} style={{ width, height: info.height * scale, display: "block" }} />
          {(shot.highlights ?? []).map((highlight, index) => (
            <HighlightBox key={index} highlight={highlight} scale={scale} local={local} />
          ))}
        </div>
      </div>
    </div>
  );
};

/** Vrstvené záběry v jednom „okně“ – další záběr se vždy prolne přes předchozí. */
export const ShotStack: React.FC<{ shots: Shot[]; width: number; height: number; duration: number }> = ({ shots, width, height, duration }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {shots.map((shot, index) => {
        const next = shots[index + 1];
        const end = next ? next.from + FADE : Infinity;
        if (frame < shot.from || frame >= end) return null;
        const local = frame - shot.from;
        const length = (next ? next.from : duration) - shot.from;
        const opacity = index === 0 ? 1 : interpolate(local, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
        return <ShotLayer key={`${shot.capture}-${index}`} shot={shot} width={width} height={height} local={local} length={length} opacity={opacity} />;
      })}
    </>
  );
};
