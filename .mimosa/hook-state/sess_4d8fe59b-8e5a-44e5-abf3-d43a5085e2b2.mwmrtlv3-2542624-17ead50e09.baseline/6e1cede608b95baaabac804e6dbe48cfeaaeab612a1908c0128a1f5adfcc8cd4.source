// Generátor fiktivních testovacích dat (JSON/CSV), čistě client-side.
(function () {
  'use strict';
  var fieldsWrap = ToolUI.el('fd-fields'), count = ToolUI.el('fd-count');
  var format = ToolUI.el('fd-format'), out = ToolUI.el('fd-out');
  var gen = ToolUI.el('fd-gen'), dl = ToolUI.el('fd-dl');

  var FIELDS = [
    { k: 'name', l: 'Jméno' }, { k: 'email', l: 'E-mail' }, { k: 'phone', l: 'Telefon' },
    { k: 'username', l: 'Uživ. jméno' }, { k: 'city', l: 'Město' }, { k: 'zip', l: 'PSČ' },
    { k: 'street', l: 'Ulice' }, { k: 'company', l: 'Firma' }, { k: 'date', l: 'Datum' },
    { k: 'number', l: 'Číslo' }, { k: 'uuid', l: 'UUID' }, { k: 'boolean', l: 'Ano/Ne' },
    { k: 'ip', l: 'IP adresa' }, { k: 'password', l: 'Heslo' }
  ];
  var selected = ['name', 'email', 'phone', 'city'];

  var FIRST = ['Jan', 'Petr', 'Martin', 'Tomáš', 'Jakub', 'Lucie', 'Marie', 'Eva', 'Hana', 'Anna', 'Karel', 'Pavel', 'Vlasta', 'Miroslav', 'Lenka'];
  var LAST = ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec', 'Pokorný', 'Růžička', 'Mareš', 'Beneš'];
  var CITIES = ['Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Ústí n.L.', 'Hradec Králové', 'České Budějovice', 'Pardubice', 'Zlín', 'Karlovy Vary'];
  var STREETS = ['Nádražní', 'Hlavní', 'Komenského', 'Masarykova', 'Parková', 'Jablonského', 'Dukelská', 'Míru', 'Polní', 'Lesní'];
  var COMPS = ['Alfa s.r.o.', 'BetaTech a.s.', 'Gama CZ', 'Delta Services', 'Epsilon Group', 'Zeta Digital', 'Omega Trade'];

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rint(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
      var r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint8Array(1))[0] : Math.random() * 256;
      return (c ^ (r & 15) >> c / 4).toString(16);
    });
  }
  function slug(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, ''); }

  function genValue(k) {
    switch (k) {
      case 'name': return pick(FIRST) + ' ' + pick(LAST);
      case 'email': return slug(pick(FIRST)) + '.' + slug(pick(LAST)) + rint(1, 99) + '@' + pick(['example.com', 'test.cz', 'mail.cz', 'firma.cz']);
      case 'phone': return '+420 ' + rint(600, 799) + ' ' + rint(100, 999) + ' ' + rint(100, 999);
      case 'username': return slug(pick(FIRST)) + rint(10, 99);
      case 'city': return pick(CITIES);
      case 'zip': return String(rint(100, 799) * rint(1, 9)).slice(0, 3) + ' ' + rint(10, 99);
      case 'street': return pick(STREETS) + ' ' + rint(1, 200);
      case 'company': return pick(COMPS);
      case 'date': return rint(1970, 2024) + '-' + String(rint(1, 12)).padStart(2, '0') + '-' + String(rint(1, 28)).padStart(2, '0');
      case 'number': return rint(1, 9999);
      case 'uuid': return uuid();
      case 'boolean': return Math.random() > 0.5;
      case 'ip': return rint(1, 255) + '.' + rint(0, 255) + '.' + rint(0, 255) + '.' + rint(1, 254);
      case 'password': return Array.from({ length: 12 }, function () { return Math.random().toString(36).slice(2, 3); }).join('');
      default: return '';
    }
  }

  function escCSV(v, d) {
    var s = v == null ? '' : String(v);
    if (new RegExp('["' + (d === '\t' ? '\\t' : d) + '\\n]').test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function generate() {
    var n = Math.min(2000, Math.max(1, +count.value || 10));
    var rows = [];
    for (var i = 0; i < n; i++) {
      var row = {};
      selected.forEach(function (k) { row[k] = genValue(k); });
      rows.push(row);
    }
    if (format.value === 'json') out.value = JSON.stringify(rows, null, 2);
    else {
      var d = ',';
      var lines = [selected.join(d)];
      rows.forEach(function (r) { lines.push(selected.map(function (k) { return escCSV(r[k], d); }).join(d)); });
      out.value = lines.join('\n');
    }
    dl.disabled = !out.value;
  }

  function renderFields() {
    fieldsWrap.textContent = '';
    FIELDS.forEach(function (f) {
      var on = selected.indexOf(f.k) !== -1;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = on ? 'btn btn-primary' : 'btn btn-ghost';
      b.textContent = f.l;
      b.addEventListener('click', function () {
        var idx = selected.indexOf(f.k);
        if (idx === -1) selected.push(f.k); else selected.splice(idx, 1);
        renderFields();
      });
      fieldsWrap.appendChild(b);
    });
  }

  gen.addEventListener('click', generate);
  dl.addEventListener('click', function () {
    if (!out.value) return;
    var ext = format.value === 'json' ? 'json' : 'csv';
    var blob = new Blob([out.value], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fake-data.' + ext; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  renderFields();
})();