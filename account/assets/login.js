(function () {
  var loginForm  = document.getElementById('loginForm');
  var inputEmail = document.getElementById('inputEmail');
  var inputPass  = document.getElementById('inputPass');
  var inputRemember = document.getElementById('inputRemember');
  var btnLogin    = document.getElementById('btnLogin');
  var authErr     = document.getElementById('authErr');
  var authErrMsg  = document.getElementById('authErrMsg');
  var passwordToggle = document.getElementById('toggleLoginPassword');
  var eyeOpen = passwordToggle.querySelector('[data-eye-open]');
  var eyeClosed = passwordToggle.querySelector('[data-eye-closed]');
  var loginGirlFrame = document.getElementById('loginGirlFrame');
  var girlFrames = [
    './images/holka odkryté oči.png',
    './images/zakrývání 1.png',
    './images/zakrývání 2.png',
    './images/holka zakryté oči.png'
  ];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var currentGirlFrame = 0;
  var girlFrameTimer = null;
  var passwordVisible = false;
  var oauthButtons = Array.prototype.slice.call(document.querySelectorAll('[data-oauth]'));
  var oauthStatus = document.getElementById('oauthStatus');

  girlFrames.forEach(function (src) {
    var image = new Image();
    image.src = src;
  });

  function showErr(msg) { authErrMsg.textContent = msg; authErr.removeAttribute('hidden'); }
  function hideErr()    { authErr.setAttribute('hidden', ''); }
  function setLoading(btn, on) { btn.disabled = on; btn.textContent = on ? 'Načítám…' : btn.dataset.label; }

  function showGirlFrame(index) {
    currentGirlFrame = index;
    loginGirlFrame.src = girlFrames[currentGirlFrame];
  }

  function animateGirlTo(targetFrame) {
    if (girlFrameTimer !== null) {
      window.clearTimeout(girlFrameTimer);
      girlFrameTimer = null;
    }

    if (reducedMotion.matches) {
      currentGirlFrame = targetFrame;
      showGirlFrame(currentGirlFrame);
      return;
    }

    function advanceFrame() {
      if (currentGirlFrame === targetFrame) {
        girlFrameTimer = null;
        return;
      }
      showGirlFrame(currentGirlFrame + (targetFrame > currentGirlFrame ? 1 : -1));
      if (currentGirlFrame !== targetFrame) {
        girlFrameTimer = window.setTimeout(advanceFrame, 110);
      } else {
        girlFrameTimer = null;
      }
    }

    advanceFrame();
  }

  passwordToggle.addEventListener('click', function () {
    passwordVisible = !passwordVisible;
    inputPass.type = passwordVisible ? 'text' : 'password';
    var accessibleLabel = passwordVisible ? 'Skrýt heslo' : 'Zobrazit heslo';
    passwordToggle.setAttribute('aria-pressed', passwordVisible ? 'true' : 'false');
    passwordToggle.setAttribute('aria-label', accessibleLabel);
    passwordToggle.title = accessibleLabel;
    eyeOpen.toggleAttribute('hidden', passwordVisible);
    eyeClosed.toggleAttribute('hidden', !passwordVisible);
    animateGirlTo(passwordVisible ? girlFrames.length - 1 : 0);
    inputPass.focus({ preventScroll: true });
  });

  window.addEventListener('pagehide', function () {
    if (girlFrameTimer !== null) window.clearTimeout(girlFrameTimer);
  });

  btnLogin.dataset.label    = 'Přihlásit se';

  var oauthErrors = { oauth_cancelled:'Přihlášení bylo zrušeno.', oauth_invalid_state:'Přihlášení nebylo dokončeno. Zkuste to znovu.', oauth_exchange_failed:'Přihlášení přes externí službu se nepodařilo.', oauth_profile_failed:'Údaje účtu se nepodařilo načíst. Zkuste to znovu.', oauth_email_missing:'Externí služba neposkytla e-mailovou adresu.', oauth_email_unverified:'Použijte u externí služby ověřený e-mail.', account_already_exists:'Účet s tímto e-mailem již existuje. Přihlaste se původní metodou a účet propojte v nastavení.', oauth_configuration_error:'Přihlášení přes tuto službu nyní není dostupné.' };
  var callbackError = new URLSearchParams(window.location.search).get('error');
  if (callbackError && oauthErrors[callbackError]) { showErr(oauthErrors[callbackError]); history.replaceState({}, document.title, window.location.pathname); }
  oauthButtons.forEach(function (button) { button.addEventListener('click', function () { if (button.disabled) return; oauthButtons.forEach(function (item) { item.disabled = true; }); button.querySelector('span').textContent = 'Přesměrování…'; oauthStatus.textContent = 'Přesměrování k externí službě…'; window.location.assign(button.dataset.url); }); });

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    hideErr();
    var identifier = inputEmail.value.trim();
    var pass  = inputPass.value;
    var remember = inputRemember.checked;
    if (!identifier) { showErr('Zadejte e-mail, telefon nebo přezdívku.'); return; }
    if (!pass) { showErr('Zadejte heslo.'); return; }
    setLoading(btnLogin, true);
    fetch('./api/login.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier, password: pass, remember: remember }),
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok) {
        location.replace(res.data.requires_2fa && res.data.redirect ? res.data.redirect : './index.html');
      } else {
        setLoading(btnLogin, false);
        showErr(res.data.error || 'Přihlášení selhalo.');
      }
    })
    .catch(function () {
      setLoading(btnLogin, false);
      showErr('Síťová chyba. Zkuste to znovu.');
    });
  });
}());
