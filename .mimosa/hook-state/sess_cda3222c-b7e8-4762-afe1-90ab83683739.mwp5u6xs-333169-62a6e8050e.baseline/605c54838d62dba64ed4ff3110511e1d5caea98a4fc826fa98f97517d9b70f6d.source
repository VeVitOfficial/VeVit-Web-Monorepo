// BMR a kalorie — Mifflin-St Jeor, živý výpočet.
(function () {
  'use strict';
  var bmrEl = ToolUI.el('bmr-bmr'), tdeeEl = ToolUI.el('bmr-tdee');

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function kc(n) { return Math.round(n).toLocaleString(document.documentElement.lang || 'cs') + ' kcal'; }

  function compute() {
    var sex = ToolUI.el('bmr-sex').value;
    var age = num('bmr-age'), h = num('bmr-height'), w = num('bmr-weight');
    var act = parseFloat(ToolUI.el('bmr-act').value) || 1.2;
    if (age == null || h == null || w == null || age<=0 || h<=0 || w<=0) {
      bmrEl.textContent = '—'; tdeeEl.textContent = '—'; return;
    }
    var bmr = 10 * w + 6.25 * h - 5 * age + (sex === 'f' ? -161 : 5);
    if (bmr < 0) bmr = 0;
    bmrEl.textContent = kc(bmr);
    tdeeEl.textContent = kc(bmr * act);
  }

  ['bmr-age','bmr-height','bmr-weight'].forEach(function (id) { ToolUI.el(id).addEventListener('input', compute); });
  ['bmr-sex','bmr-act'].forEach(function (id) { ToolUI.el(id).addEventListener('change', compute); });
  compute();
})();
