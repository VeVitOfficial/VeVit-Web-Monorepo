// Regex tester — live přepočet, zvýraznění shod pomocí ⦅⦆ (jako originál).
(function () {
  var pattern = document.getElementById('rx-pattern');
  var flags = document.getElementById('rx-flags');
  var text = document.getElementById('rx-text');
  var errEl = document.getElementById('rx-error');
  var outWrap = document.getElementById('rx-out-wrap');
  var highlight = document.getElementById('rx-highlight');
  var count = document.getElementById('rx-count');

  function compute() {
    var p = pattern.value, f = flags.value, t = text.value;
    if (!p || !t) {
      errEl.classList.add('hidden'); errEl.textContent = '';
      outWrap.classList.add('hidden');
      return;
    }
    var regex;
    try { regex = new RegExp(p, f); }
    catch (e) {
      errEl.textContent = e.message; errEl.classList.remove('hidden');
      outWrap.classList.add('hidden');
      return;
    }
    errEl.classList.add('hidden'); errEl.textContent = '';

    var matches = [];
    try {
      var m = t.matchAll(regex);
      for (var it = m.next(); !it.done; it = m.next()) matches.push(it.value);
    } catch (e) { /* matchAll vyžaduje flag g — fallback */ }

    var highlighted = t.replace(regex, function (match) { return '⦅' + match + '⦆'; });
    // textContent → bezpečné vůči XSS (uživatelský vstup se nikdy neparseuje jako HTML).
    highlight.textContent = highlighted || t;
    count.textContent = String(matches.length);
    outWrap.classList.remove('hidden');
  }

  [pattern, flags, text].forEach(function (el) {
    el.addEventListener('input', compute);
  });
})();