"use client";

// Oživení 3D desky: Snake kolem grafiky + Tetris displej (Games), lo-fi studentka s easter eggem (Edu),
// úředník, jehož dokument letí do Mailu a odtud pryč (Office), a opravář u Tools.
// Souřadnice jsou v prostoru .hs-pcb (1600 × 780 px).

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SCENE_APPS, type AppId } from "./scene-data";
import { lofiPlaying, startLofi, stopLofi } from "./lofi";
import { sceneStrings } from "./scene-i18n";

const C = Object.fromEntries(SCENE_APPS.map((a) => [a.id, a.color])) as Record<AppId, string>;

/** rAF smyčka, která běží jen když je prvek ve viewportu. */
function useVisibleLoop(ref: React.RefObject<Element | null>, tick: (dt: number) => void) {
  const tickRef = useRef(tick);
  useEffect(() => { tickRef.current = tick; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let visible = false;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      tickRef.current(reduce ? 0 : dt);
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      last = 0;
      if (visible) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    raf = requestAnimationFrame(loop);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [ref]);
}

/* ---------------- Games: Snake ---------------- */

const SN = { x: 340, y: 100, w: 310, h: 200, cols: 29, rows: 18, cell: 10, ox: 5, oy: 10 };
const RING: Array<[number, number]> = [];
for (let c = 0; c < SN.cols; c++) RING.push([c, 0]);
for (let r = 1; r < SN.rows; r++) RING.push([SN.cols - 1, r]);
for (let c = SN.cols - 2; c >= 0; c--) RING.push([c, SN.rows - 1]);
for (let r = SN.rows - 2; r > 0; r--) RING.push([0, r]);

function SnakeRing() {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ acc: 0, head: 8, len: 6, apple: 30 });
  useVisibleLoop(ref, (dt) => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const s = st.current;
    const N = RING.length;
    s.acc += dt;
    while (s.acc > 0.09) {
      s.acc -= 0.09;
      s.head = (s.head + 1) % N;
      if (s.head === s.apple) {
        s.len += 3;
        s.apple = (s.head + 12 + Math.floor(Math.random() * 50)) % N;
        if (s.len > 48) s.len = 5;
      }
    }
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, SN.w, SN.h);
    const at = (i: number) => {
      const [c, r] = RING[((i % N) + N) % N];
      return [SN.ox + c * SN.cell, SN.oy + r * SN.cell] as const;
    };
    ctx.fillStyle = "rgb(255 255 255 / .05)";
    for (let i = 0; i < N; i++) {
      const [x, y] = at(i);
      ctx.fillRect(x + 4, y + 4, 2, 2);
    }
    const [ax, ay] = at(s.apple);
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath();
    ctx.roundRect(ax + 1, ay + 1, 8, 8, 3);
    ctx.fill();
    ctx.fillStyle = "#3fd496";
    ctx.fillRect(ax + 5, ay - 1, 3, 2);
    for (let k = s.len - 1; k >= 0; k--) {
      const [x, y] = at(s.head - k);
      ctx.globalAlpha = 1 - (k / s.len) * 0.55;
      ctx.fillStyle = k === 0 ? "#ffb08a" : C.games;
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + 0.5, 9, 9, k === 0 ? 3 : 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const [hx, hy] = at(s.head);
    ctx.fillStyle = "#1a0d06";
    ctx.fillRect(hx + 2, hy + 3, 2, 2);
    ctx.fillRect(hx + 6, hy + 3, 2, 2);
  });
  return (
    <canvas
      ref={ref}
      width={SN.w * 2}
      height={SN.h * 2}
      className="hs-fx"
      style={{ left: SN.x, top: SN.y, width: SN.w, height: SN.h, transform: "translateZ(1px)" }}
      aria-hidden="true"
    />
  );
}

/* ---------------- Games: Tetris (autopilot) ---------------- */

const TW = 8;
const TH = 10;
const TC = 8;
const PALETTE = ["#d06639", "#e0a915", "#3fd496", "#378add", "#966ac8", "#ca4978", "#41983e"];
const SHAPES: Array<Array<[number, number]>> = [
  [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2]], [[1, 0], [1, 1], [1, 2], [0, 2]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]],
];

