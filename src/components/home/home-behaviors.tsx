"use client";

import Script from "next/script";
import { useEffect } from "react";

// Legacy sdílené skripty načítáme přes next/script (afterInteractive).
// beforeInteractive je v App Routeru povoleno jen v root layoutu, který
// nesmíme měnit. ui.js registruje pouze DOMContentLoaded listener (ten už
// proběhl před načtením afterInteractive skriptu), proto UI.apply() voláme
// ručně v onReady a při události `vevit:localechange`.
const LEGACY_SCRIPTS = [
  "/assets/vendor/lucide/lucide.min.js",
  "/home/assets/js/ui.js",
  "/assets/shared/session.js",
] as const;
// app-switcher.js a localization.js jsou ES moduly (import/export) — legacy je
// načítal s type="module". next/script vkládá klasický <script>, což způsobuje
// SyntaxError, proto jdou jako plain <script type="module"> (provedou se po
// parsování, shodně s legacy chováním).
const LEGACY_MODULE_SCRIPTS = [
  "/assets/shared/app-switcher.js?v=20260825b",
  "/assets/shared/localization.js?v=20260826f",
] as const;

declare global {
  interface Window {
    UI?: {
      apply: (root?: Document | Element, lang?: string) => void;
      t: (key: string, lang?: string) => string;
    };
    lucide?: { createIcons: () => void };
  }
}

// Aplikuje legacy i18n (UI.apply) + lucide ikony. Volá se po načtení
// každého afterInteractive skriptu (konvergence: ať už se skripty načtou
// v jakémkoliv pořadí, nakonec dojde k aplikaci).
function applyLegacyUi() {
  if (typeof window === "undefined") return;
  window.lucide?.createIcons();
  window.UI?.apply();
}

// Přeloží klíč z ui.js podle aktuálního jazyka <html lang>, s natvrdo
// zapsaným českým fallbackem pro případ, že UI.t ještě není načtené.
function t(key: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const lang = document.documentElement.lang || "cs";
  return window.UI?.t(key, lang) ?? fallback;
}

/**
 * Port home/assets/js/app.js — imperativní DOM interakce (sticky nav,
 * dropdowny, mobilní menu, kontakt formulář, kopie e-mailu, premium notify).
 * Komponenta nic nerenderuje (kromě legacy <Script> tagů) a nepoužívá React
 * state, aby React nepsal do subtree, který mutuje legacy ui.js/lucide.
 */
