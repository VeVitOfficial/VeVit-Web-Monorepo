// Unix timestamp ↔ datum, čistě client-side (Intl pro časová pásma).
(function () {
  'use strict';
  var seg = ToolUI.el('tc-mode'), tz = ToolUI.el('tc-tz');
  var ts = ToolUI.el('tc-ts'), unit = ToolUI.el('tc-unit'), date = ToolUI.el('tc-date');
  var out = ToolUI.el('tc-out'), rel = ToolUI.el('tc-rel'), err = ToolUI.el('tc-error');
  var mode = 't2d';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function zone() { return tz.value === 'local' ? undefined : tz.value; }

  function fmtInTZ(d, zone) {
    if (!zone) return d.toLocaleString(document.documentElement.lang || 'cs');
    return new Intl.DateTimeFormat('cs-CZ', { timeZone: zone, dateStyle: 'full', timeStyle: 'long' }).format(d);
  }

  function offsetStr(d, zone) {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(d);
    var p = parts.find(function (x) { return x.type === 'timeZoneName'; });
    if (!p || p.value === 'GMT') return '+0';
    return p.value.replace('GMT', '');
  }

  function zonedToMs(localStr, zone) {
    var guess = Date.parse(localStr + 'Z');
    if (isNaN(guess)) throw new Error('Neplatné datum.');
    var f = new Intl.DateTimeFormat('en-CA', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var parts = f.formatToParts(new Date(guess));
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var wallUTC = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second);
    var offset = wallUTC - guess;
    return guess - offset;
  }

  function relStr(d) {
    var diff = d.getTime() - Date.now();
    var abs = Math.abs(diff);
    var pre = diff > 0 ? 'za ' : 'před ';
    var sec = Math.round(abs / 1000);
    if (sec < 60) return pre + sec + ' s';
    var min = Math.round(sec / 60); if (min < 60) return pre + min + ' min';
    var h = Math.round(min / 60); if (h < 24) return pre + h + ' h';
    return pre + Math.round(h / 24) + ' d';
  }

  function compute() {
    clearErr();
    try {
      if (mode === 't2d') {
        var v = ts.value.trim();
        if (!v) { out.textContent = '—'; rel.textContent = '—'; return; }
        var n = Number(v);
        if (isNaN(n)) throw new Error('Timestamp musí být číslo.');
        if (unit.value === 's') n *= 1000;
        var d = new Date(n);
        if (isNaN(d.getTime())) throw new Error('Neplatný timestamp.');
        var z = zone();
        out.textContent = fmtInTZ(d, z) + (z ? ' (UTC' + offsetStr(d, z) + ')' : '');
        rel.textContent = relStr(d);
      } else {
        if (!date.value) { out.textContent = '—'; rel.textContent = '—'; return; }
        var z2 = tz.value;
        var ms = z2 === 'local' ? new Date(date.value).getTime() : zonedToMs(date.value, z2);
        var d2 = new Date(ms);
        if (isNaN(d2.getTime())) throw new Error('Neplatné datum.');
        out.textContent = String(Math.floor(d2.getTime() / 1000));
        rel.textContent = relStr(d2);
      }
    } catch (e) { fail(e.message); out.textContent = '—'; rel.textContent = '—'; }
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tc-group'), function (g) {
      g.classList.toggle('hidden', g.dataset.for !== mode);
    });
    compute();
  });

  ts.addEventListener('input', compute);
  date.addEventListener('input', compute);
  unit.addEventListener('change', compute);
  tz.addEventListener('change', compute);
})();