type Cells = Array<[number, number]>;

function norm(cells: Cells): Cells {
  const mx = Math.min(...cells.map((c) => c[0]));
  const my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]);
}
const ROTS: Cells[][] = SHAPES.map((s) => {
  const out: Cells[] = [s];
  for (let i = 1; i < 4; i++) out.push(norm(out[i - 1].map(([x, y]) => [-y, x] as [number, number])));
  return out;
});

interface Piece { kind: number; cells: Cells; x: number; y: number; tx: number }

function fits(grid: number[], cells: Cells, px: number, py: number) {
  return cells.every(([cx, cy]) => {
    const x = px + cx;
    const y = py + cy;
    return x >= 0 && x < TW && y < TH && (y < 0 || grid[y * TW + x] === 0);
  });
}

function plan(grid: number[], kind: number): { cells: Cells; tx: number } {
  let best = { score: -Infinity, cells: ROTS[kind][0], tx: 0 };
  for (const cells of ROTS[kind]) {
    const w = Math.max(...cells.map((c) => c[0])) + 1;
    for (let x = 0; x + w <= TW; x++) {
      let y = -4;
      while (fits(grid, cells, x, y + 1)) y++;
      const g = grid.slice();
      cells.forEach(([cx, cy]) => { if (y + cy >= 0) g[(y + cy) * TW + x + cx] = 1; });
      let lines = 0;
      let holes = 0;
      let agg = 0;
      let bump = 0;
      let prev = -1;
      for (let r = 0; r < TH; r++) if (g.slice(r * TW, r * TW + TW).every(Boolean)) lines++;
      for (let c = 0; c < TW; c++) {
        let h = 0;
        let seen = false;
        for (let r = 0; r < TH; r++) {
          if (g[r * TW + c]) { if (!seen) h = TH - r; seen = true; } else if (seen) holes++;
        }
        agg += h;
        if (prev >= 0) bump += Math.abs(h - prev);
        prev = h;
      }
      const score = lines * 8 - agg * 0.5 - holes * 3.5 - bump * 0.35 - (y < 0 ? 50 : 0) + Math.random() * 0.4;
      if (score > best.score) best = { score, cells, tx: x };
    }
  }
  return best;
}

