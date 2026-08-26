(function () {
  var loginForm  = document.getElementById('loginForm');
  var inputEmail = document.getElementById('inputEmail');
  var inputPass  = document.getElementById('inputPass');
  var inputRemember = document.getElementById('inputRemember');
  var hpConfirm  = document.getElementById('hpConfirm');
  var hpTs       = document.getElementById('hpTs');
  hpTs.value = String(Date.now());
  var btnLogin    = document.getElementById('btnLogin');
  var authErr     = document.getElementById('authErr');
  var authErrMsg  = document.getElementById('authErrMsg');
  var passwordToggle = document.getElementById('toggleLoginPassword');
  var eyeOpen = passwordToggle.querySelector('[data-eye-open]');
  var eyeClosed = passwordToggle.querySelector('[data-eye-closed]');
  var loginGirlFrame = document.getElementById('loginGirlFrame');
  // Absolutní cesty: login se servuje na locale-prefixed URL (/cs/account/login),
  // takže relativní ./images/ by se vyřešilo vůči /cs/account/images/ a vrátilo 404
  // (statické assety se servují z /account/images/ bez locale prefixu).
  var girlFrames = [
    '/account/images/holka odkryté oči.webp',
    '/account/images/zakrývání 1.webp',
    '/account/images/zakrývání 2.webp',
    '/account/images/holka zakryté oči.webp'
  ];
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var currentGirlFrame = 0;
  var girlFrameTimer = null;
  var passwordVisible = false;
  var oauthButtons = Array.prototype.slice.call(document.querySelectorAll('[data-oauth]'));
  var oauthStatus = document.getElementById('oauthStatus');
  // return_to z query (kam přesměrovat po loginu) — předáme serveru, ten přidá locale prefix.
  var returnUrl = new URLSearchParams(window.location.search).get('return_to') || '';
  var t = window.VVAccountI18n ? window.VVAccountI18n.t : function (k) { return k; };

  // Maskot se načítá lazy: .login-girl je skrytá ≤1120px (CSS), takže na mobilu
  // vůbec nestahujeme frame 0. Na desktopu nastavíme src = frame 0 (~107 KB WebP
  // místo původních 2,4 MB PNG). Zbylé 3 snímky animace (zakrývání očí) se preloadují
  // až při prvním focusu pole hesla — tedy až když je pravděpodobné, že uživatel
  // použije toggle pro odhalení hesla. Dříve se eager-preloadovaly všechny 4 (~9,7 MB).
  var restFramesPreloaded = false;
  function preloadRestFrames() {
    if (restFramesPreloaded) return;
    restFramesPreloaded = true;
    for (var i = 1; i < girlFrames.length; i++) {
      var image = new Image();
      image.src = girlFrames[i];
    }
  }
  if (window.matchMedia('(min-width: 1121px)').matches) {
    loginGirlFrame.src = girlFrames[0];
    inputPass.addEventListener('focus', preloadRestFrames, { once: true });
  }

  function showErr(msg) { authErrMsg.textContent = msg; authErr.removeAttribute('hidden'); }
  function hideErr()    { authErr.setAttribute('hidden', ''); }
  function setLoading(btn, on) { btn.disabled = on; btn.textContent = on ? t('auth.common.loading') : btn.dataset.label; }

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
    var accessibleLabel = passwordVisible ? t('auth.common.hidePassword') : t('auth.common.showPassword');
    passwordToggle.setAttribute('aria-pressed', passwordVisible ? 'true' : 'false');
    passwordToggle.setAttribute('aria-label', accessibleLabel);
    passwordToggle.title = accessibleLabel;
    eyeOpen.toggleAttribute('hidden', passwordVisible);
    eyeClosed.toggleAttribute('hidden', !passwordVisible);
    preloadRestFrames();
    animateGirlTo(passwordVisible ? girlFrames.length - 1 : 0);
    inputPass.focus({ preventScroll: true });
  });

  window.addEventListener('pagehide', function () {
    if (girlFrameTimer !== null) window.clearTimeout(girlFrameTimer);
  });

  btnLogin.dataset.label    = t('auth.login.submit');

  var oauthErrors = { oauth_cancelled:t('auth.common.oauthCancelled'), oauth_invalid_state:t('auth.common.oauthInvalidState'), oauth_exchange_failed:t('auth.common.oauthExchangeFailed'), oauth_profile_failed:t('auth.common.oauthProfileFailed'), oauth_email_missing:t('auth.common.oauthEmailMissing'), oauth_email_unverified:t('auth.common.oauthEmailUnverified'), account_already_exists:t('auth.common.accountAlreadyExists'), oauth_configuration_error:t('auth.common.oauthConfigError') };
  var callbackError = new URLSearchParams(window.location.search).get('error');
  if (callbackError && oauthErrors[callbackError]) { showErr(oauthErrors[callbackError]); history.replaceState({}, document.title, window.location.pathname); }
  oauthButtons.forEach(function (button) { button.addEventListener('click', function () { if (button.disabled) return; oauthButtons.forEach(function (item) { item.disabled = true; }); button.querySelector('span').textContent = t('auth.common.redirecting'); oauthStatus.textContent = t('auth.common.redirectingOauth'); window.location.assign(button.dataset.url); }); });

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    hideErr();
    var identifier = inputEmail.value.trim();
    var pass  = inputPass.value;
    var remember = inputRemember.checked;
    if (!identifier) { showErr(t('auth.login.errIdentifier')); return; }
    if (!pass) { showErr(t('auth.login.errPassword')); return; }
    setLoading(btnLogin, true);
    fetch('./api/login.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier, password: pass, remember: remember, return_to: returnUrl, hp_confirm: hpConfirm.value, hp_ts: Number(hpTs.value) }),
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (res.ok) {
        // Server vrací redirect s locale prefixem (/cs/account, /de/account/security, …).
        location.replace(res.data.redirect ? res.data.redirect : './index.html');
      } else {
        setLoading(btnLogin, false);
        showErr(res.data.error || t('auth.login.errFailed'));
      }
    })
    .catch(function () {
      setLoading(btnLogin, false);
      showErr(t('auth.common.networkError'));
    });
  });
}());
