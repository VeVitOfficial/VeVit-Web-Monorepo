// Cron výraz builder — obousměrný, český popis. Čistě client-side.
(function () {
  'use strict';
  var fieldIds = ['cb-min', 'cb-hour', 'cb-dom', 'cb-mon', 'cb-dow'];
  var fields = fieldIds.map(ToolUI.el);
  var expr = ToolUI.el('cb-expr'), desc = ToolUI.el('cb-desc'), err = ToolUI.el('cb-error');
  var presets = ToolUI.el('cb-presets'), copyBtn = ToolUI.el('cb-copy');

  var MONTHS = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
  var DAYS = ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'];
  var RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function validate(v, lo, hi) {
    var items = v.split(',');
    for (var i = 0; i < items.length; i++) {
      var part = items[i];
      var m = part.match(/^(\*|\d+|\*\/\d+|\d+-\d+|\d+\/\d+)$/);
      if (!m) throw new Error('Neplatná hodnota: "' + part + '".');
      if (part === '*') continue;
      if (/^\*\/\d+$/.test(part)) { var n = +part.slice(2); if (n < 1) throw new Error('Krok musí být ≥1: "' + part + '".'); continue; }
      if (/^\d+\/\d+$/.test(part)) { var a = +part.split('/')[0], st = +part.split('/')[1]; if (a < lo || a > hi || st < 1) throw new Error('Mimo rozsah: "' + part + '".'); continue; }
      if (/^\d+-\d+$/.test(part)) { var x = +part.split('-')[0], y = +part.split('-')[1]; if (x < lo || y > hi || x > y) throw new Error('Mimo rozsah: "' + part + '".'); continue; }
      var num = +part;
      if (hi === 7) { if (num !== 0 && num !== 7 && (num < 1 || num > 6)) throw new Error('Mimo rozsah: "' + part + '".'); }
      else if (num < lo || num > hi) throw new Error('Mimo rozsah: "' + part + '".');
    }
  }

  function nameVal(v, names, offset) {
    var n = parseInt(v, 10);
    if (!isNaN(n) && names) { var idx = n - (offset || 0); if (idx >= 0 && idx < names.length) return names[idx]; }
    return v;
  }

  function phrase(v, everyWord, unitGen, names, offset) {
    if (v === '*') return everyWord;
    var m;
    if ((m = v.match(/^\*\/(\d+)$/))) return 'každé ' + m[1] + '. ' + unitGen;
    if ((m = v.match(/^(\d+)-(\d+)$/))) return 'od ' + nameVal(m[1], names, offset) + ' do ' + nameVal(m[2], names, offset);
    if (v.indexOf(',') !== -1) return v.split(',').map(function (x) { return nameVal(x.trim(), names, offset); }).join(', ');
    return nameVal(v, names, offset);
  }

  function describe() {
    var parts = expr.value.trim().split(/\s+/);
    if (parts.length !== 5) throw new Error('Výraz musí mít 5 polí oddělených mezerou.');
    for (var i = 0; i < 5; i++) validate(parts[i], RANGES[i][0], RANGES[i][1]);

    var minP = phrase(parts[0], 'každou minutu', 'minuta', null, 0);
    var hourP = phrase(parts[1], 'každou hodinu', 'hodina', null, 0);
    var domP = phrase(parts[2], 'každý den', 'den', null, 0);
    var monP = phrase(parts[3], 'každý měsíc', 'měsíc', MONTHS, 1);
    var dowRaw = parts[4] === '7' ? '0' : parts[4];
    var dowP = phrase(dowRaw, 'každý den v týdnu', 'den v týdnu', DAYS, 0);

    var bits = [];
    if (parts[0] === '*') bits.push(minP); else bits.push('v ' + minP);
    if (parts[1] === '*') bits.push(hourP); else bits.push('v ' + hourP);
    if (parts[4] !== '*' && parts[4] !== '7') bits.push(dowP);
    else if (parts[4] === '7') bits.push('v neděli');
    if (parts[2] !== '*') bits.push(domP + ' v měsíci');
    if (parts[3] !== '*') bits.push('v ' + monP);
    if (parts[2] === '*') bits.push(domP);
    if (parts[3] === '*') bits.push(monP);

    desc.textContent = 'Spouští se ' + bits.join(', ') + '.';
  }

  function fieldsToExpr() {
    return fields.map(function (f) { return f.value.trim() || '*'; }).join(' ');
  }
  function exprToFields() {
    var parts = expr.value.trim().split(/\s+/);
    if (parts.length !== 5) return;
    for (var i = 0; i < 5; i++) if (fields[i].value !== parts[i]) fields[i].value = parts[i];
  }

  function refresh(fromExpr) {
    clearErr();
    if (fromExpr) exprToFields(); else expr.value = fieldsToExpr();
    try { describe(); }
    catch (e) { fail(e.message); desc.textContent = '—'; }
  }

  fields.forEach(function (f) { f.addEventListener('input', function () { refresh(false); }); });
  expr.addEventListener('input', function () { refresh(true); });
  presets.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cron]'); if (!b) return;
    expr.value = b.dataset.cron; refresh(true);
  });
  copyBtn.addEventListener('click', function () {
    if (!expr.value) return;
    navigator.clipboard.writeText(expr.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });

  refresh(false);
})();