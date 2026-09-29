import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Screen } from "../components/Frames";
import { Chip, LowerThird } from "../components/LowerThird";
import type { Shot } from "../components/ShotStack";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { SCENES } from "../timeline";
import { COLORS } from "../theme";

// 0:14,5–0:21,5 – tři nástroje v akci; zvýrazněný štítek „Lokálně“.
const QR_AT = 0;
const COMPRESS_AT = 78;
const PASSWORD_AT = 148;

const SHIELD = (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ToolsAction: React.FC = () => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const t = TEXTS.toolsAction;
  const shots: Shot[] = layout.portrait
    ? [
        { capture: "mobile/m-tool-qr", from: QR_AT, stepEvery: 7, stepDelay: 16, scroll: [0, 260], scrollFrames: [50, 80] },
        { capture: "mobile/m-tool-compress", from: 100, scroll: [0, 620], scrollFrames: [8, 70], highlights: [{ x: 33, y: 912, w: 324, h: 131, at: 60 }] },
      ]
    : [
        {
          capture: "desktop/tool-qr",
          from: QR_AT,
          stepEvery: 5,
          stepDelay: 16,
          scroll: [0, 330],
          scrollFrames: [52, 76],
          url: "vevit.cz/tools/qr-generator",
          highlights: [{ x: 414, y: 148, w: 66, h: 25, at: 10, radius: 8 }],
        },
        {
          capture: "desktop/tool-compress",
          from: COMPRESS_AT,
          scroll: [0, 330],
          scrollFrames: [6, 36],
          url: "vevit.cz/tools/pdf-compress",
          highlights: [{ x: 448, y: 842, w: 704, h: 78, at: 34 }],
        },
        {
          capture: "desktop/tool-password",
          from: PASSWORD_AT,
          zoom: [1, 1.12],
          focus: [800, 380],
          url: "vevit.cz/tools/password-gen",
          highlights: [{ x: 512, y: 320, w: 538, h: 44, at: 12, radius: 10 }],
        },
      ];
  const starts = layout.portrait ? [QR_AT, 100] : [QR_AT, COMPRESS_AT, PASSWORD_AT];
  const labels = t.labels.slice(0, starts.length);
  const active = starts.reduce((current, start, index) => (frame >= start ? index : current), 0);
  return (
    <AbsoluteFill>
      <Screen shots={shots} duration={SCENES.toolsAction} />
      <LowerThird
        tag={t.tag}
        color={COLORS.accent}
        title={t.title}
        subtitle={t.subtitle}
        aside={
          <div style={{ display: "flex", flexDirection: layout.portrait ? "row" : "column", gap: 12, alignSelf: layout.portrait ? "stretch" : "center", paddingLeft: layout.portrait ? 34 : 0, flexWrap: "wrap" }}>
            {labels.map((label, index) => (
              <Chip key={label} active={index === active} size={layout.portrait ? 24 : 22}>
                <span style={{ color: index === active ? COLORS.accent : COLORS.textMuted, display: "flex" }}>{SHIELD}</span>
                {label}
              </Chip>
            ))}
          </div>
        }
      />
    </AbsoluteFill>
  );
};
