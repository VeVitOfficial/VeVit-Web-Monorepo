// Délky scén ve snímcích (30 fps). Přechody se překrývají, takže celková
// délka = součet scén − (počet přechodů × TRANSITION).
export const SCENES = {
  hook: 135,
  intro: 165,
  tools: 180,
  toolsAction: 210,
  edu: 195,
  ai: 180,
  services: 300,
  account: 240,
  space: 255,
  art: 225,
  outro: 300,
} as const;

export const TRANSITION = 15;

export const TOTAL_FRAMES =
  Object.values(SCENES).reduce((sum, frames) => sum + frames, 0) - TRANSITION * (Object.keys(SCENES).length - 1);
