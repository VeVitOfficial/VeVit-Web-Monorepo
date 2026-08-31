"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile jako React komponenta — port account/assets/captcha.js.
 * Widget se renderuje jen když server vrátí siteKey (TURNSTILE_SITE_KEY na
 * Vercelu); bez klíče se nic nenačítá a token zůstává prázdný, backend pak
 * ověření přeskočí. Token se čte/resetuje přes module-scope helpery, aby
 * formuláře nemusely tahat token skrz state (stejně jako window.VVCaptcha).
 */

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; theme: string }) => string;
      getResponse: () => string | undefined;
      reset: () => void;
    };
  }
}

function turnstile(): Window["turnstile"] {
  return typeof window !== "undefined" ? window.turnstile : undefined;
}

/** Token z widgetu; prázdný řetězec když CAPTCHA není aktivní. */
export function captchaToken(): string {
  try {
    return turnstile()?.getResponse() || "";
  } catch {
    return "";
  }
}

/** Turnstile tokeny jsou jednorázové — po neúspěšném pokusu resetovat. */
export function resetCaptcha() {
  try {
    const ts = turnstile();
    if (ts && ts.getResponse()) ts.reset();
  } catch {
    /* noop */
  }
}

function loadTurnstileScript(onLoad: () => void) {
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.onload = onLoad;
  document.head.appendChild(script);
}

export function TurnstileField({ className, style }: { className?: string; style?: React.CSSProperties }) {
  // Strict mode (dev) volá effect 2× — data-ready guard zajistí jediný render.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    let cancelled = false;
    fetch("/account/api/captcha-config.php", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { siteKey: null }))
      .catch(() => ({ siteKey: null }))
      .then((data: { siteKey?: string | null }) => {
        if (cancelled || !data?.siteKey) return;
        const container = document.getElementById("cfCaptcha");
        if (!container || container.dataset.ready === "true") return;
        loadTurnstileScript(() => {
          if (container.dataset.ready === "true") return;
          try {
            const widget = turnstile()?.render(container, { sitekey: data.siteKey as string, theme: "dark" });
            container.dataset.ready = "true";
            container.dataset.widget = widget ?? "";
          } catch {
            /* noop */
          }
        });
      })
      .catch(() => {
        /* captcha zůstane vypnutá */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div id="cfCaptcha" data-captcha="1" aria-label="Ochrana proti robotům" className={className} style={style} />
  );
}