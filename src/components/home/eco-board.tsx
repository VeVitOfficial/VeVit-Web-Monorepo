"use client";

// 3D základní deska: Account je procesor uprostřed, každá aplikace k němu má vlastní linku (trasu).
// Všechny „součástky" jsou CSS 3D kvádry; ventilátor a LED displej se animují v rAF smyčce.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SCENE_APPS, appById, appHref, type AppId } from "./scene-data";
import { SceneIcon } from "./scene-icon";
import { sceneStrings } from "./scene-i18n";
import { BoardExtras } from "./board-extras";
import { initials, useSessionUser, type SessionUser } from "./use-session-user";

const mix = (c: string, p: number, w: string) => `color-mix(in srgb, ${c} ${p}%, ${w})`;

interface Mat {
  t: string;
  f?: string;
  s: string;
  l?: string;
  r?: string;
  bd?: string;
}

const M = {
  chip: { t: "#1b1f1d", s: "#0e1110", bd: "1px solid rgb(255 255 255 / .07)" } as Mat,
  socket: { t: "#232826", s: "#141816", bd: "1px solid rgb(255 255 255 / .1)" } as Mat,
  metal: { t: "#a7aeb2", f: "#7d8488", s: "#646b6f", bd: "1px solid rgb(255 255 255 / .3)" } as Mat,
  gold: { t: "#c9a227", s: "#8f731b" } as Mat,
  ram: { t: "#2c3833", f: "#1e2824", s: "#18201c", bd: "1px solid rgb(255 255 255 / .1)" } as Mat,
  app: (c: string): Mat => ({ t: mix(c, 16, "#171a19"), f: mix(c, 45, "#0c0c0c"), s: mix(c, 30, "#0a0a0a"), bd: `1px solid ${mix(c, 60, "transparent")}` }),
  solid: (c: string): Mat => ({ t: c, f: mix(c, 72, "#000"), s: mix(c, 55, "#000") }),
  book: (c: string): Mat => ({ t: mix(c, 50, "#161616"), f: "#e2ddd0", r: "#d4cebf", s: mix(c, 60, "#000"), bd: `1px solid ${mix(c, 70, "transparent")}` }),
};

interface LabelSpec {
  app: AppId;
  iconSize: number;
  fs: number;
  pad: number;
  align: string;
  justify: string;
}

interface Box {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  m: Mat;
  rz: number;
  label?: LabelSpec;
  port?: boolean;
  slot?: boolean;
}

interface Disc {
  x: number;
  y: number;
  s: number;
  z: number;
  bg: string;
  bd: string;
  content?: ReactNode;
  fg?: string;
  fan?: boolean;
}

interface Module {
  boxes: Box[];
  discs: Disc[];
}

const box = (x: number, y: number, z: number, w: number, d: number, h: number, m: Mat, ex?: Partial<Box>): Box => ({ x, y, z, w, d, h, m, rz: 0, ...ex });

const cyl = (cx: number, cy: number, z: number, r: number, h: number, side: string, top: string, ex?: Partial<Disc>): Disc[] => {
  const out: Disc[] = [];
  for (let k = 0; k < h; k += 3) out.push({ x: cx - r, y: cy - r, s: r * 2, z: z + k, bg: side, bd: "0 solid transparent" });
  out.push({ x: cx - r, y: cy - r, s: r * 2, z: z + h, bg: top, bd: "1px solid rgb(255 255 255 / .18)", ...ex });
  return out;
};

const metalDisc = (cx: number, cy: number, r: number, z: number): Disc => ({
  x: cx - r, y: cy - r, s: r * 2, z, bg: "radial-gradient(circle at 35% 30%, #d5dadd, #7d8488 70%)", bd: "1px solid rgb(0 0 0 / .4)",
});

const lbl = (app: AppId, ex?: Partial<LabelSpec>): LabelSpec => ({ app, iconSize: 22, fs: 17, pad: 14, align: "space-between", justify: "start", ...ex });

const C = Object.fromEntries(SCENE_APPS.map((a) => [a.id, a.color])) as Record<AppId, string>;

