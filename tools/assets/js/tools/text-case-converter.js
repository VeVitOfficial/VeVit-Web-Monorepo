// Převodník velikosti písmen, čistě client-side.
(function () {
  'use strict';
  var inEl = ToolUI.el('tcc-in'), out = ToolUI.el('tcc-out');
  var copyBtn = ToolUI.el('tcc-copy'), btns = ToolUI.el('tcc-btns');

  function words(s) {
    return s.split(/([A-Za-zÀ-ž0-9]+)/).filter(function (x) { return /[A-Za-zÀ-ž0-9]/.test(x); });
  }
  var F = {
    upper: function (s) { return s.toUpperCase(); },
    lower: function (s) { return s.toLowerCase(); },
    title: function (s) {
      return s.toLowerCase().replace(/(^|\s|[“”„"])([a-zà-ž])/g, function (m, p, c) { return p + c.toUpperCase(); });
    },
    sentence: function (s) {
      var low = s.toLowerCase();
      return low.replace(/(^\s*|[.!?…]\s+)([a-zà-ž])/g, function (m, p, c) { return p + c.toUpperCase(); });
    },
    camel: function (s) {
      var w = words(s).map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(); });
      if (!w.length) return '';
      w[0] = w[0].toLowerCase();
      return w.join('');
    },
    pascal: function (s) { return words(s).map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(); }).join(''); },
    snake: function (s) { return words(s).map(function (x) { return x.toLowerCase(); }).join('_'); },
    kebab: function (s) { return words(s).map(function (x) { return x.toLowerCase(); }).join('-'); },
    const: function (s) { return words(s).map(function (x) { return x.toUpperCase(); }).join('_'); }
  };

  btns.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-fn]'); if (!b) return;
    var fn = F[b.dataset.fn];
    out.value = fn ? fn(inEl.value) : '';
    copyBtn.disabled = !out.value;
  });
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
})();