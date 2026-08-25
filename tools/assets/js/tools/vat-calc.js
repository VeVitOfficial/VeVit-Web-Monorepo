// DPH kalkulačka — přidat / odebrat DPH, živý výpočet.
(function () {
  'use strict';
  var seg = ToolUI.el('vat-mode'), rateSel = ToolUI.el('vat-rate');
  var customWrap = ToolUI.el('vat-custom-wrap'), custom = ToolUI.el('vat-custom');
  var net = ToolUI.el('vat-net'), vat = ToolUI.el('vat-vat'), gross = ToolUI.el('vat-gross');
  var mode = 'add';

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function kc(n) { return n.toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + ' Kč'; }

  function rate() {
    if (rateSel.value === 'custom') return num('vat-custom') == null ? 0 : Math.max(0, Math.min(100, num('vat-custom')));
    return parseFloat(rateSel.value) || 0;
  }

  function compute() {
    var amt = num('vat-amount');
    if (amt == null) { net.textContent = '—'; vat.textContent = '—'; gross.textContent = '—'; return; }
    var r = rate();
    var n, v, g;
    if (mode === 'add') { n = amt; v = amt * r / 100; g = amt + v; }
    else { g = amt; n = amt / (1 + r / 100); v = g - n; }
    net.textContent = kc(n); vat.textContent = kc(v); gross.textContent = kc(g);
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    compute();
  });

  rateSel.addEventListener('change', function () {
    customWrap.classList.toggle('hidden', rateSel.value !== 'custom');
    compute();
  });
  ['vat-amount', 'vat-custom'].forEach(function (id) { ToolUI.el(id).addEventListener('input', compute); });
  compute();
})();