function buildMods(): { mods: Record<AppId, Module>; decor: Module } {
  const mods = {} as Record<AppId, Module>;
  mods.account = { boxes: [
    box(650, 180, 0, 300, 300, 8, M.socket),
    box(690, 220, 8, 220, 220, 20, M.app(C.account), { label: lbl("account", { iconSize: 34, fs: 28, align: "center", justify: "center", pad: 20 }) }),
    box(656, 186, 8, 22, 22, 14, M.metal), box(922, 186, 8, 22, 22, 14, M.metal), box(656, 452, 8, 22, 22, 14, M.metal), box(922, 452, 8, 22, 22, 14, M.metal),
  ], discs: [] };
  mods.tools = { boxes: [
    box(140, 160, 0, 180, 120, 22, M.app(C.tools), { label: lbl("tools") }),
    box(150, 292, 0, 124, 28, 8, M.chip),
    ...[0, 1, 2, 3, 4, 5].map((i) => box(157 + i * 19, 297, 8, 10, 12, 6 + (i % 2) * 4, M.solid(C.tools))),
  ], discs: [] };
  mods.games = { boxes: [
    box(370, 252, 0, 250, 16, 8, M.chip),
    box(370, 130, 8, 250, 120, 24, M.app(C.games), { label: lbl("games") }),
  ], discs: [
    { x: 512, y: 142, s: 96, z: 32.5, bg: "#101010", bd: `2px solid ${mix(C.games, 70, "transparent")}` },
    { x: 518, y: 148, s: 84, z: 33, bg: `repeating-conic-gradient(${mix(C.games, 75, "#000")} 0 22deg, #151515 22deg 45deg)`, bd: "0 solid transparent", fan: true },
    metalDisc(560, 190, 12, 34),
  ] };
  mods.edu = { boxes: [
    box(150, 500, 0, 180, 120, 16, M.book(C.edu), { rz: -3 }),
    box(156, 504, 16, 172, 112, 16, M.book(mix(C.edu, 70, "#fff")), { rz: 4 }),
    box(160, 507, 32, 166, 106, 16, M.book(C.edu), { rz: -1, label: lbl("edu") }),
  ], discs: [] };
  mods.search = { boxes: [box(360, 520, 0, 140, 120, 10, M.app(C.search))],
    discs: cyl(430, 580, 10, 48, 24, mix(C.search, 35, "#0c0c0c"), "radial-gradient(circle at 35% 30%, #2c2c36, #07070a 70%)", { bd: `6px solid ${C.search}`, content: <SceneIcon name="search" size={30} />, fg: "#f0f0f0" }) };
  mods.office = { boxes: [
    box(1066, 186, 0, 16, 70, 14, M.gold),
    box(1080, 176, 6, 226, 90, 6, M.solid(mix(C.office, 40, "#121212"))),
    box(1090, 184, 13, 112, 74, 10, M.app(C.office), { label: lbl("office", { fs: 15, pad: 10 }) }),
    box(1212, 192, 13, 40, 58, 5, M.chip), box(1258, 192, 13, 40, 58, 5, M.chip),
  ], discs: [metalDisc(1294, 221, 8, 12.5)] };
  mods.mail = { boxes: [box(1330, 150, 0, 150, 130, 54, M.app(C.mail), { label: lbl("mail"), port: true })], discs: [] };
  mods.services = { boxes: [
    box(1325, 505, 0, 150, 130, 8, M.app(C.services)),
    box(1325, 505, 26, 150, 130, 8, M.app(C.services)),
    box(1329, 509, 8, 8, 8, 44, M.metal), box(1463, 509, 8, 8, 8, 44, M.metal), box(1329, 623, 8, 8, 8, 44, M.metal), box(1463, 623, 8, 8, 8, 44, M.metal),
    box(1325, 505, 52, 150, 130, 8, M.app(C.services), { label: lbl("services") }),
  ], discs: [] };
  mods.store = { boxes: [box(1100, 515, 0, 150, 130, 36, M.app(C.store), { label: lbl("store"), slot: true })], discs: [] };

  const decor: Module = { boxes: [], discs: [] };
  for (let i = 0; i < 6; i++) decor.boxes.push(box(672 + i * 44, 126, 0, 34, 34, 24, M.chip));
  [975, 1015].forEach((x) => decor.boxes.push(box(x, 180, 0, 24, 300, 10, M.socket), box(x + 4, 186, 10, 16, 288, 42, M.ram)));
  decor.boxes.push(box(40, 36, 0, 300, 70, 80, M.metal));
  [[420, 330], [452, 330], [1150, 340], [1182, 340], [560, 430], [1100, 440]].forEach(([x, y]) => decor.boxes.push(box(x, y, 0, 24, 16, 4, M.chip)));
  decor.boxes.push(box(510, 548, 0, 580, 152, 10, M.chip));
  [[625, 520], [625, 556], [600, 150], [640, 150]].forEach(([x, y]) => { decor.discs.push(...cyl(x, y, 0, 13, 27, "#2d3150", "radial-gradient(circle, #9aa0a6 0 30%, #5f6570 31%)")); });
  decor.discs.push(...cyl(300, 690, 0, 28, 6, "#8d9498", "radial-gradient(circle at 35% 30%, #e1e5e8, #8d9498 75%)"));
  [[30, 30], [1570, 30], [30, 750], [1570, 750], [800, 140]].forEach(([x, y]) => decor.discs.push(metalDisc(x, y, 10, 1)));
  return { mods, decor };
}

