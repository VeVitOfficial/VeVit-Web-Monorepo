"use client";

import { useEffect } from "react";

/**
 * Port home/assets/js/premium.js — billing toggle, Stripe checkout stub,
 * animovaný stat counter a premium dropdown (ten na home není přítomen,
 * přesto se portuje 1:1 pro případ budoucího použití). Komponenta nic
 * nerenderuje a nepoužívá React state.
 */
export function PremiumBehaviors() {
  useEffect(() => {
    const $$ = <T extends Element = Element>(sel: string) =>
      Array.from(document.querySelectorAll<T>(sel));

    /* ---------- Premium dropdown (na home nepřítomen, no-op) ---------- */
    const trigger = document.querySelector<HTMLElement>("[data-premium-trigger]");
    const menu = document.querySelector<HTMLElement>("[data-premium-menu]");
    let premiumCleanup: (() => void) | null = null;
    if (trigger && menu) {
      const open = () => {
        menu.dataset.open = "true";
        trigger.setAttribute("aria-expanded", "true");
      };
      const close = () => {
        menu.dataset.open = "false";
        trigger.setAttribute("aria-expanded", "false");
      };
      const toggle = (e: Event) => {
        e.stopPropagation();
        if (menu.dataset.open === "true") close();
        else open();
      };
      const stop = (e: Event) => e.stopPropagation();
      const onEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      const onDoc = () => close();
      trigger.addEventListener("click", toggle);
      menu.addEventListener("click", stop);
      document.addEventListener("click", onDoc);
      document.addEventListener("keydown", onEsc);
      const hoverCleanups: Array<() => void> = [];
      const wrap = trigger.closest(".dropdown-wrap");
      if (wrap && window.matchMedia("(hover: hover)").matches) {
        let timer: number | null = null;
        const enter = () => {
          if (timer !== null) window.clearTimeout(timer);
          open();
        };
        const leave = () => {
          timer = window.setTimeout(close, 180);
        };
        wrap.addEventListener("mouseenter", enter);
        wrap.addEventListener("mouseleave", leave);
        hoverCleanups.push(() => {
          wrap.removeEventListener("mouseenter", enter);
          wrap.removeEventListener("mouseleave", leave);
        });
      }
      premiumCleanup = () => {
        trigger.removeEventListener("click", toggle);
        menu.removeEventListener("click", stop);
        document.removeEventListener("click", onDoc);
        document.removeEventListener("keydown", onEsc);
        hoverCleanups.forEach((fn) => fn());
      };
    }

    /* ---------- Billing toggle ---------- */
    const billingButtons = $$<HTMLButtonElement>(".billing-btn[data-billing]");
    let billingCleanup: (() => void) | null = null;
    if (billingButtons.length) {
      const setBilling = (mode: string) => {
        billingButtons.forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(b.dataset.billing === mode),
          ),
        );
        $$<HTMLElement>("[data-price-monthly]").forEach((el) => {
          el.hidden = mode !== "monthly";
        });
        $$<HTMLElement>("[data-price-yearly]").forEach((el) => {
          el.hidden = mode !== "yearly";
        });
        $$<HTMLElement>("[data-period-monthly]").forEach((el) => {
          el.hidden = mode !== "monthly";
        });
        $$<HTMLElement>("[data-period-yearly]").forEach((el) => {
          el.hidden = mode !== "yearly";
        });
        $$<HTMLElement>("[data-alt-monthly]").forEach((el) => {
          el.hidden = mode !== "monthly";
        });
        $$<HTMLElement>("[data-alt-yearly]").forEach((el) => {
          el.hidden = mode !== "yearly";
        });
        document.documentElement.dataset.billing = mode;
      };
      const fns: Array<{ b: HTMLButtonElement; fn: () => void }> = [];
      billingButtons.forEach((b) => {
        const fn = () => setBilling(b.dataset.billing || "monthly");
        b.addEventListener("click", fn);
        fns.push({ b, fn });
      });
      billingCleanup = () =>
        fns.forEach(({ b, fn }) => b.removeEventListener("click", fn));
    }

    /* ---------- Stripe checkout stub ---------- */
    const ctaButtons = $$<HTMLButtonElement>("[data-tier-cta]");
    const ctaCleanups: Array<() => void> = [];
    ctaButtons.forEach((btn) => {
      const fn = () => {
        // TODO: napojit na /api/stripe-checkout (legacy placeholder).
        btn.disabled = true;
        const original = btn.textContent;
        btn.textContent = "Přesměrovávám…";
        window.setTimeout(() => {
          btn.disabled = false;
          btn.textContent = original;
        }, 1500);
      };
      btn.addEventListener("click", fn);
      ctaCleanups.push(() => btn.removeEventListener("click", fn));
    });

    /* ---------- Animated stat counter ---------- */
    const statEls = $$<HTMLElement>("[data-stat-target]");
    let io: IntersectionObserver | null = null;
    if (statEls.length) {
      const animate = (el: HTMLElement) => {
        const target = parseInt(el.dataset.statTarget || "", 10);
        if (Number.isNaN(target)) return;
        const dur = 1400;
        const start = performance.now();
        const fmt = new Intl.NumberFormat("cs-CZ");
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt.format(Math.round(target * eased));
          if (t < 1) window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      };
      if (!("IntersectionObserver" in window)) {
        statEls.forEach(animate);
      } else {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const target = entry.target as HTMLElement;
              if (entry.isIntersecting && !target.dataset.statDone) {
                target.dataset.statDone = "1";
                animate(target);
                io?.unobserve(target);
              }
            });
          },
          { threshold: 0.4 },
        );
        statEls.forEach((el) => io?.observe(el));
      }
    }

    return () => {
      premiumCleanup?.();
      billingCleanup?.();
      ctaCleanups.forEach((fn) => fn());
      io?.disconnect();
    };
  }, []);

  return null;
}