// Práce s řádky textu, čistě client-side.
(function () {
  'use strict';
  var inEl = ToolUI.el('lt-in'), out = ToolUI.el('lt-out');
  var copyBtn = ToolUI.el('lt-copy'), back = ToolUI.el('lt-back'), btns = ToolUI.el('lt-btns');

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var OPS = {
    sort: function (l) { return l.slice().sort(function (a, b) { return a.localeCompare(b, 'cs'); }); },
    sortdesc: function (l) { return l.slice().sort(function (a, b) { return b.localeCompare(a, 'cs'); }); },
    unique: function (l) { var s = []; l.forEach(function (x) { if (s.indexOf(x) === -1) s.push(x); }); return s; },
    trim: function (l) { return l.map(function (x) { return x.trim(); }); },
    nonempty: function (l) { return l.filter(function (x) { return x.trim() !== ''; }); },
    reverse: function (l) { return l.slice().reverse(); },
    shuffle: function (l) { return shuffle(l.slice()); },
    number: function (l) { return l.map(function (x, i) { return (i + 1) + '. ' + x; }); },
    'dedup-blank': function (l) {
      var r = [], prevBlank = false;
      l.forEach(function (x) { var b = x.trim() === ''; if (b && prevBlank) return; r.push(x); prevBlank = b; });
      return r;
    }
  };

  btns.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-op]'); if (!b) return;
    var op = OPS[b.dataset.op];
    var lines = inEl.value.split('\n');
    var res = op(lines);
    out.value = res.join('\n');
    copyBtn.disabled = !out.value;
  });
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
  back.addEventListener('click', function () { inEl.value = out.value; out.value = ''; copyBtn.disabled = true; });
})();