const ENDS: Record<Exclude<AppId, "account">, [[number, number], [number, number]]> = {
  tools: [[690, 300], [320, 220]], games: [[690, 250], [620, 200]], edu: [[690, 400], [322, 560]], search: [[690, 430], [430, 520]],
  office: [[910, 250], [1066, 221]], mail: [[910, 300], [1330, 215]], services: [[910, 400], [1325, 570]], store: [[910, 430], [1175, 515]],
};
const SILK: Record<AppId, [number, number, string]> = {
  account: [660, 490, "vevit.cz/account"], tools: [140, 332, "vevit.cz/tools"], games: [370, 296, "www.vevit.fun"], edu: [150, 634, "vevit.cz/edu"],
  search: [360, 652, "Search · search.vevit.cz"], office: [1080, 276, "Office · desktop"], mail: [1330, 290, "mail.vevit.cz"],
  services: [1325, 648, "services.vevit.cz"], store: [1100, 656, "vevit.cz/store"],
};

// Střed modulu ve světě (x) – na úzkých displejích na něj „kamera" najede.
const FOCUS: Record<AppId, number> = {
  account: 1000, tools: 430, games: 695, edu: 440, search: 630, office: 1390, mail: 1605, services: 1600, store: 1375,
};

/** Kolik světa (šířka × výška) je vidět podle šířky boxu: telefon / tablet / desktop. */
function viewFor(width: number) {
  if (width < 640) return { W: 820, H: 840 };
  if (width < 1100) return { W: 1500, H: 940 };
  return { W: 2000, H: 1100 };
}

function route(p: [number, number], q: [number, number], off: number): string {
  const [ax, ay] = p;
  const [bx, by] = q;
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const y1 = ay + off;
    const y2 = by + off;
    if (y1 === y2) return `M${ax} ${y1}H${bx}`;
    const k = Math.abs(y2 - y1);
    const s = Math.sign(dx);
    const mx = (ax + bx) / 2;
    return `M${ax} ${y1}H${mx - (s * k) / 2}L${mx + (s * k) / 2} ${y2}H${bx}`;
  }
  const x1 = ax + off;
  const x2 = bx + off;
  if (x1 === x2) return `M${x1} ${ay}V${by}`;
  const k = Math.abs(x2 - x1);
  const s = Math.sign(dy);
  const my = (ay + by) / 2;
  return `M${x1} ${ay}V${my - (s * k) / 2}L${x2} ${my + (s * k) / 2}V${by}`;
}

