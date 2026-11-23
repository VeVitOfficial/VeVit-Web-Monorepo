// Kontrola kontrastu dle WCAG 2.1, čistě client-side.
(function () {
  'use strict';
  var fg = ToolUI.el('cc-fg'), bg = ToolUI.el('cc-bg'), fgPick = ToolUI.el('cc-fg-pick'), bgPick = ToolUI.el('cc-bg-pick');
  var preview = ToolUI.el('cc-preview');
  var ratio = ToolUI.el('cc-ratio'), err = ToolUI.el('cc-error');
  var aa = ToolUI.el('cc-aa'), aaL = ToolUI.el('cc-aa-large'), aaa = ToolUI.el('cc-aaa'), aaaL = ToolUI.el('cc-aaa-large');

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function badge(ok) { var s = document.createElement('span'); s.textContent = ok ? '✅ Splňuje' : '❌ Nesplňuje'; s.style.color = ok ? '#86efac' : '#fca5a5'; return s; }

  function parseColor(str) {
    var probe = document.createElement('div');
    probe.style.color = 'rgb(0,0,0)';
    probe.style.color = str;
    if (!probe.style.color) return null;
    probe.style.position = 'absolute'; probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    var c = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    var m = c.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(rgb) { return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]); }
  function toHex(rgb) { return '#' + rgb.map(function (c) { var h = c.toString(16); return h.length < 2 ? '0' + h : h; }).join(''); }

  function compute() {
    clearErr();
    var f = parseColor(fg.value), b = parseColor(bg.value);
    if (!f) return fail('Neplatná barva textu: "' + fg.value + '".');
    if (!b) return fail('Neplatná barva pozadí: "' + bg.value + '".');
    fgPick.value = toHex(f); bgPick.value = toHex(b);
    preview.style.color = fg.value;
    preview.style.background = bg.value;
    var L1 = lum(f), L2 = lum(b);
    var r = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    ratio.textContent = r.toFixed(2) + ' : 1';
    [[aa, r >= 4.5], [aaL, r >= 3], [aaa, r >= 7], [aaaL, r >= 4.5]].forEach(function (p) {
      p[0].textContent = ''; p[0].appendChild(badge(p[1]));
    });
  }

  fg.addEventListener('input', compute);
  bg.addEventListener('input', compute);
  fgPick.addEventListener('input', function () { fg.value = fgPick.value; compute(); });
  bgPick.addEventListener('input', function () { bg.value = bgPick.value; compute(); });
  compute();
})();