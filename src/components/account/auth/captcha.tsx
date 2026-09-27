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
      render: (container: HTMLElement, options: TurnstileOptions) => string | undefined;
      getResponse: (widgetId?: string) => string | undefined;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  action?: string;
  theme?: string;
  "refresh-expired"?: "auto" | "manual" | "never";
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: () => void;
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function turnstile(): Window["turnstile"] {
  return typeof window !== "undefined" ? window.turnstile : undefined;
}

// ID aktuálně vykresleného widgetu. Turnstile umí getResponse()/reset() i bez
// něj, ale jen dokud je na stránce právě jeden widget — s ID je to jednoznačné.
let currentWidgetId: string | null = null;

/** Token z widgetu; prázdný řetězec když CAPTCHA není aktivní. */
export function captchaToken(): string {
  try {
    return turnstile()?.getResponse(currentWidgetId ?? undefined) || "";
  } catch {
    return "";
  }
}

/** Turnstile tokeny jsou jednorázové — po neúspěšném pokusu resetovat. */
export function resetCaptcha() {
  try {
    const ts = turnstile();
    if (!ts || currentWidgetId === null) return;
    ts.reset(currentWidgetId);
  } catch {
    /* noop */
  }
}

// api.js smí na stránce běžet jen jednou — sdílená promise, aby remount
// komponenty (Strict Mode, klientská navigace login ⇄ registrace) nepřidával
// další <script> a nepřepisoval window.turnstile pod rukama.
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (turnstile()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      // Další pokus (jiný mount) smí zkusit načtení znovu.
      scriptPromise = null;
      reject(new Error("Turnstile script failed to load"));
    });
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return scriptPromise;
}

/** `action` musí odpovídat tomu, co backend předává do verifyTurnstile(). */
export function TurnstileField({ action, className, style }: {
  action: "login" | "register" | "skoly_interest";
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Pozn.: dřív tu byl `mounted` ref proti dvojímu efektu ve Strict Mode.
    // Ve dvojici s `cancelled` se ale navzájem zablokovaly: první mount spustil
    // fetch, cleanup nastavil cancelled=true a druhý mount se kvůli `mounted`
    // hned vrátil — dokončený fetch pak spadl do `if (cancelled) return` a
    // widget se nevykreslil vůbec. Teď se každý mount stará jen o svůj widget
    // a při unmountu ho zase odstraní.
    let cancelled = false;
    let widgetId: string | null = null;
    // Uzavřeme si element hned — v cleanupu už `containerRef.current` může být
    // null (React ref odpojí před úklidem), takže by se `data-ready` neuklidilo.
    const container = containerRef.current;

    (async () => {
      let siteKey: string | null = null;
      try {
        const res = await fetch("/account/api/captcha-config.php", { credentials: "same-origin" });
        if (res.ok) {
          const data = (await res.json()) as { siteKey?: string | null };
          siteKey = data?.siteKey ?? null;
        }
      } catch {
        return; // CAPTCHA zůstane vypnutá
      }
      if (cancelled || !siteKey) return;

      try {
        await loadTurnstileScript();
      } catch {
        return;
      }
      if (cancelled || !container || container.dataset.ready === "true") return;

      try {
        widgetId = turnstile()?.render(container, {
          sitekey: siteKey,
          action,
          theme: "dark",
          // Token platí ~5 minut. Bez obnovení by odeslaný formulář skončil na
          // "CAPTCHA ověření selhalo", i když uživatel widget vyplnil.
          "refresh-expired": "auto",
          "expired-callback": () => { try { turnstile()?.reset(widgetId ?? undefined); } catch { /* noop */ } },
          "timeout-callback": () => { try { turnstile()?.reset(widgetId ?? undefined); } catch { /* noop */ } },
        }) ?? null;
        if (widgetId === null) return;
        container.dataset.ready = "true";
        container.dataset.widget = widgetId;
        currentWidgetId = widgetId;
      } catch {
        /* noop */
      }
    })();

    return () => {
      cancelled = true;
      if (container) {
        delete container.dataset.ready;
        delete container.dataset.widget;
      }
      if (widgetId !== null) {
        try { turnstile()?.remove(widgetId); } catch { /* noop */ }
        if (currentWidgetId === widgetId) currentWidgetId = null;
      }
    };
  }, [action]);

  return (
    <div ref={containerRef} id="cfCaptcha" data-captcha="1" aria-label="Ochrana proti robotům" className={className} style={style} />
  );
}
