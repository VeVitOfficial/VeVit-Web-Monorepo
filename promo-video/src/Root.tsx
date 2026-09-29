import { Composition, staticFile, type CalculateMetadataFunction } from "remotion";
import { loadBrandFonts } from "./fonts";
import { Promo, type PromoProps } from "./Promo";
import { TOTAL_FRAMES } from "./timeline";
import { FPS } from "./theme";

loadBrandFonts();

// Hudba je volitelná: když v public/ leží music.mp3, přidá se jako podkres.
const calculateMetadata: CalculateMetadataFunction<PromoProps> = async ({ props }) => {
  let hasMusic = false;
  try {
    const response = await fetch(staticFile("music.mp3"), { method: "HEAD" });
    hasMusic = response.ok && (response.headers.get("content-type") ?? "").includes("audio");
  } catch {
    hasMusic = false;
  }
  return { props: { ...props, hasMusic } };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Promo"
      component={Promo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ hasMusic: false }}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="PromoVertical"
      component={Promo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ hasMusic: false }}
      calculateMetadata={calculateMetadata}
    />
  </>
);
