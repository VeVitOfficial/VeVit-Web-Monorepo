"use client";

import { useEffect } from "react";

/**
 * Otáčení 3D atomu tažením: jen při podrženém levém tlačítku myši (LMB).
 * Bez stisknutého tlačítka se atom nehýbe myší. Natočení zůstává i po puštění.
 * Odkazy kolem atomu tažení nespouštějí, dotyková zařízení nejsou dotčena (scroll).
 */
export function AtomTilt() {
  useEffect(() => {
    const atom = document.querySelector<HTMLElement>("[data-atom]");
    if (!atom) return;

    let yaw = 0;
    let pitch = 0;
    let startX = 0;
    let startY = 0;
    let startYaw = 0;
    let startPitch = 0;
    let dragging = false;
    let raf = 0;

    const apply = () => {
      raf = 0;
      atom.style.setProperty("--tx", `${yaw.toFixed(2)}deg`);
      atom.style.setProperty("--ty", `${pitch.toFixed(2)}deg`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("a")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startYaw = yaw;
      startPitch = pitch;
      atom.classList.add("is-dragging");
      atom.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || !(e.buttons & 1)) return;
      yaw = startYaw + (e.clientX - startX) * 0.45;
      pitch = Math.max(-75, Math.min(75, startPitch - (e.clientY - startY) * 0.35));
      schedule();
    };
    const end = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      atom.classList.remove("is-dragging");
      if (atom.hasPointerCapture(e.pointerId)) atom.releasePointerCapture(e.pointerId);
    };

    atom.addEventListener("pointerdown", onDown);
    atom.addEventListener("pointermove", onMove);
    atom.addEventListener("pointerup", end);
    atom.addEventListener("pointercancel", end);
    return () => {
      atom.removeEventListener("pointerdown", onDown);
      atom.removeEventListener("pointermove", onMove);
      atom.removeEventListener("pointerup", end);
      atom.removeEventListener("pointercancel", end);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
