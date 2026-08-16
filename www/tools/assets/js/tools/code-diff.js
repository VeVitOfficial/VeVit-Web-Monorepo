// Code diff — porovnání dvou textů po řádcích (jsdiff, lazy-load). Čistě client-side.
(function () {
  'use strict';
  var left = ToolUI.el('cd-left'), right = ToolUI.el('cd-right');
  var run = ToolUI.el('cd-run'), out = ToolUI.el('cd-out'), stat = ToolUI.el('cd-stat');

  function ensure(cb) {
    if (window.Diff) return cb();
    ToolUI.loadScript('/tools/assets/js/lib/diff.min.js', function (ok) {
      if (!ok || !window.Diff) { out.textContent = 'Knihovnu diff se nepodařilo načíst.'; return; }
      cb();
    });
  }

  function cell(text, color, bg) {
    var d = document.createElement('div');
    d.textContent = text;
    d.style.cssText = 'padding:0.1rem 0.75rem;font-family:ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;color:' + color + ';background:' + bg;
    return d;
  }

  function render(parts) {
    out.textContent = '';
    var added = 0, removed = 0;
    var wrap = document.createElement('div');
    parts.forEach(function (p) {
      var text = p.value;
      if (text.charAt(text.length - 1) === '\n') text = text.slice(0, -1);
      var lines = text.split('\n');
      lines.forEach(function (line) {
        var row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(255,255,255,0.05)';
        var l, r;
        if (p.added) {
          l = cell('', '', 'transparent'); r = cell(line, '#86efac', 'rgba(34,197,94,0.15)'); added++;
        } else if (p.removed) {
          l = cell(line, '#fca5a5', 'rgba(239,68,68,0.15)'); r = cell('', '', 'transparent'); removed++;
        } else {
          l = cell(line, 'var(--muted,#9ca3af)', 'transparent'); r = cell(line, 'var(--muted,#9ca3af)', 'transparent');
        }
        row.appendChild(l); row.appendChild(r);
        wrap.appendChild(row);
      });
    });
    out.appendChild(wrap);
    stat.textContent = '+ ' + added + ' řádků přidáno · - ' + removed + ' odebráno';
  }

  function compute() {
    if (!left.value && !right.value) { out.textContent = ''; stat.textContent = ''; return; }
    ensure(function () {
      try { render(window.Diff.diffLines(left.value, right.value)); }
      catch (e) { out.textContent = 'Chyba: ' + e.message; }
    });
  }

  run.addEventListener('click', compute);
})();