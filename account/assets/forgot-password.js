(function () {
  var t = window.VVAccountI18n ? window.VVAccountI18n.t : function (k) { return k; };
  var btn      = document.getElementById('btnSend');
  var authErr  = document.getElementById('authErr');
  var authOk   = document.getElementById('authOk');
  var formWrap = document.getElementById('formWrap');
  var hpConfirm = document.getElementById('hpConfirm');
  var hpTs     = document.getElementById('hpTs');
  hpTs.value = String(Date.now());

  btn.addEventListener('click', function () {
    authErr.setAttribute('hidden', '');
    var email = document.getElementById('inpEmail').value.trim();
    if (!email) { authErr.textContent = t('auth.forgot.errEmail'); authErr.removeAttribute('hidden'); return; }
    btn.disabled = true;
    btn.textContent = t('auth.forgot.submitting');
    fetch('./api/forgot-password.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, hp_confirm: hpConfirm.value, hp_ts: Number(hpTs.value) }),
    })
    .then(function (r) { return r.json(); })
    .then(function () {
      formWrap.setAttribute('hidden', '');
      authOk.removeAttribute('hidden');
    })
    .catch(function () {
      btn.disabled = false;
      btn.textContent = t('auth.forgot.submit');
      authErr.textContent = t('auth.common.networkErrorShort');
      authErr.removeAttribute('hidden');
    });
  });
}());
