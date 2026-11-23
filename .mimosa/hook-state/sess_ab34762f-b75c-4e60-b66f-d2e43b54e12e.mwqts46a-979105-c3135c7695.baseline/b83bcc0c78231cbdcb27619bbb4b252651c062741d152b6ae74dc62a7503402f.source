// Síla hesla — entropie + odhad doby prolomení, čistě client-side.
(function () {
  'use strict';
  var input = ToolUI.el('ps-pass'), toggle = ToolUI.el('ps-toggle');
  var fill = ToolUI.el('ps-fill'), label = ToolUI.el('ps-label');
  var entropyEl = ToolUI.el('ps-entropy'), lenEl = ToolUI.el('ps-len'), setsEl = ToolUI.el('ps-sets'), crackEl = ToolUI.el('ps-crack');

  var SETS = [
    { re: /[a-z]/, name: 'malá', size: 26 },
    { re: /[A-Z]/, name: 'velká', size: 26 },
    { re: /[0-9]/, name: 'číslice', size: 10 },
    { re: /[^a-zA-Z0-9]/, name: 'speciální', size: 33 }
  ];

  function fmtTime(secs) {
    if (!isFinite(secs)) return 'nezlomně dlouho';
    if (secs < 1) return 'okamžitě';
    var units = [['rok', 31536000], ['den', 86400], ['hodina', 3600], ['minuta', 60], ['sekunda', 1]];
    for (var i = 0; i < units.length; i++) {
      var v = secs / units[i][1];
      if (v >= 1) {
        var n = Math.round(v);
        var w = units[i][0];
        return n.toLocaleString('cs-CZ') + ' ' + w + (n === 1 ? '' : (w.endsWith('a') ? '' : (w.endsWith('e') ? '' : w.endsWith('den' ) ? 'dní' : '')));
      }
    }
    return 'okamžitě';
  }
  function fmtTimeSafe(secs) {
    if (!isFinite(secs)) return 'nezlomně dlouho';
    if (secs < 1) return 'okamžitě';
    var Y = 31536000, D = 86400, H = 3600, M = 60;
    if (secs >= Y) return (secs / Y).toFixed(1).replace('.', ',') + ' roku';
    if (secs >= D) return Math.round(secs / D) + ' dní';
    if (secs >= H) return Math.round(secs / H) + ' hod';
    if (secs >= M) return Math.round(secs / M) + ' min';
    return Math.round(secs) + ' s';
  }

  function analyze() {
    var pw = input.value;
    if (!pw) { fill.style.width = '0%'; label.textContent = '—'; entropyEl.textContent = '—'; lenEl.textContent = '—'; setsEl.textContent = '—'; crackEl.textContent = '—'; return; }
    var pool = 0, used = [];
    SETS.forEach(function (s) { if (s.re.test(pw)) { pool += s.size; used.push(s.name); } });
    if (pool === 0) pool = 1;
    var entropy = pw.length * Math.log2(pool);
    // 10^10 hádání/s (offline GPU útok na slabý hash)
    var guesses = Math.pow(2, entropy);
    var secs = guesses / 1e10 / 2; // průměrný čas poloviny prostoru
    lenEl.textContent = pw.length;
    setsEl.textContent = used.join(', ') || 'žádné rozpoznané sady';
    entropyEl.textContent = entropy.toFixed(1).replace('.', ',') + ' bitů';
    crackEl.textContent = fmtTimeSafe(secs);
    // vizuální stupnice 0-100 dle entropie (cap ~128 bit)
    var pct = Math.min(100, Math.round(entropy / 1.28));
    fill.style.width = pct + '%';
    var tone = entropy < 28 ? 'Velmi slabé' : entropy < 36 ? 'Slabé' : entropy < 60 ? 'Průměrné' : entropy < 80 ? 'Silné' : 'Velmi silné';
    var color = entropy < 28 ? '#ef4444' : entropy < 36 ? '#f59e0b' : entropy < 60 ? '#eab308' : entropy < 80 ? '#22c55e' : '#16a34a';
    fill.style.background = color;
    label.textContent = tone + ' · ' + entropy.toFixed(0) + ' bitů';
  }

  input.addEventListener('input', analyze);
  toggle.addEventListener('click', function () {
    input.type = input.type === 'password' ? 'text' : 'password';
  });
})();