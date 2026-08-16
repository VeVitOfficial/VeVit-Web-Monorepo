// Validátor rodného čísla — formát + kontrolní součet (mod 11), čistě client-side.
(function () {
  'use strict';
  var status = ToolUI.el('bn-status');
  var dobRow = ToolUI.el('bn-dob-row'), dob = ToolUI.el('bn-dob');
  var sexRow = ToolUI.el('bn-sex-row'), sex = ToolUI.el('bn-sex');
  var ageRow = ToolUI.el('bn-age-row'), age = ToolUI.el('bn-age');
  var err = ToolUI.el('bn-error');

  function fail(m) {
    status.textContent = 'Neplatné'; status.style.color = 'var(--color-red)';
    [dobRow, sexRow, ageRow].forEach(function (r) { r.classList.add('hidden'); });
    err.textContent = m; err.classList.remove('hidden');
  }
  function ok(info) {
    status.textContent = 'Platné'; status.style.color = 'var(--color-emerald)';
    err.classList.add('hidden');
    dob.textContent = info.dob; dobRow.classList.remove('hidden');
    sex.textContent = info.sex; sexRow.classList.remove('hidden');
    age.textContent = info.age; ageRow.classList.remove('hidden');
  }

  function run() {
    var raw = ToolUI.el('bn-input').value || '';
    var s = raw.replace(/\s+/g, '').replace('/', '').toUpperCase();
    err.classList.add('hidden');
    if (!/^\d{9,10}$/.test(s)) return fail('Rodné číslo musí mít 9 nebo 10 číslic (RRMMDDXXXX případně s lomítkem).');

    var digits = s;
    var yy = parseInt(digits.slice(0, 2), 10);
    var mm = parseInt(digits.slice(2, 4), 10);
    var dd = parseInt(digits.slice(4, 6), 10);

    // kontrolní součet (pouze 10místné)
    if (digits.length === 10) {
      var n = parseInt(digits.slice(0, 9), 10);
      var check = n % 11;
      if (check === 10) check = 0;
      if (check !== parseInt(digits.slice(9, 10), 10))
        return fail('Selhal kontrolní součet (mod 11). Číslo není platné.');
    }

    // rok
    var year;
    if (digits.length === 9) year = 1900 + yy; // 9místné = před 1954
    else year = (yy >= 54) ? 1900 + yy : 2000 + yy;

    // měsíc / pohlaví
    var realMonth = mm, isFemale = false;
    if (mm > 70) { realMonth = mm - 70; isFemale = true; }
    else if (mm > 50) { realMonth = mm - 50; isFemale = true; }
    else realMonth = mm;

    // existence data
    var d = new Date(year, realMonth - 1, dd);
    if (d.getFullYear() !== year || d.getMonth() !== realMonth - 1 || d.getDate() !== dd)
      return fail('Datum vyplývající z čísla neexistuje (' + pad(yy) + '.' + pad(realMonth) + '.' + pad(dd) + ').');

    var today = new Date();
    var ageY = today.getFullYear() - year;
    var tmp = new Date(today.getFullYear(), realMonth - 1, dd);
    if (today < tmp) ageY--;

    ok({
      dob: d.toLocaleDateString('cs-CZ'),
      sex: isFemale ? 'Žena' : 'Muž',
      age: ageY < 0 ? '—' : ageY + ' let'
    });
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  ToolUI.el('bn-run').addEventListener('click', run);
  ToolUI.el('bn-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
})();