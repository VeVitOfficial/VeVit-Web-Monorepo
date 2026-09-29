import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "../layout";
import { TEXTS } from "../texts";
import { COLORS, FONTS } from "../theme";

// 1:04,5–1:14,5 – závěr s CTA a adresami.
const APP_COLORS: Record<string, string> = {
  Tools: COLORS.tools,
  Edu: COLORS.edu,
  Services: COLORS.services,
  Account: COLORS.account,
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const t = TEXTS.outro;
  const p = layout.portrait;
  const rise = (delay: number) => {
    const progress = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 110 } });
    return { opacity: progress, transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)` };
  };
  const logo = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const glow = 60 + 30 * Math.sin(frame / 8);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: p ? 44 : 30 }}>
        <div
          style={{
            width: p ? 260 : 190,
            height: p ? 260 : 190,
            borderRadius: "50%",
            opacity: logo,
            transform: `scale(${interpolate(logo, [0, 1], [0.7, 1])})`,
            boxShadow: `0 0 ${glow}px rgba(16,185,129,0.45)`,
          }}
        >
          <Img src={staticFile("brand/logo.webp")} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
        </div>
        <div style={{ ...rise(14), fontFamily: FONTS.text, fontSize: p ? 46 : 38, color: COLORS.textSecondary }}>{t.kicker}</div>
        <div
          style={{
            ...rise(20),
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: p ? 170 : 150,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            background: `linear-gradient(100deg, ${COLORS.text} 20%, ${COLORS.accentLight} 60%, ${COLORS.accent})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            paddingBottom: 10,
          }}
        >
          {t.url}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: p ? 900 : 1400 }}>
          {t.apps.map((app, index) => (
            <div
              key={app}
              style={{
                ...rise(40 + index * 6),
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: p ? "16px 26px" : "12px 22px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${APP_COLORS[app]}66`,
                fontFamily: FONTS.text,
                fontWeight: 600,
                fontSize: p ? 34 : 26,
                color: COLORS.text,
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 6, background: APP_COLORS[app], boxShadow: `0 0 12px ${APP_COLORS[app]}` }} />
              {app}
            </div>
          ))}
          <div
            style={{
              ...rise(40 + t.apps.length * 6),
              display: "flex",
              alignItems: "center",
              padding: p ? "16px 26px" : "12px 22px",
              borderRadius: 14,
              border: `1px dashed ${COLORS.games}88`,
              fontFamily: FONTS.text,
              fontSize: p ? 32 : 24,
              color: COLORS.textSecondary,
            }}
          >
            {t.games}
          </div>
        </div>
        <div style={{ ...rise(80), display: "flex", gap: 20, alignItems: "center", fontFamily: FONTS.mono, fontSize: p ? 36 : 30, color: COLORS.text }}>
          <span style={{ color: COLORS.textMuted, fontFamily: FONTS.text, fontSize: p ? 30 : 24 }}>a také</span>
          {t.more.map((url, index) => (
            <span key={url} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {index > 0 && <span style={{ color: COLORS.textMuted }}>·</span>}
              <span style={{ color: index === 0 ? COLORS.space : COLORS.art }}>{url}</span>
            </span>
          ))}
        </div>
        <div style={{ ...rise(100), fontFamily: FONTS.mono, fontSize: p ? 24 : 18, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.textMuted, marginTop: p ? 20 : 8 }}>
          {t.footer}
        </div>
      </div>
    </AbsoluteFill>
  );
};
