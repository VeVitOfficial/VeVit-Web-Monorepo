// Obsluha „Beta testing" formuláře na landingu. Jediné textové pole → /tools/api/feedback.php.
(function () {
  'use strict';
  var form = document.getElementById('beta-form');
  if (!form) return;
  var ta = document.getElementById('beta-message');
  var btn = document.getElementById('beta-send');
  var label = btn ? btn.querySelector('.beta-label') : null;
  var note = document.getElementById('beta-note');

  function setBusy(b) {
    if (btn) btn.disabled = b;
    if (label) label.textContent = b ? 'Odesílám…' : 'Odeslat hlášení';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = ta.value.trim();
    if (!msg) { if (window.toast) toast.error('Napište nejdřív, co se nepovedlo.'); else ta.focus(); return; }
    if (msg.length > 5000) { if (window.toast) toast.error('Zpráva je příliš dlouhá (max 5000 znaků).'); return; }
    setBusy(true);
    if (note) note.classList.add('hidden');
    fetch('/tools/api/feedback.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    }).then(function (res) {
      return res.json().then(function (d) { return { ok: res.ok, d: d }; });
    }).then(function (r) {
      setBusy(false);
      if (r.ok && r.d && r.d.ok) {
        ta.value = '';
        if (window.toast) toast.success(r.d.message || 'Hlášení odesláno. Děkujeme!');
        if (note) note.classList.remove('hidden');
      } else {
        if (window.toast) toast.error((r.d && r.d.message) || 'Odeslání selhalo.');
      }
    }).catch(function () {
      setBusy(false);
      if (window.toast) toast.error('Spojení selhalo. Zkuste to později.');
    });
  });
})();