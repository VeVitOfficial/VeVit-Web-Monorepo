import { AbsoluteFill, Img, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captureInfo, captureSrc } from "../captures";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS, FONTS } from "../theme";

// 0:00–0:04,5 – tři rychlé střihy skutečného UI a pointa.
const FLASH = 30;

const FLASHES = {
  desktop: [
    { capture: "desktop/tool-merge-files", scroll: 300 },
    { capture: "desktop/edu-python", scroll: 0 },
    { capture: "desktop/svc-detail", scroll: 60 },
  ],
  mobile: [
    { capture: "mobile/m-tool-merge", scroll: 260 },
    { capture: "mobile/m-edu-programming", scroll: 700 },
    { capture: "mobile/m-svc-detail", scroll: 0 },
  ],
} as const;

const Flash: React.FC<{ capture: string; scroll: number; text: string }> = ({ capture, scroll, text }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const layout = useLayout();
  const info = captureInfo(capture);
  const scale = width / info.width;
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const zoom = interpolate(frame, [0, FLASH], [1.04, 1.12]);
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Img src={captureSrc(capture)} style={{ position: "absolute", left: 0, top: -scroll * scale, width, height: info.height * scale }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(13,13,13,0.55), rgba(13,13,13,0.9) 75%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: layout.hook,
            letterSpacing: "-0.035em",
            color: COLORS.text,
            textAlign: "center",
            lineHeight: 1,
            transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
            opacity: pop,
            textShadow: "0 10px 60px rgba(0,0,0,0.8)",
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Punch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const words = TEXTS.hook.punch.split(" ");
  // Pointa zmizí ještě před prolnutím do loga v další scéně.
  const out = SCENES.hook - FLASH * 3;
  const exit = interpolate(frame, [out - 22, out - 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80, opacity: exit, transform: `scale(${interpolate(exit, [0, 1], [1.06, 1])})` }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `0 ${layout.hook * 0.28}px`,
          maxWidth: layout.portrait ? 900 : 1600,
          fontFamily: FONTS.display,
          fontWeight: 800,
          fontSize: layout.hook * 0.9,
          letterSpacing: "-0.035em",
          lineHeight: 1.05,
          textAlign: "center",
        }}
      >
        {words.map((word, index) => {
          const progress = spring({ frame: frame - index * 4, fps, config: { damping: 16, stiffness: 150 } });
          const last = index >= words.length - 2;
          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                opacity: progress,
                transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
                color: last ? COLORS.accent : COLORS.text,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Hook: React.FC = () => {
  const layout = useLayout();
  const flashes = FLASHES[layout.device];
  return (
    <AbsoluteFill>
      {flashes.map((flash, index) => (
        <Sequence key={flash.capture} from={index * FLASH} durationInFrames={FLASH} layout="none">
          <Flash capture={flash.capture} scroll={flash.scroll} text={TEXTS.hook.lines[index]} />
        </Sequence>
      ))}
      <Sequence from={FLASH * 3} layout="none">
        <Punch />
      </Sequence>
    </AbsoluteFill>
  );
};
