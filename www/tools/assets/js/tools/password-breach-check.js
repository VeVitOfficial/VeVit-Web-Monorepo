// Kontrola úniku hesla přes HIBP k-anonymity, čistě client-side.
(function () {
  'use strict';
  var input = ToolUI.el('bp-pass'), toggle = ToolUI.el('bp-toggle'), run = ToolUI.el('bp-run');
  var prog = ToolUI.el('bp-prog'), progLabel = ToolUI.el('bp-prog-label');
  var result = ToolUI.el('bp-result'), status = ToolUI.el('bp-status'), detail = ToolUI.el('bp-detail');
  var err = ToolUI.el('bp-error');

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('').toUpperCase(); }

  toggle.addEventListener('click', function () { input.type = input.type === 'password' ? 'text' : 'password'; });

  run.addEventListener('click', function () {
    clearErr();
    var pw = input.value;
    if (!pw) return fail('Zadejte heslo.');
    result.hidden = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 20, 'Počítám SHA-1…');
    crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw)).then(function (h) {
      var full = hex(h), prefix = full.substr(0, 5), suffix = full.substr(5);
      ToolUI.setProgress(prog, 45, 'Dotazuji HIBP (prefix ' + prefix + ')…');
      return fetch('https://api.pwnedpasswords.com/range/' + prefix).then(function (r) {
        if (!r.ok) throw new Error('HIBP odpovědělo chybou ' + r.status + '.');
        return r.text().then(function (text) {
          var found = 0;
          text.split(/\r?\n/).forEach(function (line) {
            var parts = line.split(':');
            if (parts[0] === suffix) found = parseInt(parts[1], 10) || 0;
          });
          ToolUI.setProgress(prog, 100, 'Hotovo');
          prog.classList.add('hidden'); progLabel.classList.add('hidden');
          result.hidden = false;
          if (found) {
            status.textContent = '⚠ Heslo uniklo!';
            status.style.color = '#ef4444';
            detail.textContent = 'Toto heslo se objevilo ve ' + found.toLocaleString('cs-CZ') + ' únicích. Doporučujeme ho změnit a nepoužívat znovu.';
          } else {
            status.textContent = '✓ Heslo nebylo nalezeno v únicích';
            status.style.color = '#22c55e';
            detail.textContent = 'V databázi HIBP (Have I Been Pwned) nebyla nalezena shoda. To neznamená absolutní bezpečnost — heslo stejně nikdy nesdílejte.';
          }
        });
      });
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden');
      fail(e && e.message ? e.message : 'Kontrola selhala. (Možná blokován síťový přístup k HIBP.)');
    });
  });
})();