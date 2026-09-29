import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../theme";

// Přechod „zelená maska“: přes obraz přejede zelený pás a odkryje další scénu.
type SweepProps = Record<string, never>;

const SweepPresentation: React.FC<TransitionPresentationComponentProps<SweepProps>> = ({
  children, presentationDirection, presentationProgress,
}) => {
  const p = presentationProgress;
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ opacity: 1 - Math.max(0, p - 0.55) / 0.45 }}>{children}</AbsoluteFill>;
  }
  // Příchozí scéna se odkrývá zleva doprava za zeleným pásem.
  const edge = p * 130 - 15; // v procentech šířky
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `polygon(0 0, ${edge}% 0, ${edge - 10}% 100%, 0 100%)` }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `polygon(${edge}% 0, ${edge + 14}% 0, ${edge + 4}% 100%, ${edge - 10}% 100%)`,
          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight})`,
          boxShadow: `0 0 80px ${COLORS.accent}`,
        }}
      />
    </AbsoluteFill>
  );
};

export const sweep = (): TransitionPresentation<SweepProps> => ({ component: SweepPresentation, props: {} });