function TetrisScreen() {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ grid: new Array<number>(TW * TH).fill(0), piece: null as Piece | null, next: 2, acc: 0, score: 0, flash: 0 });
  useVisibleLoop(ref, (dt) => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const s = st.current;
    const spawn = () => {
      const kind = s.next;
      s.next = Math.floor(Math.random() * SHAPES.length);
      const p = plan(s.grid, kind);
      s.piece = { kind, cells: p.cells, x: 3, y: -3, tx: p.tx };
    };
    if (!s.piece) spawn();
    s.flash = Math.max(0, s.flash - dt);
    s.acc += dt;
    while (s.acc > 0.12 && s.piece) {
      s.acc -= 0.12;
      const p = s.piece;
      if (p.x !== p.tx && fits(s.grid, p.cells, p.x + Math.sign(p.tx - p.x), p.y)) p.x += Math.sign(p.tx - p.x);
      if (fits(s.grid, p.cells, p.x, p.y + 1)) { p.y++; continue; }
      let over = false;
      p.cells.forEach(([cx, cy]) => {
        const y = p.y + cy;
        if (y < 0) over = true;
        else s.grid[y * TW + p.x + cx] = p.kind + 1;
      });
      if (over) { s.grid.fill(0); s.score = 0; s.flash = 0.4; }
      for (let r = TH - 1; r >= 0; r--) {
        if (s.grid.slice(r * TW, r * TW + TW).every(Boolean)) {
          s.grid.splice(r * TW, TW);
          s.grid.unshift(...new Array<number>(TW).fill(0));
          s.score += 100;
          s.flash = 0.15;
          r++;
        }
      }
      spawn();
    }
    const W = 210;
    const H = 90;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = "#080a09";
    ctx.fillRect(0, 0, W, H);
    const ox = 10;
    const oy = 5;
    ctx.fillStyle = s.flash > 0 ? "rgb(255 255 255 / .18)" : "#0f1311";
    ctx.fillRect(ox - 2, oy - 2, TW * TC + 4, TH * TC + 4);
    const cell = (x: number, y: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(ox + x * TC + 0.5, oy + y * TC + 0.5, TC - 1, TC - 1); };
    for (let i = 0; i < TW * TH; i++) if (s.grid[i]) cell(i % TW, Math.floor(i / TW), PALETTE[s.grid[i] - 1]);
    const p = s.piece;
    if (p) p.cells.forEach(([cx, cy]) => { if (p.y + cy >= 0) cell(p.x + cx, p.y + cy, PALETTE[p.kind]); });
    ctx.fillStyle = "#3fd496";
    ctx.font = "600 9px ui-monospace, monospace";
    ctx.fillText("TETRIS", 92, 16);
    ctx.fillStyle = "#8b94a3";
    ctx.fillText("SCORE", 92, 34);
    ctx.fillStyle = "#f0f0f0";
    ctx.fillText(String(s.score).padStart(5, "0"), 92, 46);
    ctx.fillStyle = "#8b94a3";
    ctx.fillText("NEXT", 150, 34);
    ROTS[s.next][0].forEach(([cx, cy]) => { ctx.fillStyle = PALETTE[s.next]; ctx.fillRect(152 + cx * 7, 42 + cy * 7, 6, 6); });
  });
  return (
    <div className="hs-fx hs-tetris" style={{ left: 395, top: 8, width: 210, height: 90 }}>
      <canvas ref={ref} width={420} height={180} style={{ width: 210, height: 90, display: "block" }} aria-hidden="true" />
    </div>
  );
}

/* ---------------- Postavičky (billboardy stojící na desce) ---------------- */

function Stand({ x, y, w, h, tilt = 32, children, className, style, ...rest }: {
  x: number; y: number; w: number; h: number; tilt?: number; children: ReactNode; className?: string; style?: CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <div className="hs-stand-shadow" style={{ left: x + w * 0.1, top: y + h - 16, width: w * 0.8, height: 26 }} />
      <div className={`hs-stand ${className ?? ""}`} style={{ left: x, top: y, width: w, height: h, transform: `translateZ(2px) rotateX(${-tilt}deg)`, ...style }} {...rest}>
        {children}
      </div>
    </>
  );
}

