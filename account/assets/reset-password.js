(function () {
  var params   = new URLSearchParams(location.search);
  var token    = params.get('token') || '';
  var btn      = document.getElementById('btnSet');
  var authErr  = document.getElementById('authErr');
  var authOk   = document.getElementById('authOk');
  var formWrap = document.getElementById('formWrap');

  if (!token) {
    authErr.textContent = 'Neplatný odkaz. Požádejte o nový.';
    authErr.removeAttribute('hidden');
    formWrap.setAttribute('hidden', '');
  }

  btn.addEventListener('click', function () {
    authErr.setAttribute('hidden', '');
    var p1 = document.getElementById('inpPass').value;
    var p2 = document.getElementById('inpPass2').value;
    if (p1.length < 8) { authErr.textContent = 'Heslo musí mít alespoň 8 znaků.'; authErr.removeAttribute('hidden'); return; }
    if (p1 !== p2)     { authErr.textContent = 'Hesla se neshodují.'; authErr.removeAttribute('hidden'); return; }
    btn.disabled = true;
    btn.textContent = 'Ukládám…';
    fetch('./api/reset-password.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, new_password: p1 }),
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok) {
        formWrap.setAttribute('hidden', '');
        authOk.removeAttribute('hidden');
      } else {
        btn.disabled = false;
        btn.textContent = 'Nastavit heslo';
        authErr.textContent = res.data.error || 'Chyba.';
        authErr.removeAttribute('hidden');
      }
    })
    .catch(function () {
      btn.disabled = false;
      btn.textContent = 'Nastavit heslo';
      authErr.textContent = 'Síťová chyba.';
      authErr.removeAttribute('hidden');
    });
  });
}());
