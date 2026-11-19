// Počítadlo textu — živé statistiky, čistě client-side.
(function () {
  'use strict';
  var inEl = ToolUI.el('tc-in');
  var chars = ToolUI.el('tc-chars'), nospace = ToolUI.el('tc-nospace');
  var words = ToolUI.el('tc-words'), sent = ToolUI.el('tc-sent');
  var par = ToolUI.el('tc-par'), read = ToolUI.el('tc-read');
  var locale = document.documentElement.lang || 'cs';
  var minuteUnit = ToolUI.el('tc-root').dataset.minuteUnit;

  function compute() {
    var t = inEl.value;
    chars.textContent = t.length.toLocaleString(locale);
    nospace.textContent = t.replace(/\s/g, '').length.toLocaleString(locale);
    var w = t.trim() ? t.trim().split(/\s+/).length : 0;
    words.textContent = w.toLocaleString(locale);
    var s = t.trim() ? (t.match(/[^.!?…]+[.!?…]+/g) || []).length || (t.trim() ? 1 : 0) : 0;
    sent.textContent = s.toLocaleString(locale);
    var p = t.trim() ? t.split(/\n\s*\n/).filter(function (b) { return b.trim(); }).length : 0;
    par.textContent = p.toLocaleString(locale);
    var min = w / 200;
    read.textContent = w === 0 ? '0 ' + minuteUnit : (min < 1 ? '< 1 ' + minuteUnit : Math.ceil(min) + ' ' + minuteUnit);
  }
  inEl.addEventListener('input', compute);
  compute();
})();
