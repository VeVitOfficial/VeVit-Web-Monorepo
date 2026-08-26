// Složené úročení — živý výpočet v prohlížeči.
(function () {
  'use strict';
  var inv = ToolUI.el('ci-invested'), gain = ToolUI.el('ci-gain'), tot = ToolUI.el('ci-total');

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function kc(n) { return n.toLocaleString(document.documentElement.lang || 'cs', { maximumFractionDigits: 0 }) + ' Kč'; }

  function compute() {
    var P = num('ci-principal') || 0;
    var PMT = num('ci-pmt') || 0;
    var r = (num('ci-rate') || 0) / 100;
    var yrs = num('ci-years');
    var n = parseInt(ToolUI.el('ci-freq').value, 10) || 1;
    if (yrs == null || yrs <= 0) { inv.textContent='—'; gain.textContent='—'; tot.textContent='—'; return; }

    var periods = n * yrs;
    var i = r / n;
    var FVp = i === 0 ? P : P * Math.pow(1 + i, periods);
    var FVann = i === 0 ? PMT * periods : PMT * ((Math.pow(1 + i, periods) - 1) / i);
    // měsíční vklad → roční sazba / 12: pokud je frekvence ročně, považujeme PMT jako roční vklad
    // (pro jednoduchost předpokládáme PMT odpovídá frekvenci kapitalizace)
    var total = FVp + FVann;
    var invested = P + PMT * periods;
    inv.textContent = kc(invested);
    gain.textContent = kc(total - invested);
    tot.textContent = kc(total);
  }

  ['ci-principal','ci-pmt','ci-rate','ci-years'].forEach(function (id) { ToolUI.el(id).addEventListener('input', compute); });
  ToolUI.el('ci-freq').addEventListener('change', compute);
  compute();
})();
