// Spotřeba paliva — l/100 km ↔ mpg, živý výpočet.
(function () {
  'use strict';
  var seg = ToolUI.el('fc-mode'), inp = ToolUI.el('fc-in');
  var inLabel = ToolUI.el('fc-in-label');
  var out = ToolUI.el('fc-out'), outK = ToolUI.el('fc-out-k');
  var out2Row = ToolUI.el('fc-out2-row'), out2 = ToolUI.el('fc-out2'), out2K = ToolUI.el('fc-out2-k');
  var mode = 'l';

  // 1 galon US = 3,785411784 l; 1 galon UK = 4,54609 l; 100 km = 62,137 mil
  var KM_PER_MILE = 1.609344;

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function fmt(n) { return n.toLocaleString('cs-CZ', { maximumFractionDigits: 2 }); }

  function compute() {
    var x = num('fc-in');
    if (x == null || x <= 0) { out.textContent = '—'; out2.textContent = '—'; return; }
    if (mode === 'l') {
      // l/100km → mpg: (100 km / x litrů) * (l na galon) / (mil na 100 km)
      var mpgUs = (100 / x) * 3.785411784 / (100 / KM_PER_MILE);
      var mpgUk = (100 / x) * 4.54609 / (100 / KM_PER_MILE);
      outK.textContent = 'mpg (US)'; out.textContent = fmt(mpgUs);
      out2K.textContent = 'mpg (UK)'; out2.textContent = fmt(mpgUk); out2Row.classList.remove('hidden');
    } else {
      // mpg (US) → l/100km
      var l100 = (100 * 3.785411784) / (x * KM_PER_MILE);
      outK.textContent = 'l/100 km'; out.textContent = fmt(l100);
      out2Row.classList.add('hidden');
    }
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (mode === 'l') { inLabel.textContent = 'Spotřeba (l/100 km)'; inp.value = '7.5'; }
    else { inLabel.textContent = 'Spotřeba (mpg US)'; inp.value = '31'; }
    compute();
  });
  inp.addEventListener('input', compute);
  compute();
})();