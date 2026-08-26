// Průměr známek — vážený, dynamické řádky, živý výpočet.
(function () {
  'use strict';
  var rows = ToolUI.el('ga-rows'), addBtn = ToolUI.el('ga-add');
  var avg = ToolUI.el('ga-avg'), count = ToolUI.el('ga-count');
  var seq = 0;

  function buildRow() {
    seq++;
    var row = document.createElement('div'); row.className = 'row ga-row';
    row.style.cssText = 'gap:0.5rem;flex-wrap:wrap;align-items:end';

    var g = document.createElement('select'); g.className = 'input'; g.style.width = '7rem';
    g.setAttribute('aria-label', 'Známka');
    [1,2,3,4,5].forEach(function (v) {
      var o = document.createElement('option'); o.value = v; o.textContent = v; g.appendChild(o);
    });
    g.value = 1;

    var w = document.createElement('input'); w.type = 'number'; w.className = 'input'; w.style.width = '6rem';
    w.min = 1; w.max = 10; w.step = 1; w.value = 1; w.inputMode = 'numeric';
    w.setAttribute('aria-label', 'Váha');

    var rm = document.createElement('button'); rm.type = 'button';
    rm.className = 'btn btn-ghost btn-icon-sm'; rm.setAttribute('aria-label', 'Odebrat známku');
    rm.appendChild(window.Icon ? Icon.build('X', 16) : document.createTextNode('×'));
    rm.addEventListener('click', function () { row.remove(); compute(); });

    var lab1 = document.createElement('span'); lab1.className = 'muted'; lab1.style.fontSize = '0.8rem'; lab1.textContent = 'Známka';
    var lab2 = document.createElement('span'); lab2.className = 'muted'; lab2.style.fontSize = '0.8rem'; lab2.textContent = 'Váha';

    row.appendChild(lab1); row.appendChild(g); row.appendChild(lab2); row.appendChild(w); row.appendChild(rm);
    [g, w].forEach(function (el) { el.addEventListener('input', compute); el.addEventListener('change', compute); });
    rows.appendChild(row);
  }

  function compute() {
    var items = rows.querySelectorAll('.ga-row');
    var sum = 0, wsum = 0, n = 0;
    Array.prototype.forEach.call(items, function (row) {
      var sel = row.querySelector('select'); var wEl = row.querySelector('input[type=number]');
      var g = parseFloat(sel.value), w = parseFloat(wEl.value);
      if (isNaN(w) || w <= 0) w = 1;
      sum += g * w; wsum += w; n++;
    });
    count.textContent = String(n);
    avg.textContent = (n === 0 || wsum === 0) ? '—' : (sum / wsum).toLocaleString(document.documentElement.lang || 'cs', { maximumFractionDigits: 3 });
  }

  addBtn.addEventListener('click', function () { buildRow(); compute(); });
  buildRow(); buildRow(); buildRow(); compute();
})();