function buildOuter() {
  const O: Array<{ d: string; stroke: string; w: number; vx: number; vy: number }> = [];
  const fg = "rgb(var(--fg-rgb) / .1)";
  const mixc = (c: string) => `color-mix(in srgb, ${c} 55%, transparent)`;
  const col: Record<number, string> = { 380: "#41983e", 720: "#966ac8" };
  const colR: Record<number, string> = { 375: "oklch(0.64 0.1 190)", 730: "#3195b9" };
  const colT: Record<number, string> = { 695: "#d06639", 1420: "oklch(0.62 0.12 268)" };
  const colB: Record<number, string> = { 630: "#ca4978", 1375: "#9f418c" };
  const find = (o: Record<number, string>, v: number, tol: number) => { const k = Object.keys(o).find((q) => Math.abs(Number(q) - v) < tol); return k ? o[Number(k)] : undefined; };
  for (let y = 230, i = 0; y <= 880; y += 50, i++) {
    const s = i % 2 ? 1 : -1;
    const cl = find(col, y, 25);
    const cr = find(colR, y, 25);
    O.push({ d: `M330 ${y}H${150 - (i % 3) * 20}l-40 ${s * 40}H0`, stroke: cl ? mixc(cl) : fg, w: cl ? 2.5 : 1.5, vx: 150 - (i % 3) * 20 - 40 - 30 * (i % 2), vy: y + s * 40 });
    O.push({ d: `M1670 ${y}H${1850 + (i % 3) * 20}l40 ${-s * 40}H2000`, stroke: cr ? mixc(cr) : fg, w: cr ? 2.5 : 1.5, vx: 1850 + (i % 3) * 20 + 40 + 30 * (i % 2), vy: y - s * 40 });
  }
  for (let x = 300, i = 0; x <= 1700; x += 70, i++) {
    const s = i % 2 ? 1 : -1;
    const ct = find(colT, x, 35);
    const cb = find(colB, x, 35);
    O.push({ d: `M${x} 260V${110 - (i % 3) * 15}l${s * 36} -36V0`, stroke: ct ? mixc(ct) : fg, w: ct ? 2.5 : 1.5, vx: x + s * 36, vy: 110 - (i % 3) * 15 - 36 - 20 });
    O.push({ d: `M${x} 840V${990 + (i % 3) * 15}l${-s * 36} 36V1100`, stroke: cb ? mixc(cb) : fg, w: cb ? 2.5 : 1.5, vx: x - s * 36, vy: 990 + (i % 3) * 15 + 36 + 20 });
  }
  return O;
}

const { mods, decor } = buildMods();
const outer = buildOuter();

const FINGERS: number[] = [];
for (let x = 560; x <= 1032; x += 12) FINGERS.push(x);

