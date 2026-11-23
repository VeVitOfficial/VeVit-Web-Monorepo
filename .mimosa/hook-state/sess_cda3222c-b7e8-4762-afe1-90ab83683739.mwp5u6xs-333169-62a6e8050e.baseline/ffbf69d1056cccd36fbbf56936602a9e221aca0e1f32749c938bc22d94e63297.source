// Data aplikací sdílená mezi 3D atomem, 3D deskou, 3D roadmapou a „Připravuje se" stránkami.

export type AppId =
  | "account"
  | "tools"
  | "games"
  | "edu"
  | "mail"
  | "office"
  | "services"
  | "search"
  | "store";

export type AppIcon =
  | "user"
  | "wrench"
  | "gamepad"
  | "graduation"
  | "mail"
  | "file"
  | "layers"
  | "search"
  | "bag";

export type AppStatus = "beta" | "online" | "planned" | "soon";

export interface SceneApp {
  id: AppId;
  name: string;
  color: string;
  status: AppStatus;
  progress: number;
  url: string;
  icon: AppIcon;
  /** Spuštěná aplikace: dvojklik / CTA ji otevře. Ostatní vedou na „Připravuje se". */
  live: boolean;
  /** Cesta (bez locale prefixu) pro spuštěné aplikace, nebo absolutní URL. */
  href: string;
  /** Prstenec a fáze na orbitě atomu. */
  ring: 0 | 1 | 2;
  phase: number;
}

export const SCENE_APPS: readonly SceneApp[] = [
  { id: "account", name: "Account", color: "#b2ae34", status: "beta", progress: 90, url: "vevit.cz/account", icon: "user", live: true, href: "/account", ring: 0, phase: 0.875 },
  { id: "tools", name: "Tools", color: "#41983e", status: "beta", progress: 85, url: "vevit.cz/tools", icon: "wrench", live: true, href: "/tools", ring: 0, phase: 0.125 },
  { id: "games", name: "Games", color: "#d06639", status: "online", progress: 100, url: "www.vevit.fun", icon: "gamepad", live: true, href: "https://www.vevit.fun", ring: 0, phase: 0.375 },
  { id: "edu", name: "Edu", color: "#966ac8", status: "beta", progress: 30, url: "vevit.cz/edu", icon: "graduation", live: true, href: "/edu", ring: 0, phase: 0.625 },
  { id: "mail", name: "Mail", color: "oklch(0.64 0.1 190)", status: "planned", progress: 10, url: "mail.vevit.cz", icon: "mail", live: false, href: "/home/soon/mail", ring: 1, phase: 0.08 },
  { id: "office", name: "Office", color: "oklch(0.62 0.12 268)", status: "soon", progress: 15, url: "Desktop", icon: "file", live: false, href: "/home/soon/office", ring: 1, phase: 0.41 },
  { id: "services", name: "Services", color: "#3195b9", status: "soon", progress: 40, url: "services.vevit.cz", icon: "layers", live: false, href: "/home/soon/services", ring: 1, phase: 0.74 },
  { id: "search", name: "Search", color: "#ca4978", status: "soon", progress: 65, url: "search.vevit.cz", icon: "search", live: false, href: "/home/soon/search", ring: 2, phase: 0.2 },
  { id: "store", name: "Store", color: "#9f418c", status: "planned", progress: 30, url: "vevit.cz/store", icon: "bag", live: false, href: "/home/soon/store", ring: 2, phase: 0.7 },
];

export const SOON_APP_IDS: readonly AppId[] = SCENE_APPS.filter((a) => !a.live).map((a) => a.id);

export const ICON_PATHS: Record<AppIcon | "arrow" | "sparkles", string[]> = {
  wrench: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"],
  gamepad: ["M6 11h4M8 9v4M15 12h.01M18 10h.01", "M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.55-.6-6.58-.69-7.26A4 4 0 0 0 17.32 5z"],
  graduation: ["M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z", "M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"],
  layers: ["m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z", "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"],
  user: ["M7 8a5 5 0 1 0 10 0a5 5 0 1 0-10 0", "M20 21a8 8 0 0 0-16 0"],
  search: ["M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0", "m21 21-4.3-4.3"],
  bag: ["M16 10a4 4 0 0 1-8 0M3.1 6h17.8", "M3.4 5.47a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.67a2 2 0 0 0-.4-1.2l-2-2.67A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"],
  mail: ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"],
  file: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4", "M10 9H8M16 13H8M16 17H8"],
  arrow: ["M5 12h14M13 6l6 6-6 6"],
  sparkles: ["m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"],
};

export function appById(id: string): SceneApp | undefined {
  return SCENE_APPS.find((a) => a.id === id);
}

/** Cíl odkazu aplikace: absolutní URL zůstane, interní cesta dostane locale prefix. */
export function appHref(app: SceneApp, locale: string): string {
  return app.href.startsWith("http") ? app.href : `/${locale}${app.href}`;
}
