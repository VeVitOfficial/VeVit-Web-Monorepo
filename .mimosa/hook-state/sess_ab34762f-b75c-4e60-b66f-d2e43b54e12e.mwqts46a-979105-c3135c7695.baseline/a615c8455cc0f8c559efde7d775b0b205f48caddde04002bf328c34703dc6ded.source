// Časová kalkulačka — trvání +/- a čas + trvání, živý výpočet.
(function () {
  'use strict';
  var seg = ToolUI.el('tc-mode'), dur = ToolUI.el('tc-dur'), clock = ToolUI.el('tc-clock');
  var result = ToolUI.el('tc-result');
  var mode = 'dur';

  // "HH:MM:SS" nebo "HH:MM" → sekundy. Vrací null při chybě.
  function parseT(s) {
    if (!s) return null;
    var parts = s.trim().split(':');
    if (parts.length < 2 || parts.length > 3) return null;
    var nums = parts.map(function (p) { return parseInt(p, 10); });
    if (nums.some(isNaN)) return null;
    var h = nums[0], m = nums[1], sec = nums.length === 3 ? nums[2] : 0;
    if (m < 0 || m > 59 || sec < 0 || sec > 59) return null;
    return h * 3600 + m * 60 + sec;
  }
  function fmtT(sec) {
    sec = Math.round(sec);
    var neg = sec < 0; sec = Math.abs(sec);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return (neg ? '−' : '') + p(h) + ':' + p(m) + ':' + p(s);
  }

  function compute() {
    if (mode === 'dur') {
      var a = parseT(ToolUI.el('tc-a').value), b = parseT(ToolUI.el('tc-b').value);
      if (a == null || b == null) { result.textContent = '—'; return; }
      var op = ToolUI.el('tc-op').value;
      var r = op === '-' ? a - b : a + b;
      result.textContent = fmtT(r);
    } else {
      var c = parseT(ToolUI.el('tc-c').value), d = parseT(ToolUI.el('tc-d').value);
      if (c == null || d == null) { result.textContent = '—'; return; }
      // čas dne modulo 24h
      var r = (c + d) % 86400; if (r < 0) r += 86400;
      result.textContent = fmtT(r);
    }
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    dur.classList.toggle('hidden', mode !== 'dur');
    clock.classList.toggle('hidden', mode !== 'clock');
    compute();
  });
  ['tc-a','tc-b','tc-c','tc-d'].forEach(function (id) { ToolUI.el(id).addEventListener('input', compute); });
  ToolUI.el('tc-op').addEventListener('change', compute);
  compute();
})();