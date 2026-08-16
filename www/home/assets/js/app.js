/* ===========================================
   VeVit, vevit.cz
   Vanilla JS interactions
   =========================================== */

(() => {
  'use strict';

  /* ---------- Lucide icons ---------- */
  const initIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  /* ---------- Sticky nav backdrop on scroll ---------- */
  const initNavScroll = () => {
    const nav = document.querySelector('[data-nav]');
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 20) nav.classList.add('nav-scrolled');
      else nav.classList.remove('nav-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  /* ---------- Nav dropdowns (Web apps / Desktop / Služby) ---------- */
  const initDropdown = () => {
    const triggers = document.querySelectorAll('[data-dropdown-trigger]');
    if (!triggers.length) return;

    const pairs = [];
    triggers.forEach((trigger) => {
      const menu = document.getElementById(trigger.getAttribute('aria-controls'));
      if (menu) pairs.push({ trigger, menu });
    });

    const closeAll = (except) => {
      pairs.forEach((p) => {
        if (p.trigger === except) return;
        p.menu.dataset.open = 'false';
        p.trigger.setAttribute('aria-expanded', 'false');
      });
    };

    const openPair = (p) => {
      closeAll(p.trigger);
      p.menu.dataset.open = 'true';
      p.trigger.setAttribute('aria-expanded', 'true');
    };
    const closePair = (p) => {
      p.menu.dataset.open = 'false';
      p.trigger.setAttribute('aria-expanded', 'false');
    };

    pairs.forEach(({ trigger, menu }) => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
        if (willOpen) openPair({ trigger, menu });
        else closePair({ trigger, menu });
      });

      // Hover open/close on desktop pointers
      const wrap = trigger.closest('.dropdown-wrap');
      if (wrap && window.matchMedia('(hover: hover)').matches) {
        let timer;
        wrap.addEventListener('mouseenter', () => { clearTimeout(timer); openPair({ trigger, menu }); });
        wrap.addEventListener('mouseleave', () => { timer = setTimeout(() => closePair({ trigger, menu }), 180); });
      }
    });

    document.addEventListener('click', (e) => {
      pairs.forEach(({ trigger, menu }) => {
        if (trigger.getAttribute('aria-expanded') !== 'true') return;
        if (menu.contains(e.target) || trigger.contains(e.target)) return;
        closePair({ trigger, menu });
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      pairs.forEach(({ trigger, menu }) => {
        if (trigger.getAttribute('aria-expanded') === 'true') {
          closePair({ trigger, menu });
          trigger.focus();
        }
      });
    });
  };

  /* ---------- Mobile menu (hamburger) ---------- */
  const initMobileMenu = () => {
    const open    = document.querySelector('[data-mobile-open]');
    const close   = document.querySelector('[data-mobile-close]');
    const panel   = document.querySelector('[data-mobile-panel]');
    const overlay = document.querySelector('[data-mobile-overlay]');
    if (!open || !panel || !overlay) return;

    let lastFocused = null;

    const setOpen = (next) => {
      panel.dataset.open   = String(next);
      overlay.dataset.open = String(next);
      open.setAttribute('aria-expanded', String(next));
      document.body.style.overflow = next ? 'hidden' : '';

      if (next) {
        lastFocused = document.activeElement;
        const first = panel.querySelector('a, button');
        if (first) first.focus();
      } else if (lastFocused) {
        lastFocused.focus();
      }
    };

    open.addEventListener('click', () => setOpen(true));
    if (close) close.addEventListener('click', () => setOpen(false));
    overlay.addEventListener('click', () => setOpen(false));

    // Close on ESC + simple focus trap
    document.addEventListener('keydown', (e) => {
      if (panel.dataset.open !== 'true') return;

      if (e.key === 'Escape') { setOpen(false); return; }

      if (e.key === 'Tab') {
        const focusables = panel.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    // Close panel when a link inside is clicked
    panel.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => setOpen(false));
    });
  };

  /* ---------- CTA tracking hook ---------- */
  const initTracking = () => {
    document.querySelectorAll('[data-track]').forEach((el) => {
      el.addEventListener('click', () => {
        // Hook point for real analytics integration.
      });
    });
  };

  /* ---------- Dynamic copyright year ---------- */
  const initCurrentYear = () => {
    const year = document.querySelector('[data-current-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  /* ---------- Account XP bar (visible only when logged in) ---------- */
  /* ---------- Kontakt form (FormSubmit → info@vevit.cz) ---------- */
  const initKontaktForm = () => {
    const form = document.getElementById('kontaktForm');
    if (!form) return;
    const status = document.getElementById('kontaktStatus');

    const setStatus = (msg, ok) => {
      if (!status) return;
      status.hidden = false;
      status.textContent = msg;
      status.classList.toggle('is-success', ok);
      status.classList.toggle('is-error', !ok);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn ? btn.textContent : '';

      const payload = {};
      new FormData(form).forEach((value, key) => { payload[key] = value; });
      payload._subject = payload._subject || 'Zpráva z VeVit portálu';
      payload._template = payload._template || 'table';

      if (btn) { btn.disabled = true; btn.textContent = 'Odesílám…'; }

      try {
        const res = await fetch('https://formsubmit.co/ajax/info@vevit.cz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (String(data.success) === 'true' || res.ok) {
          setStatus('Zpráva odeslána, děkujeme!', true);
          form.reset();
        } else {
          setStatus('Odeslání se nezdařilo. Zkuste to prosím znovu.', false);
        }
      } catch {
        setStatus('Odeslání se nezdařilo. Zkuste to prosím znovu.', false);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = original; }
      }
    });
  };

  /* ---------- Contact email: desktop copy, mobile mail app ---------- */
  const initContactEmail = () => {
    const link = document.querySelector('[data-contact-email]');
    if (!link) return;

    const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isDesktopPointer) return;

    const email = link.href.replace(/^mailto:/i, '').split('?')[0];
    const status = document.querySelector('[data-email-copy-status]');
    const showStatus = (message, ok) => {
      if (!status) return;
      status.hidden = false;
      status.textContent = message;
      status.classList.toggle('is-success', ok);
      status.classList.toggle('is-error', !ok);
    };
    const fallbackCopy = () => {
      const input = document.createElement('textarea');
      input.value = email;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      return copied;
    };

    link.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(email);
        } else if (!fallbackCopy()) {
          throw new Error('Clipboard unavailable');
        }
        showStatus(`E-mail ${email} byl zkopírován.`, true);
      } catch {
        showStatus(`E-mail se nepodařilo zkopírovat. Adresa je ${email}.`, false);
      }
    });
  };

  /* ---------- Premium notification request ---------- */
  const initPremiumNotify = () => {
    const trigger = document.querySelector('[data-premium-notify]');
    const form = document.getElementById('kontaktForm');
    if (!trigger || !form) return;

    trigger.addEventListener('click', () => {
      const subject = form.querySelector('input[name="_subject"]');
      const email = document.getElementById('kf-email');
      const message = document.getElementById('kf-msg');

      if (subject) subject.value = 'Žádost o oznámení spuštění VeVit Premium';
      if (message && !message.value.trim()) {
        message.value = 'Chci dostat zprávu, až spustíte VeVit Premium.';
      }

      window.requestAnimationFrame(() => email?.focus({ preventScroll: true }));
    });
  };

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initIcons();
    initNavScroll();
    initDropdown();
    initMobileMenu();
    initTracking();
    initCurrentYear();
    initKontaktForm();
    initContactEmail();
    initPremiumNotify();
  });
})();
