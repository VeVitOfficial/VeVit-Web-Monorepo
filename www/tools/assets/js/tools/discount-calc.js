// Kalkulačka slev — vícenásobné slevy (postupně), živý výpočet.
(function () {
  'use strict';
  var finalEl = ToolUI.el('dc-final'), saved = ToolUI.el('dc-saved'), total = ToolUI.el('dc-total');

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function kc(n) { return n.toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + ' Kč'; }

  function compute() {
    var p = num('dc-price'), d1 = num('dc-d1'), d2 = num('dc-d2');
    if (p == null) { finalEl.textContent = '—'; saved.textContent = '—'; total.textContent = '—'; return; }
    d1 = d1 == null ? 0 : Math.max(0, Math.min(100, d1));
    d2 = d2 == null ? 0 : Math.max(0, Math.min(100, d2));
    var after1 = p * (1 - d1 / 100);
    var after2 = after1 * (1 - d2 / 100);
    finalEl.textContent = kc(after2);
    saved.textContent = kc(p - after2);
    var t = p > 0 ? (1 - after2 / p) * 100 : 0;
    total.textContent = t.toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + ' %';
  }

  ['dc-price', 'dc-d1', 'dc-d2'].forEach(function (id) { ToolUI.el(id).addEventListener('input', compute); });
  compute();
})();