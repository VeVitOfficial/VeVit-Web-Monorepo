// Počítadlo textu — živé statistiky, čistě client-side.
(function () {
  'use strict';
  var inEl = ToolUI.el('tc-in');
  var chars = ToolUI.el('tc-chars'), nospace = ToolUI.el('tc-nospace');
  var words = ToolUI.el('tc-words'), sent = ToolUI.el('tc-sent');
  var par = ToolUI.el('tc-par'), read = ToolUI.el('tc-read');

  function compute() {
    var t = inEl.value;
    chars.textContent = t.length.toLocaleString('cs-CZ');
    nospace.textContent = t.replace(/\s/g, '').length.toLocaleString('cs-CZ');
    var w = t.trim() ? t.trim().split(/\s+/).length : 0;
    words.textContent = w.toLocaleString('cs-CZ');
    var s = t.trim() ? (t.match(/[^.!?…]+[.!?…]+/g) || []).length || (t.trim() ? 1 : 0) : 0;
    sent.textContent = s.toLocaleString('cs-CZ');
    var p = t.trim() ? t.split(/\n\s*\n/).filter(function (b) { return b.trim(); }).length : 0;
    par.textContent = p.toLocaleString('cs-CZ');
    var min = w / 200;
    read.textContent = w === 0 ? '0 min' : (min < 1 ? '< 1 min' : Math.ceil(min) + ' min');
  }
  inEl.addEventListener('input', compute);
  compute();
})();