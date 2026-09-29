import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../layout";
import { COLORS, FONTS } from "../theme";

export type TimedText = { from: number; text: React.ReactNode };

function useRise(delay: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 120 } });
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [24, 0])}px)`,
  } as React.CSSProperties;
}

/** Štítek sekce: barevná tečka + název (Geist Mono, verzálky). */
export const Tag: React.FC<{ color: string; children: React.ReactNode; size: number }> = ({ color, children, size }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.55,
      padding: `${size * 0.35}px ${size * 0.8}px`,
      borderRadius: 999,
      border: `1px solid ${color}55`,
      background: `${color}1f`,
      color,
      fontFamily: FONTS.mono,
      fontSize: size,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontWeight: 500,
    }}
  >
    <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: "50%", background: color, boxShadow: `0 0 12px ${color}` }} />
    {children}
  </div>
);

/** Střídání textů (např. podtitulek, který se v půlce scény změní). */
const Swap: React.FC<{ items: TimedText[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "grid" }}>
      {items.map((item, index) => {
        const next = items[index + 1];
        const fadeIn = index === 0 ? 1 : interpolate(frame, [item.from, item.from + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const fadeOut = next ? interpolate(frame, [next.from, next.from + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
        const shift = index === 0 ? 0 : interpolate(fadeIn, [0, 1], [14, 0]);
        return (
          <div key={index} style={{ gridArea: "1 / 1", opacity: Math.min(fadeIn, fadeOut), transform: `translateY(${shift}px)` }}>
            {item.text}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Jednotný titulek scény: štítek sekce, nadpis, podtitulek a volitelný obsah
 * (čipy, kroky). Na šířku sedí pod oknem prohlížeče, na výšku pod telefonem.
 */
export const LowerThird: React.FC<{
  tag: string;
  color: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode | TimedText[];
  start?: number;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}> = ({ tag, color, title, subtitle, start = 12, children, aside }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const { x, y, width, tag: tagSize, title: titleSize, subtitle: subtitleSize } = layout.caption;
  const bar = spring({ frame: frame - start, fps, config: { damping: 24, stiffness: 100 } });
  const subtitleItems = Array.isArray(subtitle) ? (subtitle as TimedText[]) : subtitle ? [{ from: 0, text: subtitle }] : [];
  const tagRise = useRise(start);
  const titleRise = useRise(start + 4);
  const subtitleRise = useRise(start + 9);
  const extraRise = useRise(start + 14);
  return (
    <div style={{ position: "absolute", left: x, top: y, width, display: "flex", gap: layout.portrait ? 28 : 40, alignItems: "flex-start", flexDirection: layout.portrait ? "column" : "row" }}>
      <div style={{ display: "flex", gap: layout.portrait ? 28 : 24, flex: 1, minWidth: 0 }}>
        <div style={{ width: 6, borderRadius: 3, background: `linear-gradient(${color}, ${COLORS.accent})`, transform: `scaleY(${bar})`, transformOrigin: "top", boxShadow: `0 0 18px ${color}88` }} />
        <div style={{ display: "flex", flexDirection: "column", gap: layout.portrait ? 18 : 10, minWidth: 0 }}>
          <div style={tagRise}>
            <Tag color={color} size={tagSize}>{tag}</Tag>
          </div>
          <div
            style={{
              ...titleRise,
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: titleSize,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              color: COLORS.text,
            }}
          >
            {title}
          </div>
          {subtitleItems.length > 0 && (
            <div style={{ ...subtitleRise, fontFamily: FONTS.text, fontSize: subtitleSize, lineHeight: 1.3, color: COLORS.textSecondary }}>
              <Swap items={subtitleItems} />
            </div>
          )}
          {children && <div style={extraRise}>{children}</div>}
        </div>
      </div>
      {aside}
    </div>
  );
};

/** Malý čip (např. krok nebo vlastnost). */
export const Chip: React.FC<{ children: React.ReactNode; color?: string; active?: boolean; size?: number; style?: React.CSSProperties }> = ({
  children, color = COLORS.accent, active = true, size = 22, style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.45,
      padding: `${size * 0.45}px ${size * 0.8}px`,
      borderRadius: 14,
      background: active ? `${color}1f` : "rgba(255,255,255,0.04)",
      border: `1px solid ${active ? `${color}66` : COLORS.border}`,
      color: active ? COLORS.text : COLORS.textMuted,
      fontFamily: FONTS.text,
      fontSize: size,
      fontWeight: 500,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);
