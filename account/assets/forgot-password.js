(function () {
  var btn      = document.getElementById('btnSend');
  var authErr  = document.getElementById('authErr');
  var authOk   = document.getElementById('authOk');
  var formWrap = document.getElementById('formWrap');

  btn.addEventListener('click', function () {
    authErr.setAttribute('hidden', '');
    var email = document.getElementById('inpEmail').value.trim();
    if (!email) { authErr.textContent = 'Zadejte e-mail.'; authErr.removeAttribute('hidden'); return; }
    btn.disabled = true;
    btn.textContent = 'Odesílám…';
    fetch('./api/forgot-password.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    })
    .then(function (r) { return r.json(); })
    .then(function () {
      formWrap.setAttribute('hidden', '');
      authOk.removeAttribute('hidden');
    })
    .catch(function () {
      btn.disabled = false;
      btn.textContent = 'Odeslat odkaz';
      authErr.textContent = 'Síťová chyba.';
      authErr.removeAttribute('hidden');
    });
  });
}());
