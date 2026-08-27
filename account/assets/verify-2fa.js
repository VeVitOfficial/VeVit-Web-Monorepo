(function initTwoFactorVerification() {
  'use strict';
  const t = window.VVAccountI18n ? window.VVAccountI18n.t : (k) => k;
  let recovery = false;
  const form = document.getElementById('form');
  const code = document.getElementById('code');
  const button = document.getElementById('submit');
  const status = document.getElementById('status');
  const toggle = document.getElementById('switch');
  const description = document.getElementById('description');
  // Staticky servírovaná stránka nemůže do data-challenge vložit ?challenge= ze URL,
  // takže ho vezmeme z query (s fallbackem na data-challenge pro PHP-renderovanou verzi).
  var challenge = form.dataset.challenge || new URLSearchParams(window.location.search).get('challenge') || '';

  toggle.addEventListener('click', () => {
    recovery = !recovery;
    code.value = '';
    code.maxLength = recovery ? 14 : 6;
    code.autocomplete = recovery ? 'off' : 'one-time-code';
    description.textContent = recovery ? t('auth.verify2fa.recoveryDesc') : t('auth.verify2fa.desc');
    toggle.textContent = recovery ? t('auth.verify2fa.switchApp') : t('auth.verify2fa.switchRecovery');
    code.focus();
  });
  code.addEventListener('input', () => {
    code.value = recovery
      ? code.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 14)
      : code.value.replace(/\D/g, '').slice(0, 6);
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = '';
    try {
      const endpoint = recovery ? 'recovery-verify.php' : 'login-verify.php';
      const response = await fetch('/account/api/2fa/' + endpoint, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, code: code.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('auth.verify2fa.errFailed'));
      location.replace(data.redirect);
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
    }
  });
  code.focus();
})();