function LofiGirl({ locale }: { locale: string }) {
  const S = sceneStrings(locale);
  const [on, setOn] = useState(false);
  useEffect(() => () => { if (lofiPlaying()) stopLofi(); }, []);
  const toggle = () => {
    if (lofiPlaying()) { stopLofi(); setOn(false); } else { startLofi(); setOn(true); }
  };
  return (
    <Stand
      x={-6} y={448} w={160} h={176}
      className={`hs-lofi${on ? " is-on" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label={on ? S.lofiOff : S.lofiOn}
      title={on ? S.lofiOff : "♪"}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
    >
      <svg viewBox="0 0 160 176" width="160" height="176" aria-hidden="true">
        <defs>
          <radialGradient id="hsLamp" cx="50%" cy="0%" r="90%">
            <stop offset="0" stopColor="#ffd58a" stopOpacity=".55" />
            <stop offset="1" stopColor="#ffd58a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* okno s nocí */}
        <rect x="6" y="6" width="104" height="80" rx="4" fill="#1b2140" />
        <circle cx="86" cy="26" r="9" fill="#f4e7b8" />
        <circle cx="82" cy="23" r="9" fill="#1b2140" />
        {[[20, 18], [40, 30], [58, 14], [30, 48], [70, 44], [98, 52]].map(([x, y], i) => <circle key={i} className="hs-star" cx={x} cy={y} r="1.2" fill="#fff" style={{ animationDelay: `${i * 0.4}s` }} />)}
        <path d="M6 86V66h10v-8h8v12h10V54h12v18h8V62h14v24ZM78 86V60h10v10h8V56h14v30Z" fill="#11152b" />
        {[[12, 74], [38, 62], [42, 70], [84, 66], [100, 62], [104, 72]].map(([x, y], i) => <rect key={i} x={x} y={y} width="3" height="3" fill="#ffd58a" opacity=".8" />)}
        <path d="M58 6v80M6 46h104" stroke="#3a3f5c" strokeWidth="3" />
        <rect x="6" y="6" width="104" height="80" rx="4" fill="none" stroke="#3a3f5c" strokeWidth="4" />
        {/* kočka na parapetu */}
        <g className="hs-cat">
          <path d="M118 88c0-14 6-22 13-22s12 8 12 22Z" fill="#6a5548" />
          <path d="M123 70l2-8 5 6M134 68l5-6 1 8" fill="#6a5548" />
          <path className="hs-cat-tail" d="M142 86c8 0 12-6 10-14" fill="none" stroke="#6a5548" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* lampa */}
        <path d="M10 140l18-34" stroke="#55606b" strokeWidth="3" />
        <path d="M18 98l22 6-6 10Z" fill="#e0a915" />
        <path d="M34 112L6 176h70Z" fill="url(#hsLamp)" className="hs-lamp-glow" />
        {/* stůl */}
        <rect x="0" y="140" width="160" height="10" rx="2" fill="#6b4a35" />
        <rect x="6" y="150" width="6" height="26" fill="#4d3527" />
        <rect x="148" y="150" width="6" height="26" fill="#4d3527" />
        {/* knihy + hrnek */}
        <rect x="118" y="124" width="34" height="8" rx="1" fill="#966ac8" />
        <rect x="121" y="116" width="30" height="8" rx="1" fill="#3195b9" />
        <rect x="16" y="128" width="14" height="12" rx="2" fill="#e8e1d2" />
        <path d="M30 131h3a3 3 0 0 1 0 6h-3" fill="none" stroke="#e8e1d2" strokeWidth="2" />
        <path className="hs-steam" d="M21 124c-3-4 3-6 0-10M26 124c-3-4 3-6 0-10" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" strokeLinecap="round" />
        {/* papír */}
        <path d="M38 138l6-8h36l-6 8Z" fill="#f4f1ea" />
        <path className="hs-ink" d="M46 133h22M44 135.5h18" stroke="#6b6f7a" strokeWidth="1" />
        {/* studentka */}
        <g className="hs-girl">
          <path d="M83 82c-2-15 7-26 19-26s21 10 20 25c-1 10 2 19 6 27-9 4-19 2-25-4-5 4-14 6-22 1 4-8 3-15 2-23Z" fill="#4a2c1d" />
          <circle cx="122" cy="64" r="7.5" fill="#4a2c1d" />
          <path d="M116 63l5 7" stroke="#d24b45" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M76 140c-2-20 6-36 24-36s28 16 26 36Z" fill="#966ac8" />
          <path d="M87 106c5-7 21-7 26 0l-4 5c-5-3-13-3-18 0Z" fill="#7a52a8" />
          <g className="hs-head">
            <path d="M94 94h9v12h-9Z" fill="#eec4a4" />
            <ellipse cx="96" cy="84" rx="12.5" ry="13" fill="#f8dcc4" />
            <path d="M82 83c-2-13 7-22 19-22 9 0 15 6 16 13-6-2-11-2-15 1l-3 6-3-5-4 6-2-5-5 8Z" fill="#5a3524" />
            <path d="M101 63c4 0 8 2 10 5" stroke="#7a4a33" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M86.5 88q3 2.2 6 0" stroke="#2b1a12" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M86.6 88l-2-1.2" stroke="#2b1a12" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="91" cy="93" rx="3.2" ry="1.9" fill="#f2a1a1" opacity=".75" />
            <path d="M85 96.5q2 1.2 4 0" stroke="#b5655a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M108 78c1-17-20-21-23-6" fill="none" stroke="#2b2b2b" strokeWidth="3.4" strokeLinecap="round" />
            <rect className="hs-earcup" x="102" y="76" width="12" height="16" rx="5.5" fill="#d24b45" />
            <rect x="105" y="79" width="6" height="10" rx="3" fill="#8f2c28" />
          </g>
          <g className="hs-arm">
            <path d="M88 110c-8 8-14 16-20 24" stroke="#966ac8" strokeWidth="9" strokeLinecap="round" fill="none" />
            <circle cx="66" cy="135" r="4.5" fill="#f8dcc4" />
            <path d="M64 136l-8-10" stroke="#e0a915" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </g>
        {/* noty, když hraje */}
        <g className="hs-notes" fill="#ffd58a">
          <text x="120" y="70" fontSize="14">♪</text>
          <text x="132" y="60" fontSize="11">♫</text>
          <text x="112" y="56" fontSize="10">♪</text>
        </g>
      </svg>
    </Stand>
  );
}

function OfficeWorker() {
  return (
    <>
      <Stand x={1090} y={14} w={170} h={154} className="hs-office">
        <svg viewBox="0 0 170 154" width="170" height="154" aria-hidden="true">
          {/* židle */}
          <path d="M118 70h14v60h-14Z" fill="#2e3448" />
          <rect x="104" y="124" width="40" height="7" rx="3" fill="#2e3448" />
          <path d="M124 131v16M110 150h28" stroke="#4a5068" strokeWidth="4" strokeLinecap="round" />
          {/* stůl */}
          <rect x="0" y="112" width="104" height="8" rx="2" fill="#5a6378" />
          <rect x="6" y="120" width="6" height="34" fill="#3d4456" />
          <rect x="92" y="120" width="6" height="34" fill="#3d4456" />
          {/* monitor s dokumentem */}
          <rect x="10" y="40" width="70" height="52" rx="4" fill="#1d2233" stroke="#4a5068" strokeWidth="3" />
          <rect x="18" y="46" width="54" height="40" rx="1" fill="#f4f1ea" />
          <g className="hs-doc-lines" stroke="#6b6f9a" strokeWidth="2.4" strokeLinecap="round">
            <path d="M23 53h30" /><path d="M23 59h42" /><path d="M23 65h36" /><path d="M23 71h40" /><path d="M23 77h24" />
          </g>
          <rect x="40" y="92" width="10" height="14" fill="#4a5068" />
          <rect x="30" y="104" width="30" height="6" rx="2" fill="#4a5068" />
          {/* klávesnice */}
          <rect x="44" y="106" width="40" height="6" rx="2" fill="#8a91a6" />
          {/* člověk */}
          <path d="M100 126c-2-24 2-44 22-44s24 22 20 44Z" fill="oklch(0.62 0.12 268)" />
          <path d="M116 82v10h12V82Z" fill="#e9b893" />
          <circle cx="122" cy="68" r="15" fill="#f1c7a5" />
          <path d="M107 66c0-12 8-18 16-18s16 6 15 16c-4-5-9-7-14-6-6 1-11 4-17 8Z" fill="#2a2a33" />
          <circle cx="114" cy="70" r="1.4" fill="#222" />
          <rect x="108" y="66" width="10" height="7" rx="2" fill="none" stroke="#222" strokeWidth="1.2" />
          <g className="hs-typing">
            <path d="M110 98c-10 4-18 6-26 8" stroke="oklch(0.62 0.12 268)" strokeWidth="8" strokeLinecap="round" fill="none" />
            <circle cx="82" cy="106" r="4" fill="#f1c7a5" />
          </g>
          <g className="hs-typing hs-typing--b">
            <path d="M116 100c-8 4-16 6-22 6" stroke="oklch(0.55 0.12 268)" strokeWidth="8" strokeLinecap="round" fill="none" />
            <circle cx="92" cy="106" r="4" fill="#e9b893" />
          </g>
        </svg>
      </Stand>
      {/* dokument letí z kanceláře do mailu, mail ho odešle pryč */}
      <div className="hs-fly hs-fly-doc" style={{ left: 1160, top: 96 }}>
        <svg viewBox="0 0 28 34" width="28" height="34" aria-hidden="true">
          <path d="M2 2h17l7 7v23H2Z" fill="#f4f1ea" stroke="#6b6f9a" strokeWidth="1.5" />
          <path d="M6 12h14M6 17h16M6 22h12" stroke="#6b6f9a" strokeWidth="1.6" />
        </svg>
      </div>
      <div className="hs-fly hs-mail-led" style={{ left: 1390, top: 200, ["--c" as string]: C.mail }} />
      <div className="hs-fly hs-fly-env" style={{ left: 1388, top: 200 }}>
        <svg viewBox="0 0 40 28" width="40" height="28" aria-hidden="true">
          <rect x="1" y="1" width="38" height="26" rx="3" fill="oklch(0.64 0.1 190)" stroke="#e8fff9" strokeWidth="1.5" />
          <path d="M2 3l18 13L38 3" fill="none" stroke="#e8fff9" strokeWidth="1.8" />
        </svg>
        <span className="hs-env-trail" />
      </div>
    </>
  );
}

function ToolsFixer() {
  return (
    <>
      <Stand x={6} y={146} w={144} h={156} className="hs-fixer">
        <svg viewBox="0 0 144 156" width="144" height="156" aria-hidden="true">
          {/* bedna s nářadím */}
          <rect x="6" y="128" width="40" height="22" rx="2" fill="#c0392b" />
          <rect x="6" y="128" width="40" height="6" fill="#962d22" />
          <path d="M18 128v-6h16v6" fill="none" stroke="#6b6f7a" strokeWidth="3" />
          {/* kužel */}
          <path d="M124 150l-8-28h-4l-8 28Z" fill="#ea8736" />
          <path d="M110 136h12" stroke="#fff" strokeWidth="3" />
          <rect x="100" y="148" width="28" height="4" fill="#ea8736" />
          {/* opravář (klečí, otočený k Tools vpravo) */}
          <path d="M52 150c-2-12 0-20 10-22l18-2c6 0 8 6 8 12v12Z" fill="#2c5f2b" />
          <path d="M54 130c-4-22 2-46 22-46s26 22 20 46Z" fill="#41983e" />
          <rect x="66" y="98" width="20" height="30" rx="3" fill="#367f33" />
          <path d="M70 98v-12M82 98v-12" stroke="#2c5f2b" strokeWidth="3" />
          <path d="M70 84h12v10H70Z" fill="#e9b893" />
          <circle cx="76" cy="70" r="14" fill="#f1c7a5" />
          <circle cx="84" cy="70" r="1.5" fill="#222" />
          <path d="M80 78q4 1 6-1" stroke="#a0604a" strokeWidth="1.3" fill="none" />
          {/* helma */}
          <path d="M60 66c0-12 8-18 16-18s16 6 16 18Z" fill="#f2c230" />
          <rect x="58" y="64" width="38" height="5" rx="2" fill="#d9a91a" />
          <g className="hs-wrench-arm">
            <path d="M84 100c10 2 20 2 30 0" stroke="#41983e" strokeWidth="9" strokeLinecap="round" fill="none" />
            <circle cx="116" cy="100" r="4.5" fill="#f1c7a5" />
            <path d="M116 100h22" stroke="#aab2b8" strokeWidth="4" strokeLinecap="round" />
            <path d="M136 94a6 6 0 1 1 0 12" fill="none" stroke="#aab2b8" strokeWidth="4" />
          </g>
        </svg>
      </Stand>
      <div className="hs-fx hs-sparks" style={{ left: 140, top: 236 }} aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ ["--a" as string]: `${-150 + i * 26}deg`, animationDelay: `${(i % 4) * 0.08}s` }} />)}
      </div>
      <div className="hs-fx hs-gear" style={{ left: 280, top: 168, color: C.tools }} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M10.3 2h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6L2 13.7v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /></svg>
      </div>
    </>
  );
}

export function BoardExtras({ locale }: { locale: string }) {
  return (
    <>
      <SnakeRing />
      <TetrisScreen />
      <LofiGirl locale={locale} />
      <OfficeWorker />
      <ToolsFixer />
    </>
  );
}
