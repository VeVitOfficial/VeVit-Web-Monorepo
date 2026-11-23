// Odstranění diakritiky (Unicode NFD fold), čistě client-side.
(function () {
  'use strict';
  var inEl = ToolUI.el('rd-in'), out = ToolUI.el('rd-out');
  var run = ToolUI.el('rd-run'), copyBtn = ToolUI.el('rd-copy');

  function strip(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function compute() {
    out.value = strip(inEl.value);
    copyBtn.disabled = !out.value;
  }
  run.addEventListener('click', compute);
  inEl.addEventListener('input', compute);
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
})();