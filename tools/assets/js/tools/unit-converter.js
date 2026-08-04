// Převodník jednotek — délka, hmotnost, teplota, objem, rychlost. Client-side.
(function () {
  'use strict';
  // Každá jednotka má koeficient vůči základní jednotce kategorie (kromě teploty).
  var UNITS = {
    length: { base: 'm', items: [
      ['mm', 'Milimetr', 0.001], ['cm', 'Centimetr', 0.01], ['m', 'Metr', 1],
      ['km', 'Kilometr', 1000], ['in', 'Palec', 0.0254], ['ft', 'Stopa', 0.3048],
      ['yd', 'Yard', 0.9144], ['mi', 'Míle', 1609.344], ['nmi', 'Námořní míle', 1852]
    ]},
    mass: { base: 'kg', items: [
      ['mg', 'Miligram', 0.000001], ['g', 'Gram', 0.001], ['kg', 'Kilogram', 1],
      ['t', 'Tuna', 1000], ['lb', 'Libra', 0.45359237], ['oz', 'Unce', 0.028349523], ['ct', 'Karat', 0.0002]
    ]},
    volume: { base: 'l', items: [
      ['ml', 'Mililitr', 0.001], ['l', 'Litr', 1], ['m3', 'Metr krychlový', 1000],
      ['gal', 'Galon (US)', 3.785411784], ['pt', 'Pinta (US)', 0.473176473], ['cup', 'Hránek (US)', 0.236588236],
      ['tbsp', 'Lžíce', 0.0147867648], ['tsp', 'Lžička', 0.00492892159]
    ]},
    speed: { base: 'm/s', items: [
      ['m/s', 'Metr za sekundu', 1], ['km/h', 'Kilometr za hodinu', 0.277777778],
      ['mph', 'Míle za hodinu', 0.44704], ['knot', 'Uzel', 0.514444444], ['ft/s', 'Stopa za sekundu', 0.3048]
    ]}
  };
  // Teplota: převodní funkce přes C jako mezistupeň.
  var TEMP = [
    ['C', 'Celsius'], ['F', 'Fahrenheit'], ['K', 'Kelvin']
  ];
  function toC(v, u) { return u === 'C' ? v : u === 'F' ? (v - 32) * 5 / 9 : v - 273.15; }
  function fromC(c, u) { return u === 'C' ? c : u === 'F' ? c * 9 / 5 + 32 : c + 273.15; }

  var seg = ToolUI.el('uc-cat');
  var valEl = ToolUI.el('uc-value');
  var fromSel = ToolUI.el('uc-from');
  var toSel = ToolUI.el('uc-to');
  var result = ToolUI.el('uc-result');
  var resultK = ToolUI.el('uc-result-k');
  var cat = 'length';

  function fillUnits() {
    var list = (cat === 'temp') ? TEMP : UNITS[cat].items.map(function (u) { return [u[0], u[1]]; });
    var rebuild = function (sel, keep) {
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      list.forEach(function (u) {
        var o = document.createElement('option');
        o.value = u[0];
        o.textContent = u[1] + ' (' + u[0] + ')';
        sel.appendChild(o);
      });
      sel.value = keep || list[0][0];
    };
    rebuild(fromSel, fromSel.value && list.some(function (u) { return u[0] === fromSel.value; }) ? fromSel.value : list[0][0]);
    rebuild(toSel, list[Math.min(1, list.length - 1)][0]);
  }

  function fmt(n) {
    if (n == null || isNaN(n) || !isFinite(n)) return '—';
    var abs = Math.abs(n);
    if (abs === 0) return '0';
    var s = abs >= 1e6 || abs < 1e-4 ? n.toExponential(4) : (Math.round(n * 1e6) / 1e6).toString();
    return parseFloat(s).toLocaleString('cs-CZ', { maximumFractionDigits: 6 });
  }

  function compute() {
    var v = parseFloat(valEl.value);
    if (isNaN(v)) { result.textContent = '—'; resultK.textContent = 'Výsledek'; return; }
    var from = fromSel.value, to = toSel.value;
    var out;
    if (cat === 'temp') {
      out = fromC(toC(v, from), to);
    } else {
      var items = UNITS[cat].items;
      var fc = items.filter(function (u) { return u[0] === from; })[0][2];
      var tc = items.filter(function (u) { return u[0] === to; })[0][2];
      out = v * fc / tc;
    }
    result.textContent = fmt(out) + ' ' + to;
    resultK.textContent = v + ' ' + from + ' =';
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b;
      x.classList.toggle('active', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    fillUnits();
    compute();
  });

  ToolUI.el('uc-swap').addEventListener('click', function () {
    var a = fromSel.value, b = toSel.value;
    fromSel.value = b; toSel.value = a;
    compute();
  });

  [valEl, fromSel, toSel].forEach(function (elx) {
    elx.addEventListener('input', compute);
    elx.addEventListener('change', compute);
  });

  fillUnits();
  compute();
})();