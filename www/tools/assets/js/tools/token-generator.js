// Token generátor — kryptograficky náhodné tokeny, čistě client-side.
(function () {
  'use strict';
  var seg = ToolUI.el('tk-charset'), len = ToolUI.el('tk-len'), count = ToolUI.el('tk-count');
  var exc = ToolUI.el('tk-excamb'), gen = ToolUI.el('tk-gen'), copy = ToolUI.el('tk-copy');
  var out = ToolUI.el('tk-out'), err = ToolUI.el('tk-error');
  var cs = 'alnum';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  var SETS = {
    alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    hex: '0123456789abcdef',
    b64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    all: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>?'
  };
  var AMBIGUOUS = '0O1lI|`';

  function rand(n) { var a = new Uint32Array(n); crypto.getRandomValues(a); return a; }
  function pick(set) { var arr = rand(1); return set[arr[0] % set.length]; }

  function build() {
    var set = SETS[cs] || SETS.alnum;
    if (exc.checked) set = set.split('').filter(function (c) { return AMBIGUOUS.indexOf(c) < 0; }).join('');
    if (!set) return fail('Znaková sada je po vyloučení prázdná.');
    var n = Math.max(1, Math.min(256, parseInt(len.value, 10) || 32));
    var c = Math.max(1, Math.min(100, parseInt(count.value, 10) || 1));
    var lines = [];
    for (var k = 0; k < c; k++) {
      var r = rand(n);
      var s = '';
      for (var i = 0; i < n; i++) s += set[r[i] % set.length];
      lines.push(s);
    }
    out.value = lines.join('\n');
    copy.disabled = false;
    if (window.toast) toast.success(c + ' token(ů) vygenerováno');
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cs]'); if (!b) return;
    cs = b.dataset.cs;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
  });
  gen.addEventListener('click', function () { clearErr(); build(); });
  copy.addEventListener('click', function () { ToolUI.copyText(out.value, copy); });
})();