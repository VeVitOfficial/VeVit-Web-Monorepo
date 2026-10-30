"use client";

import { useEffect } from "react";

/** 3D náklon Premium karet podle kurzoru (jen myš, bez prefers-reduced-motion). */
export function TierTilt() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".tier-card"));
    const cleanups = cards.map((card) => {
      const move = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = "transform 90ms linear, border-color 160ms";
        card.style.transform = `rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(px * 14).toFixed(2)}deg) translateZ(10px)`;
      };
      const leave = () => {
        card.style.transition = "";
        card.style.transform = "";
      };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      return () => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      };
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);
  return null;
}
