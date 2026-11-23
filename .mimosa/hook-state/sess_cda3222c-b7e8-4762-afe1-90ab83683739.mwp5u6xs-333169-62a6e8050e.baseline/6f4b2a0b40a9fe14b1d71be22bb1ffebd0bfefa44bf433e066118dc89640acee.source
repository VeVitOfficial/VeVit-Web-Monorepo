/* ============================================
   VeVit Premium dropdown, billing toggle, tier state, stats counter
   ============================================ */
(function () {
  'use strict';

  /* ---------- Premium dropdown in nav ---------- */
  const initPremiumDropdown = () => {
    const trigger = document.querySelector('[data-premium-trigger]');
    const menu    = document.querySelector('[data-premium-menu]');
    if (!trigger || !menu) return;

    const open = () => {
      menu.dataset.open = 'true';
      trigger.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      menu.dataset.open = 'false';
      trigger.setAttribute('aria-expanded', 'false');
    };
    const toggle = () => (menu.dataset.open === 'true' ? close() : open());

    trigger.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    menu.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // hover open on desktop
    const wrap = trigger.closest('.dropdown-wrap');
    if (wrap && window.matchMedia('(hover: hover)').matches) {
      let timer;
      wrap.addEventListener('mouseenter', () => { clearTimeout(timer); open(); });
      wrap.addEventListener('mouseleave', () => { timer = setTimeout(close, 180); });
    }
  };

  /* ---------- Billing toggle ---------- */
  const initBillingToggle = () => {
    const buttons = document.querySelectorAll('.billing-btn[data-billing]');
    if (!buttons.length) return;

    const setBilling = (mode) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.billing === mode)));

      // toggle price spans
      document.querySelectorAll('[data-price-monthly]').forEach((el) => { el.hidden = mode !== 'monthly'; });
      document.querySelectorAll('[data-price-yearly]').forEach((el)  => { el.hidden = mode !== 'yearly'; });
      document.querySelectorAll('[data-period-monthly]').forEach((el) => { el.hidden = mode !== 'monthly'; });
      document.querySelectorAll('[data-period-yearly]').forEach((el)  => { el.hidden = mode !== 'yearly'; });
      document.querySelectorAll('[data-alt-monthly]').forEach((el)   => { el.hidden = mode !== 'monthly'; });
      document.querySelectorAll('[data-alt-yearly]').forEach((el)    => { el.hidden = mode !== 'yearly'; });

      document.documentElement.dataset.billing = mode;
    };

    buttons.forEach((b) => b.addEventListener('click', () => setBilling(b.dataset.billing)));
  };

  /* ---------- Stripe checkout stub ---------- */
  const initCheckoutStubs = () => {
    document.querySelectorAll('[data-tier-cta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.tierCta;
        const billing = document.documentElement.dataset.billing || 'monthly';
        btn.disabled = true;
        const original = btn.textContent;
        btn.textContent = 'Přesměrovávám…';
        // TODO: real prod calls /api/stripe-checkout.php
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = original;
        }, 1500);
      });
    });
  };

  /* ---------- Animated stat counter ---------- */
  const initStatsCounter = () => {
    const els = document.querySelectorAll('[data-stat-target]');
    if (!els.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.statTarget, 10);
      if (isNaN(target)) return;
      const dur = 1400;
      const start = performance.now();
      const fmt = new Intl.NumberFormat('cs-CZ');
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt.format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      els.forEach(animate);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.statDone) {
          entry.target.dataset.statDone = '1';
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    els.forEach((el) => io.observe(el));
  };

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initPremiumDropdown();
    initBillingToggle();
    initCheckoutStubs();
    initStatsCounter();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  });
})();
