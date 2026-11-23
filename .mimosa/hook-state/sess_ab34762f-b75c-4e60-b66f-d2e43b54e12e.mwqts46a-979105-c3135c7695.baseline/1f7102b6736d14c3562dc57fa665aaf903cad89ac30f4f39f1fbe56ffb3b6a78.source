(function initStoreHeader() {
  'use strict';
  const body = document.body;
  window.VEVIT_ACCOUNT_CONFIG = {
    meUrl: body.dataset.vevitMeUrl || '/account/api/me.php',
    loginUrl: body.dataset.vevitLoginUrl || '/account/login',
    appOrigin: body.dataset.vevitAppOrigin || '',
  };

  const drawer = document.getElementById('mobileDrawer');
  const drawerPanel = drawer?.querySelector('.mobile-drawer__panel');
  const menuBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('drawerCloseBtn');
  const backdrop = document.getElementById('drawerBackdrop');
  let lastFocusedEl = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocusedEl = document.activeElement;
    drawer.classList.add('open');
    drawer.removeAttribute('inert');
    document.body.classList.add('drawer-open');
    menuBtn?.setAttribute('aria-expanded', 'true');
    setTimeout(() => drawerPanel?.querySelector('a, button, input')?.focus(), 300);
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('inert', '');
    document.body.classList.remove('drawer-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    lastFocusedEl?.focus();
  }
  window.closeStoreDrawer = closeDrawer;
  menuBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDrawer(); });
  drawer?.addEventListener('keydown', event => {
    if (!drawer.classList.contains('open') || event.key !== 'Tab') return;
    const focusable = Array.from(drawer.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(element => !element.closest('[tabindex="-1"]') && !element.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && drawer?.classList.contains('open')) closeDrawer();
  });
}());
