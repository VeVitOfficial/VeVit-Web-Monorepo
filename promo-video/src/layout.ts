import { useVideoConfig } from "remotion";

// Rozvržení pro obě verze videa. Na šířku: okno prohlížeče nahoře, titulek pod
// ním. Na výšku (sociální sítě): telefon nahoře, titulek pod ním.
export type Layout = {
  portrait: boolean;
  device: "desktop" | "mobile";
  screen: { x: number; y: number; width: number; contentHeight: number };
  caption: { x: number; y: number; width: number; tag: number; title: number; subtitle: number };
  hook: number;
};

const LANDSCAPE: Layout = {
  portrait: false,
  device: "desktop",
  screen: { x: 240, y: 44, width: 1440, contentHeight: 720 },
  caption: { x: 240, y: 842, width: 1440, tag: 20, title: 64, subtitle: 30 },
  hook: 150,
};

const PORTRAIT: Layout = {
  portrait: true,
  device: "mobile",
  screen: { x: 234, y: 76, width: 612, contentHeight: 1080 },
  caption: { x: 80, y: 1222, width: 920, tag: 24, title: 70, subtitle: 34 },
  hook: 118,
};

export function useLayout(): Layout {
  const { width, height } = useVideoConfig();
  return height > width ? PORTRAIT : LANDSCAPE;
}
