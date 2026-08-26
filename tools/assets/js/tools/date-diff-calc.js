// Rozdíl datumů — živý výpočet v prohlížeči.
(function () {
  'use strict';
  var from = ToolUI.el('dd-from'), to = ToolUI.el('dd-to');
  var days = ToolUI.el('dd-days'), weeks = ToolUI.el('dd-weeks');
  var months = ToolUI.el('dd-months'), years = ToolUI.el('dd-years'), hours = ToolUI.el('dd-hours');

  function parse(id) {
    var v = ToolUI.el(id).value;
    if (!v) return null;
    var d = new Date(v + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  function fmt(n, u) { return n.toLocaleString(document.documentElement.lang || 'cs', { maximumFractionDigits: 2 }) + (u ? ' ' + u : ''); }
  function monthsBetween(a, b) {
    return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() - a.getDate()) / 32;
  }

  function compute() {
    var f = parse('dd-from'), t = parse('dd-to');
    if (!f || !t) { ['dd-days','dd-weeks','dd-months','dd-years','dd-hours'].forEach(function(id){ToolUI.el(id).textContent='—';}); return; }
    var ms = t - f, d = Math.abs(Math.round(ms / 86400000));
    days.textContent = fmt(d, 'dní');
    weeks.textContent = fmt(d / 7, 'týdnů');
    months.textContent = fmt(Math.abs(monthsBetween(f, t)), 'měsíců');
    years.textContent = fmt(d / 365.25, 'roků');
    hours.textContent = fmt(Math.abs(Math.round(ms / 3600000)), 'hodin');
  }

  // výchozí: dnes a za měsíc
  function pad(n){ return (n<10?'0':'')+n; }
  var now = new Date();
  from.value = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
  var nm = new Date(now.getTime()+30*86400000);
  to.value = nm.getFullYear()+'-'+pad(nm.getMonth()+1)+'-'+pad(nm.getDate());

  [from, to].forEach(function (el) { el.addEventListener('input', compute); });
  compute();
})();
