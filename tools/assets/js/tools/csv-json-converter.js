// CSV ↔ JSON převodník, čistě client-side (vlastní parser/emiter, bez knihoven).
(function () {
  'use strict';
  var seg = ToolUI.el('cj-mode'), inEl = ToolUI.el('cj-in'), out = ToolUI.el('cj-out');
  var delimEl = ToolUI.el('cj-delim'), run = ToolUI.el('cj-run');
  var copyBtn = ToolUI.el('cj-copy'), swap = ToolUI.el('cj-swap'), err = ToolUI.el('cj-error');
  var mode = 'c2j';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function delim() {
    return delimEl.value || ',';
  }

  function parseCSV(text, d) {
    var rows = [], row = [], field = '', inQ = false, i = 0;
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    while (i < text.length) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQ = true; i++; continue; }
      if (c === d) { row.push(field); field = ''; i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function csvToJSON(text, d) {
    var rows = parseCSV(text, d);
    if (!rows.length) return '[]';
    // odstraň prázdné řádky na konci
    while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
    if (!rows.length) return '[]';
    var headers = rows[0];
    var arr = [];
    for (var r = 1; r < rows.length; r++) {
      if (rows[r].length === 1 && rows[r][0] === '') continue;
      var obj = {};
      for (var c = 0; c < headers.length; c++) obj[headers[c]] = rows[r][c] != null ? rows[r][c] : '';
      arr.push(obj);
    }
    return JSON.stringify(arr, null, 2);
  }

  function esc(v, d) {
    if (v == null) return '';
    var s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (new RegExp('["' + (d === '\t' ? '\\t' : d) + '\\n]').test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function jsonToCSV(text, d) {
    var data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('JSON musí být pole (objektů nebo polí).');
    if (!data.length) return '';
    var headers, isArr = Array.isArray(data[0]);
    if (isArr) {
      var max = 0; data.forEach(function (r) { if (r.length > max) max = r.length; });
      headers = []; for (var i = 0; i < max; i++) headers.push('col' + (i + 1));
    } else {
      var set = [];
      data.forEach(function (o) { for (var k in o) if (set.indexOf(k) === -1) set.push(k); });
      headers = set;
    }
    var lines = [headers.map(function (h) { return esc(h, d); }).join(d)];
    data.forEach(function (row) {
      if (isArr) lines.push(headers.map(function (_, i) { return esc(row[i], d); }).join(d));
      else lines.push(headers.map(function (h) { return esc(row[h], d); }).join(d));
    });
    return lines.join('\n');
  }

  function convert() {
    clearErr();
    if (!inEl.value.trim()) { out.value = ''; copyBtn.disabled = true; return; }
    try {
      out.value = mode === 'c2j' ? csvToJSON(inEl.value, delim()) : jsonToCSV(inEl.value, delim());
      copyBtn.disabled = !out.value;
    } catch (e) { out.value = ''; copyBtn.disabled = true; fail(mode === 'c2j' ? 'Neplatný CSV: ' + e.message : 'Neplatný JSON: ' + e.message); }
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  });
  run.addEventListener('click', convert);
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
  swap.addEventListener('click', function () {
    inEl.value = out.value;
    var other = mode === 'c2j' ? 'j2c' : 'c2j';
    var btn = seg.querySelector('button[data-mode="' + other + '"]'); if (btn) btn.click();
    convert();
  });
})();