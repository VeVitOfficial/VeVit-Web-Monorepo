// Lorem ipsum generátor, čistě client-side.
(function () {
  'use strict';
  var count = ToolUI.el('li-count'), unit = ToolUI.el('li-unit'), classic = ToolUI.el('li-classic');
  var out = ToolUI.el('li-out'), copyBtn = ToolUI.el('li-copy'), gen = ToolUI.el('li-gen');

  var WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');
  var START = 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(' ');

  function rint(n) { return Math.floor(Math.random() * n); }
  function word() { return WORDS[rint(WORDS.length)]; }
  function sentence() {
    var n = 6 + rint(10), parts = [];
    for (var i = 0; i < n; i++) parts.push(word());
    var s = parts.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }
  function paragraph() {
    var n = 3 + rint(4), parts = [];
    for (var i = 0; i < n; i++) parts.push(sentence());
    return parts.join(' ');
  }

  function generate() {
    var n = Math.min(100, Math.max(1, +count.value || 3));
    var result;
    if (unit.value === 'words') {
      var w = [];
      if (classic.checked) w = w.concat(START);
      while (w.length < n) w.push(word());
      if (w.length > n) w = w.slice(0, n);
      result = w.join(' ');
    } else if (unit.value === 'sentences') {
      var arr = [];
      if (classic.checked) {
        var s0 = START.join(' '); arr.push(s0.charAt(0).toUpperCase() + s0.slice(1) + '.');
      }
      while (arr.length < n) arr.push(sentence());
      result = arr.slice(0, n).join(' ');
    } else {
      var paras = [];
      if (classic.checked) {
        var p0 = START.join(' ') + ' ' + sentence();
        paras.push(p0);
      }
      while (paras.length < n) paras.push(paragraph());
      result = paras.slice(0, n).join('\n\n');
    }
    out.value = result;
    copyBtn.disabled = !out.value;
  }

  gen.addEventListener('click', generate);
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
  generate();
})();