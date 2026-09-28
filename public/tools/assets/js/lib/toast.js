// Minimální toast notifikace (náhrada sonner).
(function () {
  function ensureContainer() {
    var c = document.querySelector('.toaster');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toaster';
      document.body.appendChild(c);
    }
    return c;
  }

  function icon(kind) {
    if (kind === 'success') return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
    if (kind === 'error') return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>';
    return '';
  }

  function show(message, kind) {
    var c = ensureContainer();
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    // Ikona je konstantní SVG (ne z uživatelského vstupu), zpráva jde přes textContent (bezpečné vůči XSS).
    t.innerHTML = icon(kind);
    var span = document.createElement('span');
    span.textContent = message;
    t.appendChild(span);
    c.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .2s, transform .2s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      setTimeout(function () { t.remove(); }, 220);
    }, 2400);
  }

  window.toast = {
    success: function (m) { show(m, 'success'); },
    error: function (m) { show(m, 'error'); },
  };
})();