"use client";

// Ovládání projekce: tlačítka Předchozí / Další / Celá obrazovka / Ukončit a klávesy
// (← → PageUp PageDown pro prezentér, Esc ukončí). Klávesy se ignorují při psaní do polí.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Labels = { prev: string; next: string; exit: string; fullscreen: string; keys: string };

export function ProjectionControls({
  prevHref, nextHref, exitHref, labels,
}: { prevHref: string | null; nextHref: string | null; exitHref: string; labels: Labels }) {
  const router = useRouter();
  // Po hydrataci se na panel doplní data-ready (ovládání klávesami je připravené; využívají i testy).
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if ((event.key === "ArrowRight" || event.key === "PageDown") && nextHref) {
        event.preventDefault();
        router.push(nextHref);
      } else if ((event.key === "ArrowLeft" || event.key === "PageUp") && prevHref) {
        event.preventDefault();
        router.push(prevHref);
      } else if (event.key === "Escape" && !document.fullscreenElement) {
        router.push(exitHref);
      }
    }
    window.addEventListener("keydown", onKey);
    bar.current?.setAttribute("data-ready", "true");
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prevHref, nextHref, exitHref]);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  return (
    <div className="aifb-proj__bar" ref={bar}>
      <Link href={exitHref} className="btn btn-ghost">{labels.exit}</Link>
      <span className="aifb-proj__keys">{labels.keys}</span>
      <button type="button" className="btn btn-ghost" onClick={toggleFullscreen}>{labels.fullscreen}</button>
      {prevHref ? <Link href={prevHref} rel="prev" className="btn btn-ghost">{labels.prev}</Link> : <span />}
      {nextHref ? <Link href={nextHref} rel="next" className="btn btn-primary">{labels.next}</Link> : <span />}
    </div>
  );
}
