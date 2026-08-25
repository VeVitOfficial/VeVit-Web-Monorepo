// BMI kalkulačka — živý výpočet v prohlížeči.
(function () {
  'use strict';
  var val = ToolUI.el('bmi-val'), cat = ToolUI.el('bmi-cat');
  var idealRow = ToolUI.el('bmi-ideal-row'), ideal = ToolUI.el('bmi-ideal');

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function catOf(b) {
    if (b < 18.5) return 'Podváha';
    if (b < 25) return 'Normální váha';
    if (b < 30) return 'Nadváha';
    return 'Obezita';
  }

  function compute() {
    var W = num('bmi-weight'), H = num('bmi-height');
    if (W == null || H == null || H <= 0) {
      val.textContent = '—'; cat.textContent = '—'; idealRow.classList.add('hidden'); return;
    }
    var m = H / 100, bmi = W / (m * m);
    val.textContent = bmi.toLocaleString('cs-CZ', { maximumFractionDigits: 1 });
    cat.textContent = catOf(bmi);
    var lo = 18.5 * m * m, hi = 24.9 * m * m;
    ideal.textContent = lo.toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + '–' + hi.toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' kg';
    idealRow.classList.remove('hidden');
  }

  ['bmi-weight', 'bmi-height'].forEach(function (id) { ToolUI.el(id).addEventListener('input', compute); });
  compute();
})();