export function HomeBehaviors() {
  // Hlavní interakce — 1:1 port app.js IIFE.
  useEffect(() => {
    const $ = <T extends Element = Element>(sel: string) =>
      document.querySelector<T>(sel);
    const $$ = <T extends Element = Element>(sel: string) =>
      Array.from(document.querySelectorAll<T>(sel));

    /* ---------- Sticky nav backdrop on scroll ---------- */
    const nav = $<HTMLElement>("[data-nav]");
    let onScroll: (() => void) | null = null;
    if (nav) {
      onScroll = () => {
        if (window.scrollY > 20) nav.classList.add("nav-scrolled");
        else nav.classList.remove("nav-scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ---------- Nav dropdowns ---------- */
    const triggers = $$<HTMLElement>("[data-dropdown-trigger]");
    const pairs = triggers
      .map((trigger) => {
        const menu = document.getElementById(
          trigger.getAttribute("aria-controls") || "",
        );
        return menu ? { trigger, menu } : null;
      })
      .filter((p): p is { trigger: HTMLElement; menu: HTMLElement } => p !== null);

    const closeAll = (except: HTMLElement) => {
      pairs.forEach((p) => {
        if (p.trigger === except) return;
        p.menu.dataset.open = "false";
        p.trigger.setAttribute("aria-expanded", "false");
      });
    };
    const openPair = (p: { trigger: HTMLElement; menu: HTMLElement }) => {
      closeAll(p.trigger);
      p.menu.dataset.open = "true";
      p.trigger.setAttribute("aria-expanded", "true");
    };
    const closePair = (p: { trigger: HTMLElement; menu: HTMLElement }) => {
      p.menu.dataset.open = "false";
      p.trigger.setAttribute("aria-expanded", "false");
    };

    const triggerClicks: Array<{ el: HTMLElement; fn: (e: Event) => void }> = [];
    const hoverCleanups: Array<() => void> = [];
    pairs.forEach(({ trigger, menu }) => {
      const click = (e: Event) => {
        e.stopPropagation();
        const willOpen = trigger.getAttribute("aria-expanded") !== "true";
        if (willOpen) openPair({ trigger, menu });
        else closePair({ trigger, menu });
      };
      trigger.addEventListener("click", click);
      triggerClicks.push({ el: trigger, fn: click });

      const wrap = trigger.closest(".dropdown-wrap");
      if (wrap && window.matchMedia("(hover: hover)").matches) {
        let timer: number | null = null;
        const enter = () => {
          if (timer !== null) window.clearTimeout(timer);
          openPair({ trigger, menu });
        };
        const leave = () => {
          timer = window.setTimeout(() => closePair({ trigger, menu }), 180);
        };
        wrap.addEventListener("mouseenter", enter);
        wrap.addEventListener("mouseleave", leave);
        hoverCleanups.push(() => {
          wrap.removeEventListener("mouseenter", enter);
          wrap.removeEventListener("mouseleave", leave);
        });
      }
    });

    const onDocClick = (e: MouseEvent) => {
      pairs.forEach(({ trigger, menu }) => {
        if (trigger.getAttribute("aria-expanded") !== "true") return;
        if (menu.contains(e.target as Node) || trigger.contains(e.target as Node))
          return;
        closePair({ trigger, menu });
      });
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      pairs.forEach(({ trigger, menu }) => {
        if (trigger.getAttribute("aria-expanded") === "true") {
          closePair({ trigger, menu });
          trigger.focus();
        }
      });
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeydown);

    /* ---------- Mobile menu ---------- */
    const openBtn = $<HTMLElement>("[data-mobile-open]");
    const closeBtn = $<HTMLElement>("[data-mobile-close]");
    const panel = $<HTMLElement>("[data-mobile-panel]");
    const overlay = $<HTMLElement>("[data-mobile-overlay]");
    let lastFocused: Element | null = null;
    let mobileCleanup: (() => void) | null = null;
    if (openBtn && panel && overlay) {
      const setOpen = (next: boolean) => {
        panel.dataset.open = String(next);
        overlay.dataset.open = String(next);
        openBtn.setAttribute("aria-expanded", String(next));
        document.body.style.overflow = next ? "hidden" : "";
        if (next) {
          lastFocused = document.activeElement;
          const first = panel.querySelector<HTMLAnchorElement | HTMLButtonElement>(
            "a, button",
          );
          if (first) first.focus();
        } else if (lastFocused instanceof HTMLElement) {
          lastFocused.focus();
        }
      };
      const onOpen = () => setOpen(true);
      const onClose = () => setOpen(false);
      openBtn.addEventListener("click", onOpen);
      if (closeBtn) closeBtn.addEventListener("click", onClose);
      overlay.addEventListener("click", onClose);

      const onMobileKey = (e: KeyboardEvent) => {
        if (panel.dataset.open !== "true") return;
        if (e.key === "Escape") {
          setOpen(false);
          return;
        }
        if (e.key === "Tab") {
          const focusables = Array.from(
            panel.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>(
              'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          );
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", onMobileKey);
      const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>("a"));
      links.forEach((a) => a.addEventListener("click", onClose));
      mobileCleanup = () => {
        openBtn.removeEventListener("click", onOpen);
        closeBtn?.removeEventListener("click", onClose);
        overlay.removeEventListener("click", onClose);
        document.removeEventListener("keydown", onMobileKey);
        links.forEach((a) => a.removeEventListener("click", onClose));
      };
    }

    /* ---------- CTA tracking hook (noop, jako legacy) ---------- */
    const tracked = $$<HTMLElement>("[data-track]");
    const trackFns: Array<{ el: HTMLElement; fn: () => void }> = [];
    tracked.forEach((el) => {
      const fn = () => {};
      el.addEventListener("click", fn);
      trackFns.push({ el, fn });
    });

    /* ---------- Dynamic copyright year ---------- */
    const yearEl = $<HTMLElement>("[data-current-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* ---------- Kontakt form (FormSubmit → info@vevit.cz) ---------- */
    const form = $<HTMLFormElement>("#kontaktForm");
    let formCleanup: (() => void) | null = null;
    if (form) {
      const status = document.getElementById("kontaktStatus");
      const setStatus = (msg: string, ok: boolean) => {
        if (!status) return;
        status.hidden = false;
        status.textContent = msg;
        status.classList.toggle("is-success", ok);
        status.classList.toggle("is-error", !ok);
      };
      const onSubmit = async (e: Event) => {
        e.preventDefault();
        const btn = form.querySelector<HTMLButtonElement>(
          'button[type="submit"]',
        );
        const original = btn ? btn.textContent : "";
        const payload: Record<string, string> = {};
        new FormData(form).forEach((value, key) => {
          payload[key] = String(value);
        });
        payload._subject = payload._subject || "Zpráva z VeVit portálu";
        payload._template = payload._template || "table";
        if (btn) {
          btn.disabled = true;
          btn.textContent = t("contact.form.sending", "Odesílám...");
        }
        try {
          const res = await fetch("https://formsubmit.co/ajax/info@vevit.cz", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (String(data.success) === "true" || res.ok) {
            setStatus(t("contact.form.success", "Zpráva byla odeslána."), true);
            form.reset();
          } else {
            setStatus(
              t("contact.form.error", "Zprávu se nepodařilo odeslat."),
              false,
            );
          }
        } catch {
          setStatus(
            t("contact.form.error", "Zprávu se nepodařilo odeslat."),
            false,
          );
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.textContent = original;
          }
        }
      };
      form.addEventListener("submit", onSubmit);
      formCleanup = () => form.removeEventListener("submit", onSubmit);
    }

    /* ---------- Contact email: desktop copy ---------- */
    const emailLink = $<HTMLAnchorElement>("[data-contact-email]");
    let emailCleanup: (() => void) | null = null;
    if (
      emailLink &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      const email = emailLink.href.replace(/^mailto:/i, "").split("?")[0];
      const status = $<HTMLElement>("[data-email-copy-status]");
      const showStatus = (message: string, ok: boolean) => {
        if (!status) return;
        status.hidden = false;
        status.textContent = message;
        status.classList.toggle("is-success", ok);
        status.classList.toggle("is-error", !ok);
      };
      const fallbackCopy = () => {
        const input = document.createElement("textarea");
        input.value = email;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        return copied;
      };
      const onClick = async (event: Event) => {
        event.preventDefault();
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(email);
          } else if (!fallbackCopy()) {
            throw new Error("Clipboard unavailable");
          }
          showStatus(
            t("contact.form.emailCopied", `E-mail ${email} byl zkopírován.`).replace(
              "{EMAIL}",
              email,
            ),
            true,
          );
        } catch {
          showStatus(
            t(
              "contact.form.emailCopyError",
              `E-mail se nepodařilo zkopírovat. Adresa je ${email}.`,
            ).replace("{EMAIL}", email),
            false,
          );
        }
      };
      emailLink.addEventListener("click", onClick);
      emailCleanup = () => emailLink.removeEventListener("click", onClick);
    }

    /* ---------- Premium notification request ---------- */
    const notifyBtn = $<HTMLElement>("[data-premium-notify]");
    const kontaktForm = $<HTMLFormElement>("#kontaktForm");
    let notifyCleanup: (() => void) | null = null;
    if (notifyBtn && kontaktForm) {
      const onClick = () => {
        const subject = kontaktForm.querySelector<HTMLInputElement>(
          'input[name="_subject"]',
        );
        const email = document.getElementById("kf-email") as HTMLInputElement | null;
        const message = document.getElementById("kf-msg") as HTMLTextAreaElement | null;
        if (subject)
          subject.value = "Žádost o oznámení spuštění VeVit Premium";
        if (message && !message.value.trim()) {
          message.value = t(
            "landing.premium.notifyMessage",
            "Chci dostat zprávu, až spustíte VeVit Premium.",
          );
        }
        window.requestAnimationFrame(() =>
          email?.focus({ preventScroll: true }),
        );
      };
      notifyBtn.addEventListener("click", onClick);
      notifyCleanup = () => notifyBtn.removeEventListener("click", onClick);
    }

    return () => {
      if (onScroll) window.removeEventListener("scroll", onScroll);
      triggerClicks.forEach(({ el, fn }) => el.removeEventListener("click", fn));
      hoverCleanups.forEach((fn) => fn());
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeydown);
      mobileCleanup?.();
      trackFns.forEach(({ el, fn }) => el.removeEventListener("click", fn));
      formCleanup?.();
      emailCleanup?.();
      notifyCleanup?.();
    };
  }, []);

  // Re-aplikace legacy i18n + ikon při změně locale (localization.js dispatch).
  useEffect(() => {
    const onLocaleChange = () => applyLegacyUi();
    window.addEventListener("vevit:localechange", onLocaleChange);
    return () => window.removeEventListener("vevit:localechange", onLocaleChange);
  }, []);

  // Modulové skripty vkládáme imperativně mimo React render — React varuje
  // (a v client-only renderu <script> ani nespustí), pokud se <script> vrací
  // přímo z JSX. Injekce přes DOM API zachovává stejné chování jako legacy
  // <script type="module"> (provede se po parsování).
  useEffect(() => {
    const injected: HTMLScriptElement[] = [];
    for (const src of LEGACY_MODULE_SCRIPTS) {
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const script = document.createElement("script");
      script.type = "module";
      script.src = src;
      document.body.appendChild(script);
      injected.push(script);
    }
    return () => {
      injected.forEach((script) => script.remove());
    };
  }, []);

  return (
    <>
      {LEGACY_SCRIPTS.map((src) => (
        <Script
          key={src}
          src={src}
          strategy="afterInteractive"
          onReady={applyLegacyUi}
        />
      ))}
    </>
  );
}