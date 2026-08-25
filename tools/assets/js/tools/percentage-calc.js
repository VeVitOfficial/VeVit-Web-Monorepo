// Kalkulačka procent — živý výpočet v prohlížeči.
(function () {
  'use strict';
  var seg = ToolUI.el('pc-mode');
  var result = ToolUI.el('pc-result');
  var detailRow = ToolUI.el('pc-detail-row');
  var detailK = ToolUI.el('pc-detail-k');
  var detailV = ToolUI.el('pc-detail-v');
  var mode = 'of';

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v == null || v === '') return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function fmt(n) {
    if (n == null || isNaN(n)) return '—';
    if (!isFinite(n)) return '—';
    var abs = Math.abs(n);
    var s = abs >= 1000 || (abs > 0 && abs < 0.01) ? n.toPrecision(6) : (Math.round(n * 100000) / 100000).toString();
    // odstraň přebytečné nuly u exponentu
    return parseFloat(s).toLocaleString('cs-CZ', { maximumFractionDigits: 6 });
  }

  function compute() {
    detailRow.classList.add('hidden');
    if (mode === 'of') {
      var a = num('pc-of-a'), b = num('pc-of-b');
      if (a == null || b == null) { result.textContent = '—'; return; }
      result.textContent = fmt(a / 100 * b);
    } else if (mode === 'pct') {
      var pa = num('pc-pct-a'), pb = num('pc-pct-b');
      if (pa == null || pb == null || pb === 0) { result.textContent = '—'; return; }
      result.textContent = fmt(pa / pb * 100) + ' %';
    } else {
      var f = num('pc-dl-from'), t = num('pc-dl-to');
      if (f == null || t == null) { result.textContent = '—'; return; }
      if (f === 0) { result.textContent = '—'; return; }
      var pct = (t - f) / f * 100;
      result.textContent = (pct >= 0 ? '+' : '') + fmt(pct) + ' %';
      detailK.textContent = 'Rozdíl';
      detailV.textContent = (t - f >= 0 ? '+' : '') + fmt(t - f);
      detailRow.classList.remove('hidden');
    }
  }

  function setMode(m) {
    mode = m;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      var on = b.dataset.mode === m;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.pc-group'), function (g) {
      g.classList.toggle('hidden', g.dataset.for !== m);
    });
    compute();
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (b) setMode(b.dataset.mode);
  });

  ['pc-of-a', 'pc-of-b', 'pc-pct-a', 'pc-pct-b', 'pc-dl-from', 'pc-dl-to'].forEach(function (id) {
    ToolUI.el(id).addEventListener('input', compute);
  });

  setMode('of');
})();