(function () {
  'use strict';

  var rail = document.getElementById('category-rail');
  var sectionsView = document.getElementById('sections-view');
  if (!rail || !sectionsView) return;

  var links = Array.prototype.slice.call(rail.querySelectorAll('[data-section]'));
  var entries = links.map(function (link) {
    return { link: link, section: document.getElementById(link.dataset.section) };
  }).filter(function (entry) { return !!entry.section; });
  var activeId = '';
  var frame = 0;

  function setActive(id) {
    if (!id || id === activeId) return;
    activeId = id;
    entries.forEach(function (entry) {
      var active = entry.section.id === id;
      entry.link.classList.toggle('is-active', active);
      if (active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    });
    document.querySelectorAll('#cat-nav [data-target]').forEach(function (chip) {
      chip.classList.toggle('active', chip.dataset.target === id);
    });
  }

  function update() {
    frame = 0;
    if (sectionsView.classList.contains('hidden') || !entries.length) return;
    var probe = Math.min(window.innerHeight * 0.38, 360);
    var current = entries[0];
    entries.forEach(function (entry) {
      var rect = entry.section.getBoundingClientRect();
      if (rect.top <= probe) current = entry;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = entries[entries.length - 1];
    }
    setActive(current.section.id);
  }

  function requestUpdate() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  function syncVisibility() {
    rail.classList.toggle('hidden', sectionsView.classList.contains('hidden'));
    requestUpdate();
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var section = document.getElementById(link.dataset.section);
      if (!section) return;
      event.preventDefault();
      setActive(section.id);
      section.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
      history.replaceState(null, '', location.pathname + location.search + '#' + section.id);
    });
  });

  new MutationObserver(syncVisibility).observe(sectionsView, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  syncVisibility();
}());
