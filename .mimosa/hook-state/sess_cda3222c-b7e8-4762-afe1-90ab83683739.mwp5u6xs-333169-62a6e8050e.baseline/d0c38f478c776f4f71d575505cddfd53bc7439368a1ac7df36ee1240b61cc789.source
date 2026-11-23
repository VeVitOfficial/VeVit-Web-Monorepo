"use client";

// 3D atom v hero: VeVit jádro, kolem něj na třech nakloněných orbitách všech 9 aplikací.
// Pozice se počítají v rAF smyčce přímo do DOM (refs), React drží jen vybranou aplikaci.

import { useCallback, useEffect, useRef, useState } from "react";
import { SCENE_APPS, appById, appHref, type AppId } from "./scene-data";
import { SceneIcon } from "./scene-icon";
import { initials, useSessionUser } from "./use-session-user";
import { sceneStrings } from "./scene-i18n";

const RINGS = [
  { r: 0.31, inc: 1.25, node: 0.0, period: 40, dir: 1 },
  { r: 0.4, inc: 1.08, node: 0.9, period: 50, dir: -1 },
  { r: 0.48, inc: 1.18, node: -0.8, period: 62, dir: 1 },
] as const;

type Vec = [number, number, number];

export function EcoAtom({ locale }: { locale: string }) {
  const S = sceneStrings(locale);
  const user = useSessionUser();
  const [sel, setSel] = useState<AppId>("account");
  const selRef = useRef<AppId>("account");
  const stageRef = useRef<HTMLDivElement>(null);
  const chip = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const spokeB = useRef<Partial<Record<AppId, SVGLineElement | null>>>({});
  const spokeF = useRef<Partial<Record<AppId, SVGLineElement | null>>>({});
  const ringB = useRef<Array<SVGPathElement | null>>([]);
  const ringF = useRef<Array<SVGPathElement | null>>([]);
  const st = useRef({
    yaw: -0.3,
    pitch: 0.36,
    t: 0,
    clock: 0,
    spd: 0,
    focusing: false,
    hover: false,
    justDragged: false,
    drag: { on: false, moved: false, x: 0, y: 0, yaw: 0, pitch: 0 },
  });

  const select = useCallback((id: AppId) => {
    if (st.current.justDragged) return;
    st.current.focusing = true;
    selRef.current = id;
    setSel(id);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const s = st.current;

    const step = (dt: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const size = stage.clientWidth;
      if (!size) return;
      s.clock += dt;
      let target = reduce ? 0 : 1;
      if (s.focusing) target = 0;
      if (s.hover) target *= 0.4;
      s.spd += (target - s.spd) * Math.min(1, dt * 2.5);
      s.t += dt * s.spd;
      if (!s.drag.moved && !s.focusing && !reduce) s.yaw += dt * 0.05;

      // Na úzkém displeji se čipy zmenší, ať se po orbitách nepřekrývají.
      const cs = Math.max(0.7, Math.min(1, size / 500));
      const cx = size / 2;
      const cy = size / 2;
      const f = size * 3;
      const world = (ring: (typeof RINGS)[number], ang: number): Vec => {
        const r = ring.r * size;
        const x = r * Math.cos(ang);
        const y = r * Math.sin(ang);
        const y1 = y * Math.cos(ring.inc);
        const z1 = y * Math.sin(ring.inc);
        return [x * Math.cos(ring.node) + z1 * Math.sin(ring.node), y1, -x * Math.sin(ring.node) + z1 * Math.cos(ring.node)];
      };
      const cyw = Math.cos(s.yaw);
      const syw = Math.sin(s.yaw);
      const cp = Math.cos(s.pitch);
      const sp = Math.sin(s.pitch);
      const view = ([x, y, z]: Vec): Vec => {
        const x1 = x * cyw + z * syw;
        const z1 = -x * syw + z * cyw;
        return [x1, y * cp + z1 * sp, -y * sp + z1 * cp];
      };
      const proj = ([x, y, z]: Vec): [number, number, number] => {
        const k = f / (f - z);
        return [cx + x * k, cy + y * k, k];
      };

      const cur = selRef.current;
      SCENE_APPS.forEach((a) => {
        const ring = RINGS[a.ring];
        const ang = (a.phase + (s.t / ring.period) * ring.dir) * Math.PI * 2;
        const w = world(ring, ang);
        if (a.id === cur && s.focusing && !s.drag.moved) {
          let d = Math.atan2(-w[0], w[2]) - s.yaw;
          d = Math.atan2(Math.sin(d), Math.cos(d));
          s.yaw += d * Math.min(1, dt * 3.5);
          s.pitch += (0.42 - s.pitch) * Math.min(1, dt * 3);
        }
        const v = view(w);
        const [X, Y, sc] = proj(v);
        const k = (v[2] / (ring.r * size) + 1) / 2;
        const on = a.id === cur;
        const el = chip.current[a.id];
        if (el) {
          el.style.transform = `translate(${(X - 28).toFixed(1)}px,${(Y - 28).toFixed(1)}px) scale(${(sc * cs * (on ? 1.14 : 1)).toFixed(3)})`;
          el.style.zIndex = String((v[2] >= 0 ? 70 : 10) + Math.round(k * 20));
          el.style.opacity = (on ? 1 : 0.5 + 0.5 * k).toFixed(2);
        }
        const len = Math.hypot(v[0], v[1], v[2]) || 1;
        const rc = 0.135 * size;
        const [sx, sy] = proj([(v[0] / len) * rc, (v[1] / len) * rc, (v[2] / len) * rc]);
        const front = v[2] >= 0;
        const L = front ? spokeF.current[a.id] : spokeB.current[a.id];
        const O = front ? spokeB.current[a.id] : spokeF.current[a.id];
        if (L) {
          L.setAttribute("x1", sx.toFixed(1));
          L.setAttribute("y1", sy.toFixed(1));
          L.setAttribute("x2", X.toFixed(1));
          L.setAttribute("y2", Y.toFixed(1));
          L.style.opacity = on ? "0.9" : (0.14 + 0.2 * k).toFixed(2);
          L.style.strokeDashoffset = (-s.clock * (on ? 36 : 14)).toFixed(1);
          L.style.strokeWidth = on ? "2" : "1.25";
        }
        if (O) O.style.opacity = "0";
      });

      RINGS.forEach((ring, i) => {
        let b = "";
        let fr = "";
        let mode = 0;
        let prev: string | null = null;
        for (let n = 0; n <= 120; n++) {
          const v = view(world(ring, (n / 120) * Math.PI * 2));
          const [X, Y] = proj(v);
          const pt = `${X.toFixed(1)} ${Y.toFixed(1)}`;
          const m = v[2] < 0 ? 1 : 2;
          if (m === 1) b += (mode === 1 ? "L" : `M${prev || pt}L`) + pt;
          else fr += (mode === 2 ? "L" : `M${prev || pt}L`) + pt;
          mode = m;
          prev = pt;
        }
        ringB.current[i]?.setAttribute("d", b);
        ringF.current[i]?.setAttribute("d", fr);
      });
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s = st.current;
    s.drag = { on: true, moved: false, x: e.clientX, y: e.clientY, yaw: s.yaw, pitch: s.pitch };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = st.current;
    const d = s.drag;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 5) {
      d.moved = true;
      s.focusing = false;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer už neexistuje */
      }
    }
    if (d.moved) {
      s.yaw = d.yaw + dx * 0.008;
      s.pitch = Math.max(-0.15, Math.min(1.1, d.pitch + dy * 0.006));
    }
  };
  const onUp = () => {
    const s = st.current;
    if (s.drag.moved) {
      s.justDragged = true;
      setTimeout(() => {
        s.justDragged = false;
      }, 0);
    }
    s.drag = { on: false, moved: false, x: 0, y: 0, yaw: 0, pitch: 0 };
  };

  const cur = appById(sel) ?? SCENE_APPS[0];

  return (
    <div className="hs-atom-wrap">
      <div
        ref={stageRef}
        className="hs-stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={() => {
          st.current.hover = true;
        }}
        onPointerLeave={() => {
          st.current.hover = false;
        }}
      >
        <svg className="hs-layer hs-layer--back" aria-hidden="true">
          {RINGS.map((_, i) => (
            <path key={i} ref={(el) => { ringB.current[i] = el; }} className="hs-ring hs-ring--back" fill="none" />
          ))}
          {SCENE_APPS.map((a) => (
            <line key={a.id} ref={(el) => { spokeB.current[a.id] = el; }} className="hs-spoke" strokeLinecap="round" style={{ stroke: a.color, opacity: 0 }} />
          ))}
        </svg>

        <button type="button" className="hs-core" aria-label="VeVit" onClick={() => { st.current.focusing = false; }}>
          <span className="hs-core-sphere" />
          <span className="hs-core-name">VeVit</span>
        </button>

        <svg className="hs-layer hs-layer--front" aria-hidden="true">
          {RINGS.map((_, i) => (
            <path key={i} ref={(el) => { ringF.current[i] = el; }} className="hs-ring hs-ring--front" fill="none" />
          ))}
          {SCENE_APPS.map((a) => (
            <line key={a.id} ref={(el) => { spokeF.current[a.id] = el; }} className="hs-spoke" strokeLinecap="round" style={{ stroke: a.color, opacity: 0 }} />
          ))}
        </svg>

        {SCENE_APPS.map((a) => {
          const on = a.id === sel;
          return (
            <button
              key={a.id}
              type="button"
              ref={(el) => { chip.current[a.id] = el; }}
              className="hs-chip"
              aria-label={a.name}
              aria-pressed={on}
              onClick={() => select(a.id)}
              onDoubleClick={() => { window.location.href = appHref(a, locale); }}
              style={{ ["--c" as string]: a.color }}
            >
              <span className="hs-chip-face" style={{ outline: on ? `2px solid ${a.color}` : "0 solid transparent" }}>
                {a.id === "account" && user ? (
                  <span className="hs-avatar hs-avatar--chip" style={{ borderColor: a.color }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                {user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name)}
                  </span>
                ) : (
                  <SceneIcon name={a.icon} size={24} />
                )}
              </span>
              <span className="hs-chip-name">{a.name}</span>
            </button>
          );
        })}
      </div>

      <div className="hs-caption">
        <span className="hs-dot" style={{ background: cur.color }} />
        <strong>{cur.name}</strong>
        <span>{S.status[cur.status]}</span>
        <span>·</span>
        <a href={appHref(cur, locale)}>{cur.url}</a>
      </div>
      <div className="hs-hint">{S.drag}</div>
    </div>
  );
}
