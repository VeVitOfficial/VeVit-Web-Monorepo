// Převodník IBAN — český účet ↔ IBAN, mod 97 kontrolní součet. Čistě client-side.
(function () {
  'use strict';
  var seg = ToolUI.el('iban-mode'), toWrap = ToolUI.el('iban-to'), fromWrap = ToolUI.el('iban-from');
  var out = ToolUI.el('iban-out'), outK = ToolUI.el('iban-out-k');
  var detRow = ToolUI.el('iban-det-row'), det = ToolUI.el('iban-det');
  var err = ToolUI.el('iban-error'), copyBtn = ToolUI.el('iban-copy');
  var lastOut = '';
  var mode = 'to';

  function err_(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function pad(s, n) { while (s.length < n) s = '0' + s; return s; }
  // mod 97 pro velká čísla (řetězcově)
  function mod97(s) {
    var rem = 0;
    for (var i = 0; i < s.length; i++) rem = (rem * 10 + parseInt(s[i], 10)) % 97;
    return rem;
  }

  // "předčíslí-číslo/kód" → {bank, prefix, account}
  function parseAcc(raw) {
    if (!raw) return null;
    var s = raw.replace(/\s+/g, '').toUpperCase();
    var bank = '', prefix = '000000', account = '';
    var m = s.split('/');
    var main = m[0];
    if (m.length === 2) bank = m[1];
    var parts = main.split('-');
    if (parts.length === 2) { prefix = parts[0]; account = parts[1]; }
    else account = parts[0];
    if (!/^\d+$/.test(bank) || bank.length !== 4) return { error: 'Kód banky musí mít 4 číslice (např. /0800).' };
    if (!/^\d{1,6}$/.test(prefix)) return { error: 'Předčíslí může mít max. 6 číslic.' };
    if (!/^\d{1,10}$/.test(account)) return { error: 'Číslo účtu může mít max. 10 číslic.' };
    return { bank: bank, prefix: pad(prefix, 6), account: pad(account, 10) };
  }

  function accToIban(a) {
    var bban = a.bank + a.prefix + a.account; // 24 číslic
    // kontrolní součet: BBAN + CZ00, písmena C=12 Z=35 → BBAN + "123500"
    var n = bban + '1235' + '00';
    var check = 98 - mod97(n);
    var checkStr = (check < 10 ? '0' : '') + check;
    return 'CZ' + checkStr + bban;
  }

  function ibanToAcc(raw) {
    if (!raw) return { error: 'Zadejte IBAN.' };
    var s = raw.replace(/\s+/g, '').toUpperCase();
    if (s.length !== 24) return { error: 'Český IBAN musí mít 24 znaků (zadáno ' + s.length + ').' };
    if (s.slice(0, 2) !== 'CZ') return { error: 'IBAN musí začínat na CZ.' };
    var checkStr = s.slice(2, 4);
    var bban = s.slice(4);
    // ověř kontrolní součet: přeskládej → BBAN + "1235" + check
    var n = bban + '1235' + checkStr;
    if (mod97(n) !== 1) return { error: 'Neplatný kontrolní součet IBAN.' };
    var bank = bban.slice(0, 4), prefix = bban.slice(4, 10), account = bban.slice(10, 24);
    return { bank: bank, prefix: prefix, account: account };
  }

  function fmtAcc(a) {
    var p = a.prefix.replace(/^0+/, '') || '0';
    var acc = a.account.replace(/^0+/, '') || '0';
    return (a.prefix.replace(/^0+/, '') ? p + '-' : '') + acc + '/' + a.bank;
  }

  function run() {
    clearErr(); detRow.classList.add('hidden');
    if (mode === 'to') {
      var a = parseAcc(ToolUI.el('iban-acc').value);
      if (!a) return err_('Zadejte číslo účtu.');
      if (a.error) return err_(a.error);
      lastOut = accToIban(a);
      outK.textContent = 'IBAN';
      out.textContent = lastOut;
      det.textContent = a.bank + ' · ' + fmtAcc(a); detRow.classList.remove('hidden');
    } else {
      var r = ibanToAcc(ToolUI.el('iban-iban').value);
      if (r.error) return err_(r.error);
      lastOut = fmtAcc(r);
      outK.textContent = 'Číslo účtu';
      out.textContent = lastOut;
      det.textContent = 'CZ ' + r.bank + ' · banka'; detRow.classList.remove('hidden');
    }
    copyBtn.disabled = !lastOut;
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    toWrap.classList.toggle('hidden', mode !== 'to');
    fromWrap.classList.toggle('hidden', mode !== 'from');
    clearErr(); out.textContent = '—'; detRow.classList.add('hidden'); copyBtn.disabled = true; lastOut = '';
  });

  ToolUI.el('iban-run').addEventListener('click', run);
  ['iban-acc', 'iban-iban'].forEach(function (id) {
    ToolUI.el(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  });
  copyBtn.addEventListener('click', function () {
    if (!lastOut) return;
    navigator.clipboard.writeText(lastOut).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
})();