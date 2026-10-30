"use client";

// 3D roadmapa: sloupce podle % hotovo, obrys je cíl 100 %. Tažením se rovina otáčí.

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { SCENE_APPS, appById, type AppId } from "./scene-data";
import { SceneIcon } from "./scene-icon";
import { sceneStrings } from "./scene-i18n";

const H = 220;

export function RoadTowers({ locale }: { locale: string }) {
  const S = sceneStrings(locale);
  const [sel, setSel] = useState<AppId>("account");
  const [width, setWidth] = useState(1100);
  const wrapRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const st = useRef({ rx: 60, rz: -16, sway: 0, clock: 0, justDragged: false, drag: { on: false, moved: false, x: 0, y: 0, rx: 0, rz: 0 } });

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
    const s = st.current;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      s.clock += dt;
      const target = !reduce && !s.drag.moved ? 1 : 0;
      s.sway += (target - s.sway) * Math.min(1, dt * 2);
      const rz = s.rz + Math.sin(s.clock * 0.35) * 7 * s.sway;
      const rx = s.rx + Math.sin(s.clock * 0.23) * 3 * s.sway;
      if (planeRef.current) planeRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const select = useCallback((id: AppId) => {
    if (st.current.justDragged) return;
    setSel(id);
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const s = st.current;
    s.drag = { on: true, moved: false, x: e.clientX, y: e.clientY, rx: s.rx, rz: s.rz };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = st.current;
    const d = s.drag;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 5) {
      d.moved = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer už neexistuje */
      }
    }
    if (d.moved) {
      s.rz = d.rz + dx * 0.25;
      s.rx = Math.max(30, Math.min(78, d.rx - dy * 0.2));
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
    s.drag = { on: false, moved: false, x: 0, y: 0, rx: 0, rz: 0 };
  };

  // Telefon: věže v mřížce 3 × 3 místo jedné řady, aby nebyly drobné.
  const compact = width < 640;
  const worldW = compact ? 560 : 1100;
  const worldH = compact ? 600 : 430;
  const scale = Math.min(1, width / worldW);

  useEffect(() => {
    const s = st.current;
    s.rx = compact ? 44 : 60;
    s.rz = compact ? -30 : -16;
  }, [compact]);

  const towers = SCENE_APPS.slice().sort((a, b) => b.progress - a.progress).map((a, i) => {
    const on = a.id === sel;
    const h = Math.max(4, Math.round((a.progress / 100) * H));
    return {
      app: a, on, h, inv: 56 - h,
      x: compact ? 62 + (i % 3) * 130 : 44 + i * 116,
      y: compact ? 40 + Math.floor(i / 3) * 150 : 92,
      top: on ? `color-mix(in srgb, ${a.color} 75%, #fff)` : a.color,
      ghost: on ? `1.5px solid ${a.color}` : `1px dashed color-mix(in srgb, ${a.color} 50%, transparent)`,
      ghostFill: on ? `color-mix(in srgb, ${a.color} 10%, transparent)` : "transparent",
    };
  });

  const cur = appById(sel) ?? SCENE_APPS[0];

  return (
    <div className="hs-road-section">
      <div className="hs-road-legend">
        <span><i className="hs-sw hs-sw--solid" />{S.done}</span>
        <span><i className="hs-sw hs-sw--dash" />{S.target}</span>
      </div>
      <div
        ref={wrapRef}
        className={`hs-road${compact ? " is-compact" : ""}`}
        style={{ height: Math.round(worldH * scale) }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="hs-road-world" style={{ transform: `scale(${scale.toFixed(3)})` }}>
          <div ref={planeRef} className="hs-road-plane">
            <div className="hs-road-axis" />
            <div className="hs-road-edge hs-road-edge--l">{S.doneEdge}</div>
            <div className="hs-road-edge hs-road-edge--r">{S.plannedEdge}</div>
            {towers.map((t) => (
              <Fragment key={t.app.id}>
                <div className="hs-pct" style={{ left: t.x, top: t.y + 78, color: t.on ? "var(--text)" : "var(--text-secondary)" }}>{t.app.progress} %</div>
                <div className="hs-tower" style={{ left: t.x, top: t.y }} onClick={() => select(t.app.id)}>
                  <div style={{ position: "absolute", inset: -8, borderRadius: 4, background: `color-mix(in srgb, ${t.app.color} 22%, transparent)`, transform: "translateZ(1px)" }} />
                  <div className="hs-tower-body">
                    <div className="hs-tf" style={{ left: 0, top: 0, width: 56, height: 56, transform: `translateZ(${t.h}px)`, background: t.top, display: "grid", placeItems: "center", color: "#0d0d0d" }}>
                      <SceneIcon name={t.app.icon} size={22} />
                    </div>
                    <div className="hs-tf" style={{ left: 0, top: t.inv, width: 56, height: t.h, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", background: `color-mix(in srgb, ${t.app.color} 78%, #000)`, overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: "50%", top: "50%", width: Math.max(0, t.h - 14), height: 56, transform: "translate(-50%,-50%) rotate(-90deg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", font: "600 16px/56px var(--font-plex-sans), system-ui, sans-serif", letterSpacing: "-.01em", color: "#fff" }}>{t.app.name}</div>
                    </div>
                    <div className="hs-tf" style={{ left: 0, top: 0, width: 56, height: t.h, transformOrigin: "50% 0", transform: "rotateX(90deg)", background: `color-mix(in srgb, ${t.app.color} 62%, #000)` }} />
                    <div className="hs-tf" style={{ left: 0, top: 0, width: t.h, height: 56, transformOrigin: "0 50%", transform: "rotateY(-90deg)", background: `color-mix(in srgb, ${t.app.color} 52%, #000)` }} />
                    <div className="hs-tf" style={{ left: t.inv, top: 0, width: t.h, height: 56, transformOrigin: "100% 50%", transform: "rotateY(90deg)", background: `color-mix(in srgb, ${t.app.color} 62%, #000)` }} />
                  </div>
                  <div className="hs-ghost">
                    <div className="hs-gf" style={{ left: 0, top: 0, width: 62, height: 62, transform: `translateZ(${H}px)`, border: t.ghost, background: t.ghostFill }} />
                    <div className="hs-gf" style={{ left: 0, top: -158, width: 62, height: H, transformOrigin: "50% 100%", transform: "rotateX(-90deg)", border: t.ghost }} />
                    <div className="hs-gf" style={{ left: 0, top: 0, width: 62, height: H, transformOrigin: "50% 0", transform: "rotateX(90deg)", border: t.ghost }} />
                    <div className="hs-gf" style={{ left: 0, top: 0, width: H, height: 62, transformOrigin: "0 50%", transform: "rotateY(-90deg)", border: t.ghost }} />
                    <div className="hs-gf" style={{ left: -158, top: 0, width: H, height: 62, transformOrigin: "100% 50%", transform: "rotateY(90deg)", border: t.ghost }} />
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="hs-hint">{S.roadHint}</div>
      <div className="hs-road-detail">
        <span className="hs-road-q"><span className="hs-dot" style={{ background: cur.color }} />{S.status[cur.status]}</span>
        <h3>{cur.name}</h3>
        <p>{S.roadmap[cur.id]}</p>
        <div className="hs-road-prog" style={{ ["--p" as string]: `${cur.progress}%`, ["--c" as string]: cur.color }} />
        <div className="hs-road-meta"><span>{cur.progress} {S.progress}</span><span>{cur.url}</span></div>
      </div>
    </div>
  );
}
