(function initCatalogPage() {
  'use strict';
  const filterDrawer = document.getElementById('mobileFilterDrawer');
  const filterBtn = document.getElementById('mobileFilterBtn');
  const filterClose = document.getElementById('filterDrawerClose');
  const filterBackdrop = document.getElementById('filterBackdrop');
  function openFilter() {
    if (!filterDrawer) return;
    filterDrawer.classList.add('open');
    filterDrawer.removeAttribute('inert');
    document.body.classList.add('drawer-open');
    filterBtn?.setAttribute('aria-expanded', 'true');
    setTimeout(() => filterClose?.focus(), 300);
  }
  function closeFilter() {
    if (!filterDrawer) return;
    filterDrawer.classList.remove('open');
    filterDrawer.setAttribute('inert', '');
    document.body.classList.remove('drawer-open');
    filterBtn?.setAttribute('aria-expanded', 'false');
    filterBtn?.focus();
  }
  filterBtn?.addEventListener('click', openFilter);
  filterClose?.addEventListener('click', closeFilter);
  filterBackdrop?.addEventListener('click', closeFilter);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeFilter(); });
}());