function BoxView({ b, color, on, name, status, user }: { b: Box; color?: string; on: boolean; name?: string; status?: string; user?: SessionUser | null }) {
  const { m } = b;
  const border = b.label && on && color ? `2px solid ${color}` : m.bd ?? "0 solid transparent";
  const L = b.label;
  return (
    <div className="hs-b" style={{ left: b.x, top: b.y, width: b.w, height: b.d, transform: `translateZ(${b.z}px) rotateZ(${b.rz}deg)` }}>
      <div className="hs-bf" style={{ left: 0, top: 0, width: b.w, height: b.h, transformOrigin: "50% 0", transform: "rotateX(90deg)", background: m.s }} />
      <div className="hs-bf" style={{ left: 0, top: 0, width: b.h, height: b.d, transformOrigin: "0 50%", transform: "rotateY(-90deg)", background: m.l ?? m.s }} />
      <div className="hs-bf" style={{ left: b.w - b.h, top: 0, width: b.h, height: b.d, transformOrigin: "100% 50%", transform: "rotateY(90deg)", background: m.r ?? m.s }} />
      <div className="hs-bf" style={{ left: 0, top: b.d - b.h, width: b.w, height: b.h, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: m.f ?? m.s }}>
        {b.port && (
          <>
            <div style={{ position: "absolute", left: 34, top: 9, width: 82, height: 36, boxSizing: "border-box", background: "#050505", border: "2px solid #8a9095", borderRadius: 2 }}>
              <div style={{ position: "absolute", left: 8, right: 8, top: 3, height: 7, background: "repeating-linear-gradient(90deg, #c9a227 0 3px, transparent 3px 8px)" }} />
            </div>
            <div style={{ position: "absolute", left: 12, bottom: 8, width: 12, height: 6, background: "#3fd496" }} />
            <div style={{ position: "absolute", right: 12, bottom: 8, width: 12, height: 6, background: "#dd9815" }} />
          </>
        )}
        {b.slot && <div style={{ position: "absolute", left: 30, right: 30, top: 13, height: 8, borderRadius: 4, background: "#050505" }} />}
      </div>
      <div className="hs-bf" style={{ left: 0, top: 0, width: b.w, height: b.d, transform: `translateZ(${b.h}px)`, background: m.t, border }}>
        {L && color && (
          <div style={{ position: "absolute", inset: 0, padding: L.pad, display: "grid", alignContent: L.align, justifyItems: L.justify, gap: 6, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 14, right: 14, height: 3, borderRadius: "0 0 3px 3px", background: color }} />
            {L.app === "account" && user ? (
              <span className="hs-avatar" style={{ width: L.iconSize * 1.9, height: L.iconSize * 1.9, borderColor: color, fontSize: L.iconSize * 0.7 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name)}
              </span>
            ) : (
              <span style={{ display: "grid", color }}><SceneIcon name={appById(L.app)?.icon ?? "user"} size={L.iconSize} /></span>
            )}
            <span style={{ display: "grid", gap: 5, justifyItems: L.justify }}>
              <span style={{ font: `600 ${L.fs}px/1.05 var(--font-plex-sans), system-ui, sans-serif`, letterSpacing: "-.01em", color: "#f0f0f0", whiteSpace: "nowrap" }}>{name}</span>
              <span style={{ font: "400 12px/1 var(--font-plex-mono), ui-monospace, monospace", color: "#9ca3af", whiteSpace: "nowrap", maxWidth: b.w - 2 * L.pad, overflow: "hidden", textOverflow: "ellipsis" }}>{L.app === "account" && user ? user.name : status}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function EcoBoard({ locale }: { locale: string }) {
  const S = sceneStrings(locale);
  const user = useSessionUser();
  const [sel, setSel] = useState<AppId>("account");
  const [width, setWidth] = useState(2000);
  const [panX, setPanX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ on: false, moved: false, x: 0, base: 0, just: false });
  const selRef = useRef<AppId>("account");
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fanRef = useRef<HTMLDivElement | null>(null);
  const pulse = useRef<Partial<Record<AppId, SVGPathElement | null>>>({});
  const disp = useRef({ hover: false, touched: false, t0: 0, clock: 0, lastText: "", mask: null as Uint8Array | null });

  const select = useCallback((id: AppId) => {
    if (drag.current.just) return;
    setPanX(0);
    selRef.current = id;
    disp.current.touched = true;
    disp.current.t0 = disp.current.clock;
    setSel(id);
  }, []);

  const open = useCallback((id: AppId) => {
    const a = appById(id);
    if (a) window.location.href = appHref(a, locale);
  }, [locale]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const cols = 134;
    const rows = 30;
    const P = 8;
    const Q = 6;

    const maskFor = (text: string) => {
      const d = disp.current;
      if (d.lastText === text && d.mask) return d.mask;
      const cv = document.createElement("canvas");
      cv.width = cols;
      cv.height = rows;
      const ctx = cv.getContext("2d");
      const m = new Uint8Array(cols * rows);
      if (ctx) {
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let fs = 20;
        do {
          ctx.font = `700 ${fs}px "IBM Plex Sans", system-ui, sans-serif`;
          fs -= 1;
        } while (fs > 9 && ctx.measureText(text).width > cols - 8);
        ctx.fillText(text, cols / 2, rows / 2 + 1);
        const data = ctx.getImageData(0, 0, cols, rows).data;
        for (let i = 0; i < cols * rows; i++) m[i] = data[i * 4 + 3] > 100 ? 1 : 0;
      }
      d.lastText = text;
      d.mask = m;
      return m;
    };

    const draw = () => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      const d = disp.current;
      const app = appById(selRef.current) ?? SCENE_APPS[0];
      const text = `${app.live ? S.open + " " + app.name : S.notify}  →`;
      const m = maskFor(text);
      const t = reduce ? 2 : d.clock;
      ctx.fillStyle = "#080a09";
      ctx.fillRect(0, 0, cv.width, cv.height);
      const sx = d.touched ? (d.clock - d.t0) * 190 : -1;
      const hov = d.hover ? 1 : 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * P + 1;
          const y = r * P + 1;
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#0f1311";
          ctx.fillRect(x, y, Q, Q);
          const ph = (c + r * 1.4) / cols;
          const v = Math.sin(Math.PI * 2 * (ph * 1.15 - t * 0.42));
          const w = v > 0.78 ? (v - 0.78) / 0.22 : 0;
          let b = 0;
          let col = "#3fd496";
          if (!d.touched) b = w * 0.9;
          else if (c < sx - 3) {
            if (m[r * cols + c]) { b = 1; col = hov ? "#ffffff" : app.color; } else b = w * (0.06 + hov * 0.1);
          } else if (c < sx) { b = 0.85; col = "#e8fff4"; } else b = w * 0.06;
          if (b > 0.01) {
            ctx.globalAlpha = Math.min(1, b);
            ctx.fillStyle = col;
            ctx.fillRect(x, y, Q, Q);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const d = disp.current;
      d.clock += dt;
      const cur = selRef.current;
      SCENE_APPS.forEach((a) => {
        const p = pulse.current[a.id];
        if (p) p.style.strokeDashoffset = (-(reduce ? 0 : d.clock) * (a.id === cur ? 140 : 50)).toFixed(1);
      });
      if (fanRef.current && !reduce) fanRef.current.style.transform = `translateZ(33px) rotate(${((d.clock * 220) % 360).toFixed(1)}deg)`;
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    document.fonts?.ready.then(() => { disp.current.lastText = ""; });
    return () => cancelAnimationFrame(raf);
  }, [S.open, S.notify]);

  const { W, H } = viewFor(width);
  const scale = width / W;
  const clampCam = (x: number) => Math.min(2000 - W / 2, Math.max(W / 2, x));
  const camX = clampCam(FOCUS[sel] + panX);
  const tx = width / 2 - camX * scale;
  const ty = (-(1100 - H) / 2) * scale;
  const zoomed = W < 2000;

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!zoomed || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { on: true, moved: false, x: e.clientX, base: camX - FOCUS[sel], just: false };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) setPanX(clampCam(FOCUS[sel] + d.base - dx / scale) - FOCUS[sel]);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d.on) return;
    d.on = false;
    setDragging(false);
    if (d.moved) {
      d.just = true;
      setTimeout(() => { d.just = false; }, 0);
    }
  };

  const cur = appById(sel) ?? SCENE_APPS[0];
  const all = sel === "account";
  const traces = SCENE_APPS.filter((a) => a.id !== "account").map((a) => {
    const [p, q] = ENDS[a.id as Exclude<AppId, "account">];
    const on = a.id === sel;
    return { app: a, d: route(p, q, 0), busA: route(p, q, -10), busB: route(p, q, 10), mixPct: on ? 95 : 45, w: on ? 4 : 2.5, pulseOpacity: on || all ? 1 : 0.35, vx: q[0], vy: q[1] };
  });

  const groups = [
    ...SCENE_APPS.map((a) => ({ key: a.id, id: a.id as AppId | null, mod: mods[a.id] })),
    { key: "decor", id: null as AppId | null, mod: decor },
  ];

  return (
    <div className="hs-board-section">
      <div
        ref={wrapRef}
        className={`hs-board${zoomed ? " is-zoomed" : ""}`}
        style={{ height: Math.round(H * scale) }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div
          className="hs-board-world"
          style={{
            transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${scale.toFixed(4)})`,
            transition: zoomed && !dragging ? "transform 600ms var(--ease)" : "none",
          }}
        >
          <svg width="2000" height="1100" viewBox="0 0 2000 1100" className="hs-board-outer" aria-hidden="true">
            {outer.map((o, i) => (
              <g key={i}>
                <path d={o.d} fill="none" style={{ stroke: o.stroke, strokeWidth: o.w, strokeLinejoin: "round" }} />
                <circle cx={o.vx} cy={o.vy} r={4} style={{ fill: "var(--bg)", stroke: o.stroke, strokeWidth: 1.5 }} />
              </g>
            ))}
          </svg>
          <div className="hs-pcb">
            <div className="hs-pcb-base" />
            <svg width="1600" height="780" viewBox="0 0 1600 780" className="hs-pcb-traces" aria-hidden="true">
              {FINGERS.map((x) => <rect key={x} x={x} y={744} width={8} height={30} rx={1} style={{ fill: "#b8952a" }} />)}
              {traces.map((t) => (
                <g key={t.app.id}>
                  <path d={t.busA} fill="none" style={{ stroke: "rgb(255 255 255 / .08)", strokeWidth: 2, strokeLinejoin: "round" }} />
                  <path d={t.busB} fill="none" style={{ stroke: "rgb(255 255 255 / .08)", strokeWidth: 2, strokeLinejoin: "round" }} />
                  <path d={t.d} fill="none" style={{ stroke: mix(t.app.color, t.mixPct, "transparent"), strokeWidth: t.w, strokeLinejoin: "round" }} />
                  <path ref={(el) => { pulse.current[t.app.id] = el; }} d={t.d} fill="none" style={{ stroke: t.app.color, strokeWidth: 4, strokeLinecap: "round", strokeDasharray: "14 110", opacity: t.pulseOpacity }} />
                  <circle cx={t.vx} cy={t.vy} r={5} style={{ fill: "#0f1a15", stroke: t.app.color, strokeWidth: 2 }} />
                </g>
              ))}
              <path d="M800 440V548" fill="none" style={{ stroke: "rgb(255 255 255 / .08)", strokeWidth: 2 }} />
              <path d="M800 440V548" fill="none" style={{ stroke: mix("#3fd496", 80, "transparent"), strokeWidth: 4 }} />
            </svg>

            {SCENE_APPS.map((a) => {
              const [x, y, t] = SILK[a.id];
              return <div key={a.id} className="hs-silk" style={{ left: x, top: y, color: a.id === sel ? "#f0f0f0" : "#8b94a3" }}>{t}</div>;
            })}

            {groups.map((g) => {
              const on = g.id === sel;
              const a = g.id ? appById(g.id) : undefined;
              return (
                <div
                  key={g.key}
                  className="hs-mod"
                  style={{ transform: `translateZ(${on ? 14 : 0}px)`, cursor: g.id ? "pointer" : "default", pointerEvents: g.id ? undefined : "none" }}
                  onClick={g.id ? () => select(g.id as AppId) : undefined}
                  onDoubleClick={g.id ? () => open(g.id as AppId) : undefined}
                >
                  {g.mod.boxes.map((b, i) => <BoxView key={i} b={b} on={on} color={a?.color} name={a?.name} status={a ? S.status[a.status] : undefined} user={user} />)}
                  {g.mod.discs.map((d, i) => (
                    <div
                      key={i}
                      ref={d.fan ? fanRef : undefined}
                      className="hs-disc"
                      style={{ left: d.x, top: d.y, width: d.s, height: d.s, transform: `translateZ(${d.z}px)`, background: d.bg, border: d.bd, color: d.fg ?? "inherit" }}
                    >{d.content}</div>
                  ))}
                </div>
              );
            })}

            <BoardExtras locale={locale} />

            <div className="hs-display">
              <button
                type="button"
                aria-label={cur.live ? `${S.open} ${cur.name}` : S.notify}
                onClick={() => open(cur.id)}
                onPointerEnter={() => { disp.current.hover = true; }}
                onPointerLeave={() => { disp.current.hover = false; }}
              >
                <canvas ref={canvasRef} width={1072} height={240} style={{ width: 536, height: 120, display: "block" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {zoomed && (
        <div className="hs-board-apps" role="toolbar" aria-label={S.boardTitle}>
          {SCENE_APPS.map((a) => (
            <button key={a.id} type="button" aria-pressed={a.id === sel} onClick={() => select(a.id)} style={{ ["--c" as string]: a.color }}>
              <span className="hs-dot" style={{ background: a.color }} />{a.name}
            </button>
          ))}
        </div>
      )}
      <div className="hs-board-caption">
        <span className="hs-board-name"><span className="hs-dot" style={{ background: cur.color }} /><strong>{cur.name}</strong></span>
        <span className="hs-board-meta">{S.status[cur.status]} · {cur.url}</span>
        <span className="hs-board-text">{S.card[cur.id]}</span>
        {zoomed && <a className="hs-board-open" href={appHref(cur, locale)} style={{ ["--c" as string]: cur.color }}>{cur.live ? `${S.open} ${cur.name}` : S.notify} →</a>}
      </div>
    </div>
  );
}
